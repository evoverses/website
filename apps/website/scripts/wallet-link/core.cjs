"use strict";
const {
  randomBytes,
  randomUUID,
  createHash,
  createHmac,
  hkdfSync,
  createCipheriv,
  createDecipheriv,
} = require("node:crypto");
const { getAddress, recoverMessageAddress } = require("viem");
const { createSiweMessage } = require("viem/siwe");
const fs = require("node:fs"),
  path = require("node:path");
const origin = "http://localhost:3100",
  chainId = 43114;
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
function walletLinkSettings(env) {
  if (env.EVOVERSES_LOCAL_WALLET_LINKING !== "1") return null;
  if (
    env.NODE_ENV === "production" ||
    env.EVOVERSES_LOCAL_EPIC_ACCOUNT_LOGIN !== "1" ||
    !/^[a-f0-9]{64}$/.test(env.EVOVERSES_LOCAL_WALLET_KEY || "")
  )
    throw Error("Invalid local wallet-link configuration");
  const key = Buffer.from(env.EVOVERSES_LOCAL_WALLET_KEY, "hex");
  return {
    key,
    token: createHmac("sha256", key)
      .update("evoverses-wallet-bridge-v1")
      .digest("hex"),
  };
}
async function migrateWalletLinks(database) {
  return database.transaction(async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock(713341001)");
    await tx.query(
      "CREATE TABLE IF NOT EXISTS player.website_wallet_migrations(version integer PRIMARY KEY)",
    );
    await tx.query(
      "REVOKE ALL ON player.website_wallet_migrations FROM PUBLIC",
    );
    const result = await tx.query(
      "SELECT version FROM player.website_wallet_migrations",
    );
    if (result.rows.some((row) => row.version !== 1))
      throw Error("Unknown wallet schema version");
    if (!result.rows.length) {
      for (const statement of fs
        .readFileSync(path.join(__dirname, "schema.sql"), "utf8")
        .split(";")
        .filter((sql) => sql.trim()))
        await tx.query(statement);
      await tx.query(
        "INSERT INTO player.website_wallet_migrations(version) VALUES(1)",
      );
    }
  });
}
async function initializeWalletKey(database, key) {
  const verifier = createHmac("sha256", key)
    .update("evoverses-wallet-key-check-v1")
    .digest("hex");
  return database.transaction(async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock(713341001)");
    const saved = (
      await tx.query(
        "SELECT key_verifier FROM player.wallet_crypto_config WHERE singleton=true",
      )
    ).rows[0];
    if (saved && saved.key_verifier !== verifier)
      throw Error("Wallet encryption key does not match this database");
    if (!saved)
      await tx.query(
        "INSERT INTO player.wallet_crypto_config(singleton,key_verifier) VALUES(true,$1)",
        [verifier],
      );
  });
}
function createWalletLinks({ accounts, key, ErrorType }) {
  if (
    !accounts ||
    !Buffer.isBuffer(key) ||
    key.length !== 32 ||
    typeof ErrorType !== "function"
  )
    throw Error("Explicit account service and encryption key required");
  const fail = (code) => {
    throw new ErrorType(code);
  };
  const encryptionKey = Buffer.from(
    hkdfSync("sha256", key, "evoverses-wallet-v1", "encryption", 32),
  );
  const lookupKey = Buffer.from(
    hkdfSync("sha256", key, "evoverses-wallet-v1", "unique-lookup", 32),
  );
  const hash = (value) => createHash("sha256").update(value).digest("hex");
  const address = (value) => {
    if (
      typeof value !== "string" ||
      !/^0x[a-fA-F0-9]{40}$/.test(value) ||
      /^0x0{40}$/i.test(value)
    )
      fail("INVALID_REQUEST");
    try {
      return getAddress(value);
    } catch {
      return fail("INVALID_REQUEST");
    }
  };
  const fields = (input, keys) => {
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.keys(input).length !== keys.length ||
      Object.keys(input).some((k) => !keys.includes(k))
    )
      fail("INVALID_REQUEST");
  };
  const aad = (purpose, player, id) =>
    Buffer.from(
      JSON.stringify(["evoverses-wallet-v1", purpose, player, id, chainId]),
    );
  function seal(value, context) {
    const iv = randomBytes(12),
      cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
    cipher.setAAD(context);
    const encrypted = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    return (
      "v1." +
      Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64")
    );
  }
  function open(value, context) {
    if (
      typeof value !== "string" ||
      !/^v1\.[A-Za-z0-9+/=]{80,160}$/.test(value)
    )
      fail("STORAGE_FAILURE");
    try {
      const bytes = Buffer.from(value.slice(3), "base64"),
        decipher = createDecipheriv(
          "aes-256-gcm",
          encryptionKey,
          bytes.subarray(0, 12),
        );
      decipher.setAAD(context);
      decipher.setAuthTag(bytes.subarray(12, 28));
      return address(
        Buffer.concat([
          decipher.update(bytes.subarray(28)),
          decipher.final(),
        ]).toString("utf8"),
      );
    } catch {
      return fail("STORAGE_FAILURE");
    }
  }
  const fingerprint = (value) =>
    createHmac("sha256", lookupKey)
      .update(`${chainId}:${value.toLowerCase()}`)
      .digest("hex");
  const first = async (tx, sql, args) => (await tx.query(sql, args)).rows[0];
  const message = (saved, owner) =>
    createSiweMessage({
      scheme: "http",
      domain: "localhost:3100",
      address: owner,
      statement:
        "Link this wallet to my signed-in EvoVerses trainer. Other trainers may link it separately. This does not approve payments or transfer assets.",
      uri: origin + "/profile",
      version: "1",
      chainId,
      nonce: saved.nonce,
      issuedAt: new Date(saved.issued_at),
      expirationTime: new Date(saved.expires_at),
      requestId: saved.id,
    });
  async function statusFor(tx, playerId, connected) {
    const rows = (
      await tx.query(
        "SELECT * FROM player.wallet_links WHERE player_id=$1 ORDER BY verified_at,id",
        [playerId],
      )
    ).rows;
    return {
      links: rows.map((saved) => {
        const owner = open(
          saved.address_ciphertext,
          aad("link", playerId, saved.id),
        );
        if (fingerprint(owner) !== saved.address_fingerprint)
          fail("STORAGE_FAILURE");
        return {
          id: saved.id,
          chainId,
          addressLabel: owner.slice(0, 6) + "…" + owner.slice(-4),
          matchesConnected:
            connected !== null &&
            owner.toLowerCase() === connected.toLowerCase(),
          verifiedAt: new Date(saved.verified_at).toISOString(),
        };
      }),
    };
  }
  return {
    projection: async (token, input) => {
      fields(input, []);
      return accounts.transaction(async (tx) => {
        const p = await accounts.sessionPlayer(tx, token);
        const rows = (
          await tx.query(
            "SELECT * FROM player.wallet_links WHERE player_id=$1 ORDER BY id",
            [p.id],
          )
        ).rows;
        const wallets = rows.map((saved) => {
          const owner = open(
            saved.address_ciphertext,
            aad("link", p.id, saved.id),
          );
          if (fingerprint(owner) !== saved.address_fingerprint)
            fail("STORAGE_FAILURE");
          return {
            id: saved.id,
            chainId,
            address: owner,
            label: owner.slice(0, 6) + "…" + owner.slice(-4),
          };
        });
        // Trusted server-to-server projection only; never return this through the public wallet endpoint.
        return {
          wallets,
          version: hash(JSON.stringify(wallets.map((w) => w.id))),
        };
      });
    },
    status: async (token, input) => {
      fields(input, ["connectedAddress"]);
      const connected =
        input.connectedAddress === null
          ? null
          : address(input.connectedAddress);
      return accounts.transaction(async (tx) => {
        const p = await accounts.sessionPlayer(tx, token);
        return statusFor(tx, p.id, connected);
      });
    },
    challenge: async (token, input) => {
      fields(input, ["address"]);
      const owner = address(input.address);
      return accounts.transaction(async (tx) => {
        const p = await accounts.sessionPlayer(tx, token);
        if (
          await first(
            tx,
            "SELECT 1 FROM player.wallet_links WHERE player_id=$1 AND address_fingerprint=$2",
            [p.id, fingerprint(owner)],
          )
        )
          fail("WALLET_ALREADY_LINKED");
        if (
          Number(
            (
              await first(
                tx,
                "SELECT count(*)::int AS n FROM player.wallet_links WHERE player_id=$1",
                [p.id],
              )
            ).n,
          ) >= 50
        )
          fail("WALLET_LIMIT_REACHED");
        const prior = await first(
          tx,
          "SELECT 1 FROM player.wallet_link_challenges WHERE player_id=$1 AND issued_at>clock_timestamp()-interval '5 seconds'",
          [p.id],
        );
        if (prior) fail("RATE_LIMITED");
        const id = randomUUID(),
          nonce = randomBytes(16).toString("hex");
        const saved = await first(
          tx,
          `INSERT INTO player.wallet_link_challenges(player_id,id,session_hash,address_ciphertext,nonce,address_fingerprint,issued_at,expires_at)
          SELECT $1,$2,$3,$4,$5,$6,t,t+interval '5 minutes' FROM (SELECT clock_timestamp() AS t) now_time
          ON CONFLICT(player_id) DO UPDATE SET id=excluded.id,session_hash=excluded.session_hash,address_ciphertext=excluded.address_ciphertext,
          nonce=excluded.nonce,address_fingerprint=excluded.address_fingerprint,issued_at=excluded.issued_at,expires_at=excluded.expires_at RETURNING *`,
          [
            p.id,
            id,
            hash(token),
            seal(owner, aad("challenge", p.id, id)),
            nonce,
            fingerprint(owner),
          ],
        );
        return {
          challengeId: id,
          message: message(saved, owner),
          expiresAt: new Date(saved.expires_at).toISOString(),
        };
      });
    },
    verify: async (token, input) => {
      fields(input, ["challengeId", "signature"]);
      if (
        typeof input.challengeId !== "string" ||
        !uuid.test(input.challengeId) ||
        typeof input.signature !== "string" ||
        !/^0x[a-fA-F0-9]{130}$/.test(input.signature)
      )
        fail("INVALID_REQUEST");
      const evidence = await accounts.transaction(async (tx) => {
        const p = await accounts.sessionPlayer(tx, token);
        const saved = await first(
          tx,
          "SELECT * FROM player.wallet_link_challenges WHERE player_id=$1 AND id=$2 AND session_hash=$3 AND expires_at>clock_timestamp()",
          [p.id, input.challengeId, hash(token)],
        );
        if (!saved) fail("CHALLENGE_EXPIRED");
        return {
          saved,
          owner: open(
            saved.address_ciphertext,
            aad("challenge", p.id, saved.id),
          ),
        };
      });
      let signer;
      try {
        signer = await recoverMessageAddress({
          message: message(evidence.saved, evidence.owner),
          signature: input.signature,
        });
      } catch {
        fail("INVALID_SIGNATURE");
      }
      if (signer.toLowerCase() !== evidence.owner.toLowerCase())
        fail("INVALID_SIGNATURE");
      return accounts.transaction(async (tx) => {
        const p = await accounts.sessionPlayer(tx, token);
        // Re-read after locking: another session, logout, expiry, replacement or replay cannot reuse proof.
        const saved = await first(
          tx,
          "SELECT * FROM player.wallet_link_challenges WHERE player_id=$1 AND id=$2 AND session_hash=$3 AND expires_at>clock_timestamp() FOR UPDATE",
          [p.id, input.challengeId, hash(token)],
        );
        if (!saved || JSON.stringify(saved) !== JSON.stringify(evidence.saved))
          fail("CHALLENGE_EXPIRED");
        const owner = evidence.owner,
          fp = fingerprint(owner);
        await tx.query("SELECT pg_advisory_xact_lock($1::bigint)", [
          Buffer.from(fp, "hex").readBigInt64BE(0).toString(),
        ]);
        // Recheck both session and challenge after a uniqueness-lock wait.
        await accounts.sessionPlayer(tx, token);
        if (
          !(await first(
            tx,
            "SELECT 1 FROM player.wallet_link_challenges WHERE player_id=$1 AND id=$2 AND expires_at>clock_timestamp()",
            [p.id, saved.id],
          ))
        )
          fail("CHALLENGE_EXPIRED");
        if (
          await first(
            tx,
            "SELECT 1 FROM player.wallet_links WHERE player_id=$1 AND address_fingerprint=$2",
            [p.id, fp],
          )
        )
          fail("WALLET_ALREADY_LINKED");
        if (
          Number(
            (
              await first(
                tx,
                "SELECT count(*)::int AS n FROM player.wallet_links WHERE player_id=$1",
                [p.id],
              )
            ).n,
          ) >= 50
        )
          fail("WALLET_LIMIT_REACHED");
        const id = randomUUID();
        await tx.query(
          "INSERT INTO player.wallet_links(player_id,id,chain_id,address_fingerprint,address_ciphertext) VALUES($1,$2,$3,$4,$5)",
          [p.id, id, chainId, fp, seal(owner, aad("link", p.id, id))],
        );
        await tx.query(
          "INSERT INTO player.wallet_link_audit(id,player_id,action) VALUES($1,$2,'wallet_linked')",
          [randomUUID(), p.id],
        );
        await tx.query(
          "DELETE FROM player.wallet_link_challenges WHERE player_id=$1",
          [p.id],
        );
        return statusFor(tx, p.id, owner);
      });
    },
    unlink: async (token, input) => {
      fields(input, ["linkId", "confirm"]);
      if (
        typeof input.linkId !== "string" ||
        !uuid.test(input.linkId) ||
        input.confirm !== true
      )
        fail("INVALID_REQUEST");
      return accounts.transaction(async (tx) => {
        const p = await accounts.sessionPlayer(tx, token);
        const saved = await first(
          tx,
          "SELECT * FROM player.wallet_links WHERE player_id=$1 AND id=$2",
          [p.id, input.linkId],
        );
        if (!saved) fail("LINK_CHANGED");
        const removed = await tx.query(
          "DELETE FROM player.wallet_links WHERE player_id=$1 AND id=$2 RETURNING id",
          [p.id, saved.id],
        );
        if (!removed.rows.length) fail("LINK_CHANGED");
        await tx.query(
          "DELETE FROM player.wallet_link_challenges WHERE player_id=$1",
          [p.id],
        );
        await tx.query(
          "INSERT INTO player.wallet_link_audit(id,player_id,action) VALUES($1,$2,'wallet_unlinked')",
          [randomUUID(), p.id],
        );
        return statusFor(tx, p.id, null);
      });
    },
  };
}
module.exports = {
  createWalletLinks,
  migrateWalletLinks,
  initializeWalletKey,
  walletLinkSettings,
};
