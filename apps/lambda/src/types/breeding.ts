export type SpeciesRow = {
  id: string;
  species: string;
  primary_type: string;
  secondary_type: string;
}

export type BreedingParent = {
  id: number;
  tokenId: number;
  gender: string;
  species_id: string;
  species: string;
  primary_type: string;
  secondary_type: string;
  generation: number;
  total_breeds: number;
  last_breed_time: string;
  owner: string;
}

export type BreedingRequest = {
  id: string;
  request_id: number;
  amount_paid: number;
  status: "UNSET" | "PENDING" | "APPROVED" | "DENIED";
  tx: {
    hash: string;
    block_number: number;
    timestamp: string;
  };
  breeder: string;
  parent1: BreedingParent;
  parent2: BreedingParent;
};