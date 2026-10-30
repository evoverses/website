// Every nursery card for a wallet shares one signing workflow, including its approval.
const active = new Set<string>();
const listeners = new Set<() => void>();
const notify = () => { for (const listener of listeners) listener(); };
export const nurseryWalletBusy = (scope?: string) => Boolean(scope && active.has(scope));
export function subscribeNurseryWallet(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function acquireNurseryWallet(scope: string) {
  if (active.has(scope)) return undefined;
  active.add(scope); notify();
  let released = false;
  return () => {
    if (released) return;
    released = true; active.delete(scope); notify();
  };
}
