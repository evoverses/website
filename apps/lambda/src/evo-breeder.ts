import type { Context, SQSEvent } from "aws-lambda";
import { DatabaseClient } from "@/utils/db";
import { getSecret } from "@/utils/aws/secrets";
import { BreedingRequest, SpeciesRow } from "@/types/breeding";

type ResourceProperties = {
  adminSecretArn: string;
  database: string;
  schema: string;
}

const ether = 10n ** 18n;
const baseCost = 500n * ether;

export const handler = async (event: SQSEvent, ctx: Context) => {
  const { adminSecretArn, database, schema } = event.ResourceProperties;
  const requestId = 0;
  const admin = await getSecret(adminSecretArn);
  const client = await DatabaseClient.newClient(admin.username, admin.password);

  let tokenId = 0;
  let breeder = ""
  await client.query("BEGIN");
  try {
    const breedingRequestQueryResult = await client.query<BreedingRequest>(`SELECT *
                                                                            FROM get_breeding_request_by_id(${requestId})`);
    if (breedingRequestQueryResult.rows.length === 0) {
      throw new Error("No request found");
    }

    const { parent1: p1, parent2: p2, ...breedingRequest } = breedingRequestQueryResult.rows[0];
    if (breedingRequest.request_id !== requestId) {
      throw new Error("Request ID mismatch");
    }

    if (breedingRequest.status !== "PENDING") {
      throw new Error("Request is not pending");
    }

    // Gender Checks
    if (p1.gender === p2.gender) {
      throw new Error("Parent genders must be different");
    }
    if ([p1.gender, p2.gender].includes("unknown")) {
      throw new Error("Parent genders must be known");
    }

    // Element / Species Checks
    const speciesMatch = p1.species === p2.species;
    if (!speciesMatch) {
      const p1Elems = [p1.primary_type, p1.secondary_type].filter(element => element && element.toLowerCase() !== "none");
      const p2Elems = [p2.primary_type, p2.secondary_type].filter(element => element && element.toLowerCase() !== "none");
      const elemIntersection = p1Elems.filter(element => p2Elems.includes(element));
      if (elemIntersection.length === 0) {
        throw new Error("Parent species must have a common element");
      }
    }

    // Generation Checks
    if (p1.generation > 0 && p1.total_breeds >= 5) {
      throw new Error("Maximum breeds reached for parent 1");
    }
    if (p2.generation > 0 && p2.total_breeds >= 5) {
      throw new Error("Maximum breeds reached for parent 2");
    }

    // Fee Checks
    const paid = BigInt(breedingRequest.amount_paid);
    const cost = calculateCost(p1.generation, p1.total_breeds) + calculateCost(p2.generation, p2.total_breeds);
    if (paid < cost) {
      throw new Error("Insufficient amount paid");
    }

    // Time Checks
    if (assertBreedOffCooldown(new Date(p1.last_breed_time), p1.generation, new Date(breedingRequest.tx.timestamp))) {
      throw new Error("Parent 1 on cooldown");
    }
    if (assertBreedOffCooldown(new Date(p2.last_breed_time), p2.generation, new Date(breedingRequest.tx.timestamp))) {
      throw new Error("Parent 2 on cooldown");
    }

    // Ownership checks
    if (p1.owner !== breedingRequest.breeder) {
      throw new Error("Breeder does not own parent 1");
    }
    if (p2.owner !== breedingRequest.breeder) {
      throw new Error("Breeder does not own parent 2");
    }

    const generation = BigInt(Math.max(p1.generation, p2.generation) + 1);
    console.log("Egg generation: ", generation);
    const rng = Math.random();
    console.log("Random number: ", rng);

    const speciesQueryResult = await client.query<SpeciesRow>("SELECT * FROM species WHERE in_breeding_pool=TRUE");
    if (speciesQueryResult.rows.length === 0) {
      throw new Error("No species in breeding pool");
    }
    const speciesOpts = speciesQueryResult.rows;

    let speciesId = "";
    // 50% chance if matching parent species
    if (speciesMatch && rng < 0.5) {
      speciesId = p1.species_id;
      // 12.5% chance otherwise for each parent
    } else if (rng < 0.125) {
      speciesId = p1.species_id;
    } else if (rng < 0.25) {
      speciesId = p2.species_id;
    } else {
      const opts = speciesOpts.filter(r => r.species !== p1.species && r.species !== p2.species);
      if (opts.length === 0) {
        throw new Error("No valid species options after filtering parents out");
      }
      speciesId = opts[Math.floor(Math.random() * opts.length)].id;
    }

    console.log(`Selected species: ${speciesOpts.find(r => r.id = speciesId)?.species} (${speciesId})`);

    const result = await client.query<{ next: number }>("SELECT COALESCE(MAX(token_id), 0) + 1 AS next FROM evo");
    tokenId = result.rows[0].next;
    breeder = breedingRequest.breeder;
    await client.queryFmt(
      "INSERT INTO evo (id, species_id, token_id, generation, created_at, updated_at, parent1_token_id, parent2_token_id) VALUES (%L)",
      [tokenId, speciesId, tokenId, generation, breedingRequest.tx.timestamp, breedingRequest.tx.timestamp, p1.tokenId, p2.tokenId],
    );
    await client.query(`SELECT update_breeding_request_parents(${requestId})`);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    await client.disconnect();
    console.log("Error:", e);
    throw e;
  }
  await client.disconnect();
  console.log("Successfully bred tokenId: ", tokenId);

  // mint to chain


  return {
    PhysicalResourceId: "success",
  };
};

const calculateCost = (generation: number, totalBreeds: number): bigint => {
  const generationBaseCost = baseCost * 2n ** BigInt(generation);
  return generationBaseCost + (generationBaseCost * BigInt(totalBreeds));
};

const assertBreedOffCooldown = (lastBreedTime: Date, generation: number, requestTime: Date) => {
  const days = Math.max(1, 7 - generation);
  const cooldown = 1000 * 60 * 60 * 24 * days;
  const cooldownTime = new Date(lastBreedTime.getTime() + cooldown);
  return cooldownTime <= requestTime;
};