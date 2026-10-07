"use strict";
const { test, before, after, beforeEach } = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  { randomBytes, randomUUID, createHash } = require("node:crypto");
const { privateKeyToAccount } = require("viem/accounts"),
  { parseSiweMessage } = require("viem/siwe");
const {
  createWalletLinks,
  migrateWalletLinks,
  initializeWalletKey,
  walletLinkSettings,
} = require("../../scripts/wallet-link/core.cjs");
const {
  startWalletLinkBridge,
} = require("../../scripts/wallet-link/bridge.cjs");
const backend =
  process.env.EVOVERSES_ACCOUNT_TEST_DIR ||
  path.resolve(
    __dirname,
    "../../../../../evoverses-beta-account-bridge/Prototypes/player_economy",
  );
const { setup, localPGlite } = require(
  path.join(backend, "scripts/fixtures.cjs"),
);
const { embeddedDatabase } = require(path.join(backend, "src/database.cjs")),
  { PlayerAccounts } = require(path.join(backend, "src/accounts.cjs")),
  { EconomyError } = require(path.join(backend, "src/economy.cjs"));
const key = randomBytes(32),
  owner = privateKeyToAccount("0x" + "11".repeat(32)),
  second = privateKeyToAccount("0x" + "22".repeat(32));
let db, database, f, links, accounts, dir;
function compose() {
  database = embeddedDatabase(db);
  accounts = new PlayerAccounts({
    database,
    mode: "test",
    verifyEpicEvidence: async () => {
      throw Error("No login fixture needed");
    },
    epic: { issuer: "fixture", scope: "fixture", audiences: ["fixture"] },
  });
  links = createWalletLinks({ accounts, key, ErrorType: EconomyError });
}
const denied = (promise, code) =>
  assert.rejects(promise, (e) => e.code === code);
async function challenge(token = f.aliceToken, wallet = owner) {
  return links.challenge(token, { address: wallet.address });
}
async function signed(token = f.aliceToken, wallet = owner) {
  const c = await challenge(token, wallet);
  return {
    challengeId: c.challengeId,
    signature: await wallet.signMessage({ message: c.message }),
  };
}
const status = (token = f.aliceToken, wallet = owner) =>
  links.status(token, { connectedAddress: wallet?.address || null });
const grant = async (token = f.aliceToken, wallet = owner) =>
  links.verify(token, await signed(token, wallet));
before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "evoverses-wallet-test-"));
  db = new (localPGlite())(path.join(dir, "Database"));
  f = await setup(db);
  compose();
  await migrateWalletLinks(database);
  await initializeWalletKey(database, key);
});
beforeEach(async () => {
  await db.query("DELETE FROM player.wallet_links");
  await db.query("DELETE FROM player.wallet_link_challenges");
});
after(async () => {
  await db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});
