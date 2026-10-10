import { parseSiweMessage } from "viem/siwe";
import type { WalletLinkChallenge } from "./types";

// Bind signing to the actual approved page, never to a server-supplied origin.
export function walletChallengeMatches(
  challenge: WalletLinkChallenge,
  address: string,
  pageOrigin: string,
  now = Date.now(),
) {
  if (!["http://localhost:3100", "https://beta.evoverses.com"].includes(pageOrigin)) return false;
  try {
    const origin = new URL(pageOrigin), parsed = parseSiweMessage(challenge.message);
    return parsed.scheme === origin.protocol.slice(0, -1) &&
      parsed.domain === origin.host && parsed.uri === `${origin.origin}/profile` &&
      parsed.chainId === 43114 && parsed.address?.toLowerCase() === address.toLowerCase() &&
      parsed.requestId === challenge.challengeId &&
      parsed.expirationTime?.getTime() === Date.parse(challenge.expiresAt) &&
      Date.parse(challenge.expiresAt) > now;
  } catch { return false; }
}
