"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  berthaAddress,
  berthaAbi,
  hermannAddress,
  hermannAbi,
  nurseryScope,
  nurseryClient,
  sendNurseryTransaction,
} from "@/lib/nursery/contracts";
import { useNurseryWallet } from "./hooks";
import { avaxAmount, ErrorMessage } from "./shared";
export function NativeCredits({ keeper }: { keeper: "bertha" | "hermann" }) {
  const w = useNurseryWallet();
  const address = keeper === "bertha" ? berthaAddress! : hermannAddress!;
  const abi = keeper === "bertha" ? berthaAbi : hermannAbi;
  const credit = useQuery({
    queryKey: [
      "nursery-native-credit",
      nurseryScope,
      keeper,
      w.account?.address,
    ],
    enabled: Boolean(w.account),
    refetchInterval: 15_000,
    queryFn: () =>
      nurseryClient.readContract({
        address,
        abi,
        functionName: "nativeCredit",
        args: [w.account!.address],
      }) as Promise<bigint>,
  });
  if (!credit.data) return null;
  const claim = () =>
    w.run(async () => {
      if (!w.account) return;
      await w.guard();
      await sendNurseryTransaction(
        w.account,
        address,
        abi,
        "withdrawNativeCredit",
        [w.account.address],
        { beforeSend: w.guard },
      );
      await credit.refetch();
    });
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <p className="text-sm">
        Unused randomness surcharge:{" "}
        <strong>{avaxAmount(credit.data)} AVAX</strong>. Reclaiming it costs
        network gas.
      </p>
      <Button variant="outline" disabled={w.busy} onClick={claim}>
        {w.busy ? "Confirm in your wallet…" : "Reclaim unused AVAX"}
      </Button>
      <ErrorMessage message={w.error} />
    </div>
  );
}
