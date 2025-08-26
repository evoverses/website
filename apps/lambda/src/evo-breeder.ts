import type { CloudFormationCustomResourceEvent, Context } from "aws-lambda";
import { DatabaseClient } from "@/utils/db";
import { getSecret } from "@/utils/aws/secrets";

type ResourceProperties = {
  adminSecretArn: string;
  database: string;
  schema: string;
}
const ether = 10n ** 18n;
const baseCost = 500 * ether;

export const handler = async (event: CloudFormationCustomResourceEvent<ResourceProperties>, ctx: Context) => {
  const { adminSecretArn, database, schema } = event.ResourceProperties;
  const requestId = "get request id";
  const admin = await getSecret(adminSecretArn);
  const client = await DatabaseClient.newClient(admin.username, admin.password);

  const requests = await client.queryFmt("SELECT * FROM breeding_requests WHERE requestId = %I", requestId);
  if (requests.rows.length === 0) {
    throw new Error("No request found");
  }

  const request = requests.rows[0];
  if (request.requestId !== requestId) {
    throw new Error("Request ID mismatch");
  }

  if (request.status !== "PENDING") {
    throw new Error("Request is not pending");
  }
  const getParent = async (tokenId: string) => {
    const parentQuery = await client.queryFmt("SELECT * FROM evos WHERE tokenId = %I", tokenId);
    if (parentQuery.rows.length === 0) {
      throw new Error(`Parent ${tokenId} not found`);
    }
    const parent = parentQuery.rows[0];
    if (parent.tokenId !== tokenId) {
      throw new Error("Parent ID mismatch");
    }
    return parent;
  };

  const [p1, p2] = await Promise.all([getParent(request.parent1Id), getParent(request.parent2Id)]);

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
    const p1Elems = [p1.primaryEement, p1.secondaryElement].filter(element => element && element.toLowerCase() !== "none");
    const p2Elems = [p2.primaryElement, p2.secondaryElement].filter(element => element && element.toLowerCase() !== "none");
    const elemIntersection = p1Elems.filter(element => p2Elems.includes(element));
    if (elemIntersection.length === 0) {
      throw new Error("Parent species must have a common element");
    }
  }

  // Generation Checks
  if (p1.generation > 0 && p1.totalBreeds >= 5) {
    throw new Error("Maximum breeds reached for parent 1");
  }
  if (p2.generation > 0 && p2.totalBreeds >= 5) {
    throw new Error("Maximum breeds reached for parent 2");
  }

  // Fee Checks
  const paid = BigInt(request.amountPaid);
  const cost = calculateCost(p1.generation, p1.totalBreeds) + calculateCost(p2.generation, p2.totalBreeds);
  if (paid < cost) {
    throw new Error("Insufficient amount paid");
  }

  // Time Checks
  if (assertBreedOffCooldown(new Date(p1.lastBreedTime), BigInt(p1.generation), new Date(request.timestamp))) {
    throw new Error("Parent 1 on cooldown");
  }
  if (assertBreedOffCooldown(new Date(p2.lastBreedTime), BigInt(p2.generation), new Date(request.timestamp))) {
    throw new Error("Parent 2 on cooldown");
  }

  // Ownership checks
  if (p1.owner !== request.breeder) {
    throw new Error("Breeder does not own parent 1");
  }
  if (p2.owner !== request.breeder) {
    throw new Error("Breeder does not own parent 2");
  }

  // Generate new evo

  // store in db

  // mint to chain

  await client.disconnect();

  return {
    PhysicalResourceId: "success",
  };
};

const calculateCost = (generation: bigint, totalBreeds: bigint): bigint => {
  const generationBaseCost = baseCost * 2n ** generation;
  return generationBaseCost + (generationBaseCost * totalBreeds);
};

const assertBreedOffCooldown = (lastBreedTime: Date, generation: bigint, requestTime: Date) => {
  const days = Math.max(1, 7 - Number(generation));
  const cooldown = 1000 * 60 * 60 * 24 * days;
  const cooldownTime = new Date(lastBreedTime.getTime() + cooldown);
  return cooldownTime <= requestTime;
};