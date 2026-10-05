const { it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");
const { DataSource } = require("typeorm");
const { SnakeNamingStrategy } = require("typeorm-naming-strategies");
const { Store } = require("@subsquid/typeorm-store");
const {
  ChangeTracker,
  rollbackBlock,
} = require("@subsquid/typeorm-store/lib/hot");
const f = require("./fixtures.cjs");
const { NurseryEvo } = f.load("model");
const { projectSnapshot } = f.load("nursery/projection");
const squid = process.env.NURSERY_TEST_SOURCE_DIR;
const migration = new (require(
  path.join(squid, "db/migrations/1791158400000-NurseryMetadata.js"),
))();
const db = new PGlite();
const nftId = "43114-" + f.collection + "-101";
const walletA = "43114-0x" + "a".repeat(40);
const walletB = "43114-0x" + "b".repeat(40);
const read = async (sql) => (await db.query(sql)).rows;
const save = (row) =>
  db.query(
    `insert into squid.nursery_evo(id,hatcher,block_number,block_hash,metadata)
values($1,$2,$3,$4,$5) on conflict(id) do update set hatcher=excluded.hatcher,block_number=excluded.block_number,block_hash=excluded.block_hash,metadata=excluded.metadata`,
    [
      row.id,
      row.hatcher,
      row.blockNumber,
      row.blockHash,
      JSON.stringify(row.metadata),
    ],
  );
const single = async () =>
  (await db.query("select * from metadata.get_evo($1)", ["101"])).rows[0];
const list = async (owner) =>
  (
    await db.query(
      "select metadata.get_evos(48,0,'PRICE_LOW_TO_HIGH',$1,null,null) as result",
      [owner ? [owner] : null],
    )
  ).rows[0].result;
const migrationDb = { query: (sql) => db.exec(sql) };
before(async () => {
  await db.exec("create schema squid; set search_path=squid,public;");
  for (const file of [
    "1749079541557-Data.js",
    "1749080326985-Data.js",
    "1756344326859-Data.js",
  ])
    await new (require(path.join(squid, "db/migrations", file)))().up(
      migrationDb,
    );
  await db.exec(
    fs.readFileSync(
      path.join(
        squid,
        "../../packages/database/drizzle/0000_rapid_mad_thinker.sql",
      ),
      "utf8",
    ),
  );
  await db.exec(`insert into squid.chain(id) values('43114');
insert into squid.contract(id,address,type,chain_id) values('43114-${f.collection}','${f.collection}','ERC721','43114');
insert into squid.wallet(id,address,chain_id) values('${walletA}','0x${"a".repeat(40)}','43114'),('${walletB}','0x${"b".repeat(40)}','43114');
insert into squid.nft(id,token_id,contract_id,owner_id) values('${nftId}',101,'43114-${f.collection}','${walletA}'),
('43114-${f.collection}-1',1,'43114-${f.collection}','${walletA}');
insert into metadata.species(id,species,primary_type,secondary_type) values(13,'kitsul','fire','none');
insert into metadata.evo(token_id,gender,generation,species_id,xp,total_breeds,created_at,hatched_at)
values(1,'male',0,13,4321,6,'2024-01-01','2024-02-01');`);
  await migration.up(migrationDb);
  for (const file of ["evos_filtered.sql", "evos_sorted.sql", "get_evos.sql"])
    await db.exec(
      fs.readFileSync(path.join(squid, "src/sql/functions", file), "utf8"),
    );
});
after(async () => {
  await db.close();
});
it("the real migration makes an unindexed egg visible in both single-token and wallet queries", async () => {
  assert.equal(await single(), undefined);
  const row = await projectSnapshot(
    nftId,
    f.hatcher,
    101n,
    f.block(),
    f.reader(),
    undefined,
    f.seed,
  );
  await save(row);
  assert.equal((await single()).metadata.type, "EGG");
  assert.equal((await single()).metadata.species, "kitsul");
  const owned = await list("0x" + "a".repeat(40));
  assert.equal(owned.total_count, 2);
  assert.equal(
    owned.items.find((x) => x.tokenId === "101").metadata.type,
    "EGG",
  );
});
it("treatment and hatching update API/list traits without allocating a new token or changing owner", async () => {
  const previous = (
    await read("select * from squid.nursery_evo where id='" + nftId + "'")
  )[0];
  const first = {
    id: previous.id,
    hatcher: previous.hatcher,
    blockNumber: previous.block_number,
    blockHash: previous.block_hash,
    metadata: previous.metadata,
  };
  const treated = await projectSnapshot(
    nftId,
    f.hatcher,
    101n,
    f.block(11),
    f.reader(1, true),
    first,
  );
  await save(treated);
  assert.equal((await single()).metadata.treated, true);
  const a = f.adult({ generation: 1n, totalBreeds: 0n });
  a.attributes = { ...a.attributes, rarity: 2n };
  const hatched = await projectSnapshot(
    nftId,
    f.hatcher,
    101n,
    f.block(20),
    f.reader(3, true, { adult: async () => a }),
    treated,
    undefined,
    f.block(20).timestamp,
  );
  await save(hatched);
  const one = await single();
  const many = (await list()).items.find((x) => x.tokenId === "101");
  assert.deepEqual(one.metadata, many.metadata);
  assert.equal(one.metadata.rarity, "epic");
  assert.equal(one.metadata.attack, 23);
  assert.equal(one.tokenid, "101");
  assert.equal(one.owner, "0x" + "a".repeat(40));
  assert.equal(
    (await read("select count(*)::int as count from squid.nft"))[0].count,
    2,
  );
});
it("canonical parent counts override stale legacy data while retaining settled XP and original dates", async () => {
  const id = "43114-" + f.collection + "-1";
  const row = await projectSnapshot(
    id,
    f.hatcher,
    1n,
    f.block(),
    f.reader(0, false, { adult: async () => f.adult() }),
  );
  await save(row);
  await save(row);
  const one = (await db.query("select * from metadata.get_evo($1)", ["1"]))
    .rows[0];
  assert.equal(one.metadata.total_breeds, 7);
  assert.equal(one.metadata.xp, 4321);
  assert.match(one.metadata.created_at, /^2024-01-01/);
  assert.match(one.metadata.hatched_at, /^2024-02-01/);
  assert.equal(
    (await read("select total_breeds from metadata.evo where token_id=1"))[0]
      .total_breeds,
    6,
  );
});
it("ownership stays with NFT transfers, and the overlay cannot leak to another collection with the same token number", async () => {
  await db.exec(`update squid.nft set owner_id='${walletB}' where id='${nftId}';
insert into squid.contract(id,address,type,chain_id) values('other','0x${"c".repeat(40)}','ERC721','43114');
insert into squid.nft(id,token_id,contract_id,owner_id) values('other-101',101,'other','${walletA}');`);
  assert.equal((await single()).owner, "0x" + "b".repeat(40));
  assert.equal(
    (await list("0x" + "a".repeat(40))).items.some((x) => x.tokenId === "101"),
    false,
  );
  assert.equal((await list("0x" + "b".repeat(40))).items[0].tokenId, "101");
  assert.equal(
    (await read("select metadata.evo_metadata('other-101') as metadata"))[0]
      .metadata,
    null,
  );
  await db.exec(
    "insert into squid.nft(id,token_id,contract_id,owner_id) values('other-1',1,'other','" +
      walletA +
      "');",
  );
  assert.equal(
    (await read("select metadata.evo_metadata('other-1') as metadata"))[0]
      .metadata,
    null,
  );
});
it("legacy counter SQL refuses canonical parents regardless of request replay", async () => {
  await db.exec(`insert into squid.breeding_request(id,request_id,amount_paid,status,parent1_id,parent2_id)
values('legacy',999,1000,'PENDING','43114-${f.collection}-1','43114-${f.collection}-101');`);
  for (let i = 0; i < 2; i++)
    await assert.rejects(
      db.query("select metadata.update_breeding_request_parents($1)", [999]),
      /Legacy Brenda/,
    );
  assert.equal(
    (await read("select total_breeds from metadata.evo where token_id=1"))[0]
      .total_breeds,
    6,
  );
});
it("actual Subsquid change tracking rolls back canonical updates and inserted rows", async () => {
  const connection = new DataSource({
    type: "postgres",
    entities: [NurseryEvo],
    schema: "squid",
    namingStrategy: new SnakeNamingStrategy(),
  });
  await connection.buildMetadatas();
  const meta = connection.getMetadata(NurseryEvo);
  assert.equal(meta.tableName, "nursery_evo");
  assert.equal(
    meta.findColumnWithPropertyName("blockNumber").databaseName,
    "block_number",
  );
  await db.exec(
    "create schema nursery_test; create table nursery_test.hot_block(height int primary key); create table nursery_test.hot_change_log(block_height int references nursery_test.hot_block on delete cascade,index int,change jsonb,primary key(block_height,index)); insert into nursery_test.hot_block values(30);",
  );
  const em = {
    connection,
    getMetadata: (type) => connection.getMetadata(type),
    query: async (sql, args) => (await db.query(sql, args)).rows,
    upsert: async (_type, rows) => {
      for (const row of Array.isArray(rows) ? rows : [rows]) await save(row);
    },
  };
  const parentId = "43114-" + f.collection + "-1";
  const old = (
    await read(
      "select metadata from squid.nursery_evo where id='" + parentId + "'",
    )
  )[0].metadata;
  const store = new Store(() => em, new ChangeTracker(em, "nursery_test", 30));
  await store.upsert(
    new NurseryEvo({
      id: parentId,
      hatcher: f.hatcher,
      blockNumber: 30,
      blockHash: f.block(30).hash,
      metadata: { ...old, total_breeds: 8 },
    }),
  );
  await store.upsert(
    new NurseryEvo({
      id: "orphan",
      hatcher: f.hatcher,
      blockNumber: 30,
      blockHash: f.block(30).hash,
      metadata: { type: "EGG" },
    }),
  );
  assert.equal(
    (
      await read(
        "select metadata from squid.nursery_evo where id='" + parentId + "'",
      )
    )[0].metadata.total_breeds,
    8,
  );
  await rollbackBlock("nursery_test", em, 30);
  assert.deepEqual(
    (
      await read(
        "select metadata from squid.nursery_evo where id='" + parentId + "'",
      )
    )[0].metadata,
    old,
  );
  assert.equal(
    (
      await read(
        "select count(*)::int as count from squid.nursery_evo where id='orphan'",
      )
    )[0].count,
    0,
  );
});
it("migration down restores legacy readers, and a re-apply installs the same read model", async () => {
  await migration.down(migrationDb);
  assert.equal(
    (await db.query("select * from metadata.get_evo($1)", ["1"])).rows[0]
      .metadata.total_breeds,
    6,
  );
  assert.equal(
    (await db.query("select * from metadata.get_evo($1)", ["101"])).rows[0]
      .metadata,
    null,
  );
  await migration.up(migrationDb);
  assert.equal(await single(), undefined);
});
