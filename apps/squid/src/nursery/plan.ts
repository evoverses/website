import { nurseryConfig } from "./config";
const config = nurseryConfig(process.env);
console.log(
  JSON.stringify(
    {
      enabled: Boolean(config),
      registry: config,
      writesPerformed: false,
      prerequisites: [
        "Approve final contracts/ABI and registry-to-collection wiring.",
        "Apply the reversible metadata migration through the reviewed release procedure.",
        "Seed every configured species name/artwork mapping.",
        "Watch NFT transfers and registry events from before the first AdultImported/EggRecorded event.",
        "Require hash-pinned historical RPC reads; do not substitute latest state.",
        "Stop the legacy Brenda worker; no new off-chain randomness or token allocation.",
        "Rehearse the full local contract/indexer/API flow before live release.",
      ],
    },
    null,
    2,
  ),
);
