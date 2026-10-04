import type { SquidAsset } from "@workspace/evoverses/lib/asset/types";

export type OwnedEvoPage = {
  items: SquidAsset[];
  nextPage: number | null;
  total: number;
};

export async function fetchOwnedEvos(
  owner: string,
  page: number,
  signal?: AbortSignal,
): Promise<OwnedEvoPage> {
  const query = new URLSearchParams({ owner, page: String(page) });
  const response = await fetch(`/api/nursery/evos?${query}`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not load your Evos from the data service.");
  return response.json();
}
