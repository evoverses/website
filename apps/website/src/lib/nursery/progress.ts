export type TransactionPhase = "wallet" | "confirming" | "confirmed";
export type NurseryActionKind = "treat" | "breed" | "hatch" | "finish";
export type NurseryProgress = { kind: NurseryActionKind; step: "checking" | "approval" | "action"; phase: "preparing" | TransactionPhase; approvalNeeded?: boolean };
export function progressCopy(progress: NurseryProgress) {
  const noun = { treat: "treatment", breed: "breeding", hatch: "hatching", finish: "the reveal" }[progress.kind];
  if (progress.step === "checking") return { button: "Checking…", message: "Checking your wallet…" };
  if (progress.step === "approval") {
    const message = { preparing: "Preparing approval…", wallet: "Approve EVO spending in your wallet.", confirming: "Approval sent. Waiting for confirmation…", confirmed: "EVO approved. Continuing…" }[progress.phase];
    return { button: "Approving EVO…", message: `Step 1 of 2: ${message}` };
  }
  const button = { treat: "Treating…", breed: "Breeding…", hatch: "Hatching…", finish: "Revealing…" }[progress.kind];
  const message = { preparing: `Preparing ${noun}…`, wallet: `Confirm ${noun} in your wallet.`, confirming: `${noun[0]!.toUpperCase()}${noun.slice(1)} sent. Waiting for confirmation…`, confirmed: "Confirmed. Updating…" }[progress.phase];
  return { button, message: `${progress.approvalNeeded ? "Step 2 of 2: " : ""}${message}` };
}
