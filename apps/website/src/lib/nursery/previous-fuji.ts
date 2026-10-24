// Previous verified Fuji deployments are retained for existing audit receipts only.
// New signing intents always use the current release configuration.
export const previousFujiNurseries = [
  { bertha: "0xe39A19Fe7FFbE17693941D34858408a0133D69Ff", hermann: "0x98e5f17cd25a3d4f48374E528c4ADA9DAE10b931", registryVersion: 2 },
  { bertha: "0xff6357B21463698E7dD382D6f5439EBE0dd79Aa7", hermann: "0x7D0a47E56E4804A606669D6b395AD430c9ADD25E", registryVersion: 2 },
  { bertha: "0x8864e7E80f7CBdB43417634B23328846c4EC921E", hermann: "0x7B252B2B63747E1F56C6b485d6a41B8C09302Cef", registryVersion: 1 },
] as const;
export function previousFujiNursery(intent: { chainId: number; action: string; target?: string; args: string[] }) {
  if (intent.chainId !== 43113) return undefined;
  const destination = intent.action === "approve" ? intent.args[0] : intent.target;
  return previousFujiNurseries.find(deployment => [deployment.bertha, deployment.hermann].some(address => address.toLowerCase() === destination?.toLowerCase()));
}
