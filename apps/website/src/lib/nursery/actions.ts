export type BreedLimit = { cost: bigint; maximum: bigint };
export async function submitBreed<T>(
  displayed: BreedLimit,
  dependencies: {
    guard: () => Promise<void>;
    preview: () => Promise<bigint>;
    approve: (amount: bigint) => Promise<void>;
    quote: () => Promise<{ quote: bigint; gasPrice: bigint }>;
    send: (payment: {
      cost: bigint;
      value: bigint;
      gasPrice: bigint;
    }) => Promise<T>;
  },
): Promise<T> {
  await dependencies.guard();
  if ((await dependencies.preview()) !== displayed.cost)
    throw new Error(
      "The breeding price changed. Refresh the quote before breeding.",
    );
  await dependencies.approve(displayed.cost);
  await dependencies.guard();
  const [cost, current] = await Promise.all([
    dependencies.preview(),
    dependencies.quote(),
  ]);
  if (cost !== displayed.cost || current.quote > displayed.maximum)
    throw new Error("The quote changed. Refresh before breeding.");
  await dependencies.guard();
  return dependencies.send({
    cost: displayed.cost,
    value: displayed.maximum,
    gasPrice: current.gasPrice,
  });
}
