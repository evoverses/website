import "server-only";
import { getLocalWalletConnection, localPlayerLogin } from "../server";
import { walletHandler, WalletWebError } from "./handler";

export async function walletRpc(
  operation: string,
  sessionToken: string,
  input: Record<string, unknown>,
) {
  const connection = getLocalWalletConnection();
  if (!connection) throw new WalletWebError("SERVICE_UNAVAILABLE");
  const response = await fetch(connection.apiUrl + "/internal/wallet-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + connection.token,
    },
    body: JSON.stringify({ operation, sessionToken, ...input }),
    cache: "no-store",
    redirect: "error",
    credentials: "omit",
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  if (text.length > 16_384) throw new WalletWebError("SERVICE_UNAVAILABLE");
  const result = JSON.parse(text);
  if (!response.ok) {
    const codes: Record<string, number> = {
      INVALID_SESSION: 401,
      ACCOUNT_UNAVAILABLE: 403,
      INVALID_REQUEST: 400,
      INVALID_SIGNATURE: 400,
      CHALLENGE_EXPIRED: 409,
      WALLET_ALREADY_LINKED: 409,
      LINK_CHANGED: 409,
      WALLET_LIMIT_REACHED: 409,
      RATE_LIMITED: 429,
    };
    const code = result?.error?.code;
    if (typeof code === "string" && Object.hasOwn(codes, code))
      throw new WalletWebError(code, codes[code]);
    throw new WalletWebError("SERVICE_UNAVAILABLE");
  }
  return result.value;
}
export async function playerWallet(request: Request) {
  return walletHandler(request, { enabled: localPlayerLogin, rpc: walletRpc });
}
