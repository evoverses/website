"use client";
import { fetchOwnedEvos } from "@/lib/nursery/owned";
import { evoNftContractAddress } from "@/data/addresses";
import { chain } from "@/lib/thirdweb/config";
import {
  nurseryClient,
  nurseryScope,
  nurseryConfigured,
  sameAddress,
  hermannAddress,
  hermannAbi,
  type Adult,
  type Egg,
  verifyNursery,
} from "@/lib/nursery/contracts";
import type { Parent } from "@/lib/nursery/rules";
import type { SquidAsset } from "@workspace/evoverses/lib/asset/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useActiveAccount,
  useActiveWallet,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import type { Address, Hex } from "viem";

export function useNurseryWallet() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const switchChain = useSwitchActiveWalletChain();
  const current = useRef({ account, wallet });
  current.current = { account, wallet };
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const guard = useCallback(async () => {
    if (
      !account ||
      current.current.account?.address !== account.address ||
      current.current.wallet !== wallet
    )
      throw new Error("Your wallet changed. Select your Evos again.");
    if (wallet?.getChain()?.id !== 43114) await switchChain(chain);
    if (
      current.current.account?.address !== account.address ||
      wallet?.getAccount()?.address !== account.address ||
      wallet?.getChain()?.id !== 43114
    )
      throw new Error("Connect the selected wallet to Avalanche C-Chain.");
    const code = await nurseryClient.getCode({
      address: account.address as Address,
    });
    if (code && code !== "0x")
      throw new Error(
        "Please connect a standard wallet for Nursery transactions.",
      );
    await verifyNursery();
    if (
      current.current.account?.address !== account.address ||
      wallet?.getChain()?.id !== 43114
    )
      throw new Error("Your wallet changed. Please try again.");
  }, [account, wallet, switchChain]);
  const run = async (action: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      const { nurseryError } = await import("@/lib/nursery/contracts");
      setError(nurseryError(e));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return { account, wallet, busy, error, guard, run };
}
export function useNow() {
  const [now, setNow] = useState<bigint>(0n);
  useEffect(() => {
    const tick = () => setNow(BigInt(Math.floor(Date.now() / 1000)));
    tick();
    const timer = setInterval(tick, 15_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
export function useOwnedEvos(address?: string) {
  const query = useInfiniteQuery({
    queryKey: ["nursery-owned", nurseryScope, address?.toLowerCase()],
    enabled: Boolean(address),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      fetchOwnedEvos(address!, pageParam, signal),
    getNextPageParam: (last) => last.nextPage ?? undefined,
    staleTime: 15_000,
  });
  const byId = new Map<string, SquidAsset>();
  query.data?.pages.forEach((page) =>
    page.items.forEach((asset) => {
      if (
        asset.chainId === "43114" &&
        sameAddress(asset.address, evoNftContractAddress) &&
        address &&
        sameAddress(asset.owner, address) &&
        /^\d+$/.test(asset.tokenId)
      )
        byId.set(asset.tokenId, asset);
    }),
  );
  return { ...query, assets: [...byId.values()] };
}
export type ParentOption = { asset: SquidAsset; parent: Parent };
const indexedParent = (asset: SquidAsset): Parent | null => {
  if (asset.metadata.type !== "EVO") return null;
  const m = asset.metadata;
  const timestamp = m.lastBreedTime ? Date.parse(m.lastBreedTime) : 0;
  if (
    ![m.generation, m.totalBreeds].every(
      (v) => Number.isSafeInteger(v) && v >= 0,
    ) ||
    !Number.isFinite(timestamp)
  )
    return null;
  return {
    tokenId: asset.tokenId,
    generation: BigInt(m.generation),
    totalBreeds: BigInt(m.totalBreeds),
    lastBreedTime: BigInt(Math.floor(timestamp / 1000)),
    gender: m.gender,
    primaryType: m.primaryType,
    secondaryType: m.secondaryType,
  };
};
export function useParents(assets: SquidAsset[], owner?: string) {
  const ids = assets.map((a) => a.tokenId);
  return useQuery({
    queryKey: ["nursery-parents", nurseryScope, owner, ids],
    enabled: Boolean(owner),
    refetchInterval: 15_000,
    queryFn: async (): Promise<ParentOption[]> => {
      if (!nurseryConfigured)
        return assets.flatMap((asset) => {
          const parent = indexedParent(asset);
          return parent ? [{ asset, parent }] : [];
        });
      const block = await nurseryClient.getBlock();
      // Canonical traits replace indexer metadata for compatibility, cooldowns and prices.
      const result = await nurseryClient.multicall({
        blockNumber: block.number,
        contracts: assets.flatMap((asset) => [
          {
            address: hermannAddress!,
            abi: hermannAbi,
            functionName: "adultOf",
            args: [BigInt(asset.tokenId)],
          },
          {
            address: hermannAddress!,
            abi: hermannAbi,
            functionName: "parentReservation",
            args: [BigInt(asset.tokenId)],
          },
        ]),
        allowFailure: true,
      });
      return assets.flatMap<ParentOption>((asset, i) => {
        const adultResult = result[i * 2];
        const reserved = result[i * 2 + 1];
        if (
          adultResult?.status !== "success" ||
          reserved?.status !== "success"
        ) {
          const parent = indexedParent(asset);
          return parent
            ? [{ asset, parent: { ...parent, available: false } }]
            : [];
        }
        const adult = adultResult.result as Adult;
        return [
          {
            asset,
            parent: {
              tokenId: asset.tokenId,
              generation: adult.generation,
              totalBreeds: adult.totalBreeds,
              lastBreedTime: adult.lastBreedTime,
              gender: Number(adult.attributes.gender),
              primaryType: Number(adult.attributes.primaryType),
              secondaryType: Number(adult.attributes.secondaryType),
              reserved: (reserved.result as bigint) !== 0n,
              available: true,
            },
          },
        ];
      });
    },
  });
}
export function useRemembered(kind: "breeds" | "eggs", address?: string) {
  const key = `evo-nursery:${nurseryScope}:${address?.toLowerCase()}:${kind}`;
  const [snapshot, setSnapshot] = useState<{ key: string; values: string[] }>({
    key: "",
    values: [],
  });
  const values = snapshot.key === key ? snapshot.values : [];
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      setSnapshot({
        key,
        values: Array.isArray(saved)
          ? saved.filter(
              (v) =>
                typeof v === "string" &&
                (kind === "eggs"
                  ? /^\d+$/.test(v)
                  : /^0x[\da-fA-F]{64}$/.test(v)),
            )
          : [],
      });
    } catch {
      setSnapshot({ key, values: [] });
    }
  }, [key, kind]);
  const remember = useCallback(
    (value: string | Hex) => {
      setSnapshot((previous) => {
        const old = previous.key === key ? previous.values : [];
        const next = [...new Set([value, ...old])];
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* On-chain recovery by transaction hash remains possible. */
        }
        return { key, values: next };
      });
    },
    [key],
  );
  return { values, remember };
}
export function useEgg(tokenId: string, owner?: string) {
  return useQuery({
    queryKey: ["nursery-egg", nurseryScope, tokenId, owner],
    enabled: nurseryConfigured && Boolean(owner),
    refetchInterval: 10_000,
    queryFn: async () => {
      const { ownerOf, readHermann } = await import("@/lib/nursery/contracts");
      const [currentOwner, egg, block] = await Promise.all([
        ownerOf(tokenId),
        readHermann<Egg>("eggs", [BigInt(tokenId)]),
        nurseryClient.getBlock(),
      ]);
      const fulfilled =
        egg[5] === 2
          ? (
              await readHermann<readonly [boolean, boolean, bigint]>(
                "randomness",
                [egg[6]],
              )
            )[1]
          : false;
      return {
        egg,
        fulfilled,
        owned: Boolean(owner && sameAddress(currentOwner, owner)),
        timestamp: block.timestamp,
      };
    },
  });
}
