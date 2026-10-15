import { parentCost, type Parent } from "@/lib/nursery/rules";
import { evoAmount } from "./shared";

export function BreedingPrice({ parents }: { parents?: readonly [Parent, Parent] }) {
  if (!parents) return <p className="text-sm text-muted-foreground">Choose two Evos to see the price.</p>;
  return (
    <div className="space-y-4">
      <dl className="space-y-3 text-sm">
        {parents.map((parent, index) => (
          <div key={parent.tokenId} className="flex items-start justify-between gap-4">
            <dt>
              <span className="font-semibold">Parent {index + 1} · #{parent.tokenId}</span>
              <span className="block text-xs text-muted-foreground">Gen {String(parent.generation)} · {String(parent.totalBreeds)} previous {parent.totalBreeds === 1n ? "breed" : "breeds"}</span>
            </dt>
            <dd className="font-semibold text-right tabular-nums break-words">{evoAmount(parentCost(parent))} EVO</dd>
          </div>
        ))}
        <div className="flex items-start justify-between gap-4 border-t pt-4 text-xl font-bold">
          <dt>Total <span className="block text-xs font-normal text-muted-foreground">One egg</span></dt>
          <dd className="text-right tabular-nums break-words">{evoAmount(parentCost(parents[0]) + parentCost(parents[1]))} EVO</dd>
        </div>
      </dl>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer w-fit">How pricing works</summary>
        <p className="mt-2 leading-relaxed">Each parent starts at 500 EVO. The price doubles each generation and increases with each breed. Gen 0 parents are capped at 2,500 EVO each.</p>
      </details>
      <p className="text-xs text-muted-foreground">AVAX fees apply when breeding and hatching.</p>
    </div>
  );
}
