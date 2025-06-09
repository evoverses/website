import { evoByIdQuery } from "@/lib/evo/queries";
import { SquidAsset } from "../squid/types";
import { fetchSquid } from "../squid/utils";

export const fetchSquidAsset = async (tokenId: string, next: NextFetchRequestConfig = {}) => {
  const result = await fetchSquid<{ evoById: SquidAsset }>(
    "EvoByIdQuery",
    evoByIdQuery,
    { tokenId },
    next,
  );
  return result.evoById;
};
