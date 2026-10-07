"use client";
import { useChainWallet } from "@/hooks/use-chain-wallet";
import { useOwnedEvos } from "@/components/nursery/hooks";
import { nurseryClient } from "@/lib/nursery/contracts";
import { evoNftContractAddress } from "@/data/addresses";
import { useQuery } from "@tanstack/react-query";
import { EvoImage } from "@workspace/evoverses/components/evo-image";
import { Button } from "@workspace/ui/components/button";
import { erc721Abi, type Address } from "viem";

export function WalletEvos() {
  const { account } = useChainWallet();
  const owned = useOwnedEvos(account?.address);
  const count = useQuery({
    queryKey: ["profile-wallet-evos", 43114, evoNftContractAddress, account?.address.toLowerCase()],
    enabled: Boolean(account),
    queryFn: async () => (await nurseryClient.readContract({ address: evoNftContractAddress, abi: erc721Abi, functionName: "balanceOf", args: [account!.address as Address] })).toString(),
    staleTime: 15_000, retry: 1,
  });
  return <section className="space-y-4 rounded-2xl border bg-card p-5" data-testid="profile-wallet-evos">
    <div><h2 className="text-lg font-bold">Your wallet Evos</h2><p className="mt-1 text-sm text-muted-foreground">Evos and eggs in your connected wallet.</p></div>
    {!account ? <p>Connect your wallet from the account menu to see your NFT Evos.</p> : <>
      <p className="text-sm text-muted-foreground">Wallet {account.address.slice(0,6)}…{account.address.slice(-4)} · Avalanche C-Chain</p>
      <p className="text-2xl font-extrabold" data-testid="profile-wallet-evo-count">{count.isError ? "Count unavailable" : count.data === undefined ? "Loading…" : `${BigInt(count.data).toLocaleString("en-US")} Evos & eggs`}</p>
      {count.data === "0" && !count.isError && <p>This wallet holds no NFT Evos or eggs.</p>}
      {(count.isError || owned.isError) && <div role="alert"><p>We couldn’t load all your wallet Evos. Your holdings have not changed.</p><Button className="mt-2" variant="outline" onClick={() => { void count.refetch(); void owned.refetch(); }}>Retry wallet Evos</Button></div>}
      {owned.isPending && <p role="status">Loading creature details…</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {owned.assets.map(asset => <div key={asset.tokenId} className="rounded-xl border bg-muted/20 p-3">
          <EvoImage asset={asset} className="w-full rounded-lg" loading="lazy" /><p className="mt-2 text-sm font-bold capitalize">{asset.metadata.species} #{asset.tokenId}</p><p className="text-xs text-muted-foreground">{asset.metadata.type === "EGG" ? "Egg" : "Evo"} · Generation {asset.metadata.generation}</p>
        </div>)}
      </div>
      {owned.hasNextPage && <Button variant="outline" disabled={owned.isFetchingNextPage} onClick={() => void owned.fetchNextPage()}>{owned.isFetchingNextPage ? "Loading…" : "Load more Evos"}</Button>}
      <p className="text-xs text-muted-foreground">This gallery shows the connected wallet. A saved account link is separate; in-game NFT access is coming later.</p>
    </>}
  </section>;
}
