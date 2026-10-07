"use client";
import { useChainWallet } from "@/hooks/use-chain-wallet";
import type {
  WalletLink,
  WalletLinkChallenge,
  WalletLinkStatus,
} from "@/lib/player/wallet/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { useRef, useState } from "react";
import { parseSiweMessage } from "viem/siwe";

const messages: Record<string, string> = {
  INVALID_SESSION: "Sign in with Epic again before managing your wallet link.",
  ACCOUNT_UNAVAILABLE: "Your account is unavailable.",
  INVALID_SIGNATURE:
    "The signature did not prove control of this wallet. Try linking again.",
  CHALLENGE_EXPIRED: "The linking request expired or was replaced. Try again.",
  WALLET_ALREADY_LINKED:
    "This wallet is already linked to your trainer. Refresh the link status.",
  WALLET_LIMIT_REACHED: "This local test account has reached its wallet limit.",
  LINK_CHANGED: "The link changed. Refresh its status before trying again.",
  RATE_LIMITED: "Please wait a few seconds before trying again.",
};
async function command<T>(
  operation: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("/api/player/wallet", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, ...body }),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      messages[result?.error?.code] ||
        "Wallet linking is temporarily unavailable. Try again.",
    );
  return result as T;
}
export function WalletLink({ playerId }: { playerId: string }) {
  const { account } = useChainWallet(),
    client = useQueryClient();
  const connectedAddress = account?.address ?? null,
    currentAddress = useRef(connectedAddress);
  currentAddress.current = connectedAddress;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [confirmation, setConfirmation] = useState<string | null>(null);
  const queryKey = ["player-wallet-link", playerId, connectedAddress];
  const status = useQuery({
    queryKey,
    meta: { private: true },
    gcTime: 0,
    queryFn: () => command<WalletLinkStatus>("status", { connectedAddress }),
    staleTime: 0,
    retry: false,
    refetchInterval: 15_000,
  });
  const links = status.isError ? [] : (status.data?.links ?? []);
  const connectedLink = links.find((link) => link.matchesConnected);
  async function link() {
    if (!account || busy) return;
    setBusy(true);
    setError(null);
    setConfirmation(null);
    try {
      const challenge = await command<WalletLinkChallenge>("challenge", {
        address: account.address,
      });
      const parsed = parseSiweMessage(challenge.message);
      if (
        parsed.scheme !== "http" ||
        parsed.domain !== "localhost:3100" ||
        parsed.uri !== "http://localhost:3100/profile" ||
        parsed.chainId !== 43114 ||
        parsed.address?.toLowerCase() !== account.address.toLowerCase() ||
        parsed.requestId !== challenge.challengeId ||
        parsed.expirationTime?.getTime() !== Date.parse(challenge.expiresAt) ||
        Date.parse(challenge.expiresAt) <= Date.now()
      )
        throw new Error("The wallet request could not be verified. Try again.");
      let signature: string;
      try {
        signature = await account.signMessage({ message: challenge.message });
      } catch {
        throw new Error(
          "Linking was cancelled or your wallet could not sign. Nothing was linked.",
        );
      }
      if (
        currentAddress.current?.toLowerCase() !== account.address.toLowerCase()
      )
        throw new Error(
          "Your connected wallet changed. Please start linking again.",
        );
      await command<WalletLinkStatus>("verify", {
        challengeId: challenge.challengeId,
        signature,
      });
      await client.resetQueries({ queryKey: ["player-inventory", playerId] });
      await client.invalidateQueries({
        queryKey: ["player-wallet-link", playerId],
      });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Wallet linking is unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function unlink(linked: WalletLink) {
    if (!linked || busy || confirmation !== linked.id) return;
    setBusy(true);
    setError(null);
    try {
      await command("unlink", { linkId: linked.id, confirm: true });
      await client.resetQueries({ queryKey: ["player-inventory", playerId] });
      await client.invalidateQueries({
        queryKey: ["player-wallet-link", playerId],
      });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Wallet linking is unavailable.",
      );
    } finally {
      setBusy(false);
      setConfirmation(null);
    }
  }
  return (
    <section
      className="space-y-3 rounded-2xl border bg-card p-5"
      data-testid="player-wallet-link"
    >
      <h2 className="text-lg font-bold">Wallet account links</h2>
      <p className="text-sm text-muted-foreground">
        Link several wallets to your trainer. Family members can also link a
        shared wallet to their own trainer accounts.
      </p>
      {status.isPending ? (
        <p role="status">Checking your wallet links…</p>
      ) : status.isError ? (
        <>
          <p role="alert">
            We couldn’t check your wallet links. Sign in again if your session
            expired.
          </p>
          <Button variant="outline" onClick={() => void status.refetch()}>
            Retry link status
          </Button>
        </>
      ) : (
        <>
          <p data-testid="wallet-link-state">
            <strong>
              {connectedLink
                ? "Connected · Linked to this trainer"
                : connectedAddress
                  ? "Connected · Not linked to this trainer"
                  : "No wallet connected"}
            </strong>
          </p>
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven’t linked any wallets yet.
            </p>
          ) : (
            <ul className="space-y-3" aria-label="Linked wallets">
              {links.map((linked) => (
                <li
                  key={linked.id}
                  className="rounded-xl border bg-muted/20 p-3"
                >
                  <p className="font-bold">
                    {linked.addressLabel}
                    {linked.matchesConnected ? " · Connected" : ""}
                  </p>
                  {confirmation === linked.id ? (
                    <div className="mt-2 space-y-2">
                      <p>
                        Remove this wallet from your trainer? Your wallet assets
                        and Evoros stay as they are.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="destructive"
                          disabled={busy}
                          onClick={() => void unlink(linked)}
                        >
                          {busy ? "Unlinking…" : "Confirm unlink"}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => setConfirmation(null)}
                        >
                          Keep linked
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="mt-2"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setConfirmation(linked.id)}
                    >
                      Unlink wallet
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!connectedLink && (
            <>
              <p className="text-sm text-muted-foreground">
                {connectedAddress
                  ? "Sign a free ownership message to link this wallet. Existing links to other trainers stay as they are. No spending is approved and no assets move."
                  : "Connect a wallet from the account menu to add it here."}
              </p>
              <Button disabled={!account || busy} onClick={() => void link()}>
                {busy ? "Waiting for wallet…" : "Link wallet to my account"}
              </Button>
            </>
          )}
          <p className="text-sm text-muted-foreground">
            Disconnecting or switching wallets keeps your saved links. Unlinking
            removes this account’s association only. Other trainers’ links stay
            as they are.
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Saved wallet addresses are encrypted in the local account database.
        Linking is optional. In-game NFT access stays disabled until the game
        prevents the same Evo being used in concurrent matches.
      </p>
    </section>
  );
}