test("configuration is local-only; encryption key is bound to database and migration is repeatable", async () => {
  assert.equal(walletLinkSettings({}), null);
  assert.throws(() =>
    walletLinkSettings({ EVOVERSES_LOCAL_WALLET_LINKING: "1" }),
  );
  assert.throws(() =>
    walletLinkSettings({
      NODE_ENV: "production",
      EVOVERSES_LOCAL_WALLET_LINKING: "1",
    }),
  );
  await initializeWalletKey(database, key);
  await assert.rejects(initializeWalletKey(database, randomBytes(32)));
  await migrateWalletLinks(database);
});
test("message binds origin, chain, nonce, expiry, request and shared-link consent without Epic/player identifiers", async () => {
  const c = await challenge(),
    p = parseSiweMessage(c.message);
  assert.equal(p.chainId, 43114);
  assert.equal(p.scheme, "http");
  assert.equal(p.domain, "localhost:3100");
  assert.equal(p.uri, "http://localhost:3100/profile");
  assert.equal(p.requestId, c.challengeId);
  assert.match(p.nonce, /^[a-f0-9]{32}$/);
  assert.equal(c.message.includes(f.alice), false);
  assert.equal(c.message.includes(f.aliceToken), false);
  assert.match(c.message, /Other trainers may link it separately/);
  assert.equal(p.expirationTime - p.issuedAt, 300000);
});
test("actual EOA signature links once; addresses encrypted, lookup keyed and audit append-only", async () => {
  const proof = await signed();
  await links.verify(f.aliceToken, proof);
  assert.equal((await status()).links[0].matchesConnected, true);
  const rows = (await db.query("SELECT * FROM player.wallet_links")).rows;
  assert.equal(
    JSON.stringify(rows).toLowerCase().includes(owner.address.toLowerCase()),
    false,
  );
  assert.match(rows[0].address_ciphertext, /^v1\./);
  assert.notEqual(
    rows[0].address_fingerprint,
    createHash("sha256").update(owner.address.toLowerCase()).digest("hex"),
  );
  const audit = (await db.query("SELECT * FROM player.wallet_link_audit")).rows;
  assert.equal(JSON.stringify(audit).includes(proof.signature), false);
  assert.equal(
    JSON.stringify(audit).toLowerCase().includes(owner.address.toLowerCase()),
    false,
  );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int n FROM player.wallet_link_challenges",
      )
    ).rows[0].n,
    0,
  );
  await denied(links.verify(f.aliceToken, proof), "CHALLENGE_EXPIRED");
  await assert.rejects(db.query("DELETE FROM player.wallet_link_audit"));
});
test("wrong signer, player, session, altered domain or claimed player fields cannot link", async () => {
  const c = await challenge(),
    proof = {
      challengeId: c.challengeId,
      signature: await second.signMessage({ message: c.message }),
    };
  await denied(links.verify(f.aliceToken, proof), "INVALID_SIGNATURE");
  const valid = {
    ...proof,
    signature: await owner.signMessage({ message: c.message }),
  };
  await denied(links.verify(f.bobToken, valid), "CHALLENGE_EXPIRED");
  const extra = randomBytes(32).toString("hex");
  await db.query(
    "INSERT INTO player.sessions(token_hash,player_id,issued_at,expires_at) VALUES($1,$2,clock_timestamp(),clock_timestamp()+interval '15 minutes')",
    [createHash("sha256").update(extra).digest("hex"), f.alice],
  );
  await denied(links.verify(extra, valid), "CHALLENGE_EXPIRED");
  await denied(
    links.verify(f.aliceToken, {
      ...proof,
      signature: await owner.signMessage({
        message: c.message.replace("localhost:3100", "attacker.example"),
      }),
    }),
    "INVALID_SIGNATURE",
  );
  await denied(
    links.challenge(f.aliceToken, { address: owner.address, playerId: f.bob }),
    "INVALID_REQUEST",
  );
  assert.equal((await status()).links.length, 0);
});
test("expired/replaced request and revoked session fail closed", async () => {
  const old = await signed();
  await db.query(
    "UPDATE player.wallet_link_challenges SET issued_at=clock_timestamp()-interval '10 seconds' WHERE player_id=$1",
    [f.alice],
  );
  const latest = await signed();
  await denied(links.verify(f.aliceToken, old), "CHALLENGE_EXPIRED");
  await db.query(
    "UPDATE player.wallet_link_challenges SET issued_at=clock_timestamp()-interval '10 minutes',expires_at=clock_timestamp()-interval '5 minutes' WHERE player_id=$1",
    [f.alice],
  );
  await denied(links.verify(f.aliceToken, latest), "CHALLENGE_EXPIRED");
  await db.query("DELETE FROM player.wallet_link_challenges");
  const proof = await signed();
  await accounts.logout(f.aliceToken);
  await denied(links.verify(f.aliceToken, proof), "INVALID_SESSION");
  await db.query(
    "UPDATE player.sessions SET revoked_at=NULL WHERE token_hash=$1",
    [createHash("sha256").update(f.aliceToken).digest("hex")],
  );
});
test("multiple wallets and independently proven shared links persist without moving inventory or balance", async () => {
  const bobProof = await signed(f.bobToken, owner);
  await grant();
  await grant(f.aliceToken, second);
  await links.verify(f.bobToken, bobProof);
  assert.equal((await status()).links.length, 2);
  assert.equal((await status(f.bobToken)).links.length, 1);
  assert.equal(
    (await status(f.aliceToken, second)).links.find((v) => v.matchesConnected)
      .chainId,
    43114,
  );
  const snapshot = await f.economy.getSnapshot(f.aliceToken);
  assert.equal(snapshot.evoros, 0);
  assert.equal(snapshot.evos.length, 0);
});
test("private inventory projection is account-scoped, session-checked and changes when a link is removed", async () => {
  await grant();
  await grant(f.aliceToken, second);
  await grant(f.bobToken, owner);
  const alice = await links.projection(f.aliceToken, {});
  const bob = await links.projection(f.bobToken, {});
  assert.equal(alice.wallets.length, 2);
  assert.equal(bob.wallets.length, 1);
  assert.deepEqual(
    new Set(alice.wallets.map((w) => w.address.toLowerCase())),
    new Set([owner.address, second.address].map((v) => v.toLowerCase())),
  );
  assert.equal(
    bob.wallets[0].address.toLowerCase(),
    owner.address.toLowerCase(),
  );
  assert.notEqual(alice.version, bob.version);
  assert.equal(
    (await links.projection(f.aliceToken, {})).version,
    alice.version,
  );
  await denied(
    links.projection(f.aliceToken, { playerId: f.bob }),
    "INVALID_REQUEST",
  );
  await links.unlink(f.aliceToken, {
    linkId: alice.wallets[0].id,
    confirm: true,
  });
  assert.notEqual(
    (await links.projection(f.aliceToken, {})).version,
    alice.version,
  );
  assert.equal((await links.projection(f.bobToken, {})).version, bob.version);
  const revoked = randomBytes(32).toString("hex");
  await db.query(
    "INSERT INTO player.sessions(token_hash,player_id,issued_at,expires_at,revoked_at) VALUES($1,$2,clock_timestamp(),clock_timestamp()+interval '15 minutes',clock_timestamp())",
    [createHash("sha256").update(revoked).digest("hex"), f.alice],
  );
  await denied(links.projection(revoked, {}), "INVALID_SESSION");
});
test("unsigned sharing refused; concurrent independent proofs each create one account link", async () => {
  await denied(
    links.challenge("bad", { address: owner.address }),
    "INVALID_SESSION",
  );
  await denied(
    links.verify(f.bobToken, {
      challengeId: randomUUID(),
      signature: "0x" + "00".repeat(65),
    }),
    "CHALLENGE_EXPIRED",
  );
  const alice = await signed(),
    bob = await signed(f.bobToken);
  const result = await Promise.allSettled([
    links.verify(f.aliceToken, alice),
    links.verify(f.bobToken, bob),
  ]);
  assert.equal(result.filter((r) => r.status === "fulfilled").length, 2);
  assert.equal(
    (await db.query("SELECT count(*)::int n FROM player.wallet_links")).rows[0]
      .n,
    2,
  );
});
test("unlink affects only its owner; confirmation and current link ID prevent stale/cross-account removal", async () => {
  const linked = (await grant()).links[0];
  await grant(f.bobToken);
  await denied(
    links.unlink(f.bobToken, { linkId: linked.id, confirm: true }),
    "LINK_CHANGED",
  );
  await denied(
    links.unlink(f.aliceToken, { linkId: linked.id, confirm: false }),
    "INVALID_REQUEST",
  );
  assert.deepEqual(
    await links.unlink(f.aliceToken, { linkId: linked.id, confirm: true }),
    { links: [] },
  );
  assert.equal((await status(f.bobToken)).links.length, 1);
  const replacement = (await grant()).links[0];
  assert.notEqual(replacement.id, linked.id);
  await denied(
    links.unlink(f.aliceToken, { linkId: linked.id, confirm: true }),
    "LINK_CHANGED",
  );
  assert.equal((await status()).links.length, 1);
});
test("audit failure rolls shared-link creation back without affecting other accounts", async () => {
  await grant();
  const proof = await signed(f.bobToken);
  await db.exec(
    "CREATE FUNCTION player.fixture_wallet_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture'; END $$; CREATE TRIGGER fixture_wallet_audit_failure BEFORE INSERT ON player.wallet_link_audit FOR EACH ROW EXECUTE FUNCTION player.fixture_wallet_audit_failure();",
  );
  try {
    await denied(links.verify(f.bobToken, proof), "STORAGE_FAILURE");
    assert.equal((await status()).links.length, 1);
    assert.equal((await status(f.bobToken)).links.length, 0);
  } finally {
    await db.exec(
      "DROP TRIGGER fixture_wallet_audit_failure ON player.wallet_link_audit; DROP FUNCTION player.fixture_wallet_audit_failure();",
    );
  }
  await links.verify(f.bobToken, proof);
  assert.equal((await status(f.bobToken)).links.length, 1);
});
test("tampering fails closed; encrypted link persists after database reopen and disconnect", async () => {
  await grant();
  const saved = (await db.query("SELECT * FROM player.wallet_links")).rows[0];
  await db.query(
    "UPDATE player.wallet_links SET address_ciphertext=$1 WHERE id=$2",
    ["v1." + Buffer.alloc(70).toString("base64"), saved.id],
  );
  await denied(status(), "STORAGE_FAILURE");
  await db.query(
    "UPDATE player.wallet_links SET address_ciphertext=$1 WHERE id=$2",
    [saved.address_ciphertext, saved.id],
  );
  await db.close();
  db = new (localPGlite())(path.join(dir, "Database"));
  compose();
  await initializeWalletKey(database, key);
  assert.equal((await status()).links.length, 1);
  assert.equal(
    (await status(f.aliceToken, null)).links[0].matchesConnected,
    false,
  );
});
test("private bridge requires service credential and player session; rejects browser Origin and extra fields", async () => {
  const token = "c".repeat(64),
    api = await startWalletLinkBridge({ links, token });
  const call = async (body, headers = {}) =>
    fetch(api.url + "/internal/wallet-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        ...headers,
      },
      body: JSON.stringify(body),
    });
  try {
    const body = {
      operation: "status",
      sessionToken: f.aliceToken,
      connectedAddress: owner.address,
    };
    assert.equal(
      (await call(body, { Authorization: "Bearer " + "d".repeat(64) })).status,
      403,
    );
    assert.equal(
      (await call(body, { Origin: "http://localhost:3100" })).status,
      403,
    );
    assert.equal((await call({ ...body, playerId: f.bob })).status, 400);
    assert.equal(
      (await call({ ...body, sessionToken: "0".repeat(64) })).status,
      401,
    );
    const good = await call(body);
    assert.equal(good.status, 200);
    assert.deepEqual(await good.json(), { value: { links: [] } });
  } finally {
    await api.close();
  }
});
