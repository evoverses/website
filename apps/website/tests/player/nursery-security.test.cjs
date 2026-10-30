const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), { randomUUID } = require('node:crypto');
function load(file, imports = {}, globals = {}) {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(`src/${file}`, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { module: mod, exports: mod.exports, require: name => name in imports ? imports[name] : require(name), Response, Request, URL, Headers, TextDecoder, Uint8Array, crypto, console: { info() {}, error() {}, warn() {} }, ...globals });
  return mod.exports;
}
class AccessError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }
const privateHeaders = () => new Headers({ 'Cache-Control': 'private, no-store' });
test('access is denied to signed-out, ordinary, regular-admin and absent-master sessions; errors fail closed', async () => {
  for (const status of [401, 403, 503]) {
    const { GET } = load('app/api/nursery/access/route.ts', {
      '@/lib/downloads/server': { AccessError, permission: async (admin, master) => { assert.equal(admin, true); assert.equal(master, true); throw new AccessError(status, 'DENIED'); } },
      '@/lib/downloads/core': { privateHeaders },
    });
    const result = await GET(); assert.equal(result.status, status); assert.equal((await result.json()).masterAdministrator, false); assert.match(result.headers.get('cache-control'), /no-store/);
  }
});
test('access succeeds only after the server requires master status', async () => {
  const { GET } = load('app/api/nursery/access/route.ts', {
    '@/lib/downloads/server': { AccessError, permission: async (admin, master) => { assert.equal(admin && master, true); return randomUUID(); } }, '@/lib/downloads/core': { privateHeaders },
  });
  assert.equal((await (await GET()).json()).masterAdministrator, true);
});
test('browser permission helper refuses missing flags, stale/failed responses and redirects', async () => {
  for (const body of [{}, { masterAdministrator: false }, { masterAdministrator: 'true' }]) {
    const { requireNurseryAccess } = load('lib/nursery/access.ts', {}, { fetch: async (_, options) => { assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error'); return Response.json(body); } });
    await assert.rejects(requireNurseryAccess());
  }
});
const wallet = '0x' + '1'.repeat(40), target = '0x' + '2'.repeat(40), hatcher = '0x' + '3'.repeat(40), token = '0x' + '4'.repeat(40), hash = '0x' + 'a'.repeat(64);
const core = load('lib/nursery/audit-core.ts');
function fixture(usesChainlinkRandomness = false) {
  const data = new Map(); let writes = 0, chain = { tx: null, receipt: null };
  const bucket = { get: async key => data.has(key) ? { json: async () => JSON.parse(data.get(key)) } : null, put: async (key, value) => { writes++; data.set(key, value); return { etag: String(writes) }; } };
  const viem = require('viem');
  const server = load('lib/nursery/audit-server.ts', {
    './vrf-audit': { rememberVrfRequest: async () => undefined },
    'server-only': {}, viem: { ...viem, createPublicClient: () => ({ getTransaction: async () => chain.tx, getTransactionReceipt: async () => chain.receipt }) },
    './test-wrapper': load('lib/nursery/test-wrapper.ts'),
    './network': { nurseryChain: require('viem/chains').avalancheFuji, nurseryTokenAddress: token, nurseryBerthaAddress: target, nurseryHermannAddress: hatcher, nurseryNetworkConfigured: true, nurseryWrapperAddress: target, usesChainlinkRandomness },
    './abi/Breeder_Bertha.json': require('../../src/lib/nursery/abi/Breeder_Bertha.json'), './abi/Hatcher_Hermann.json': require('../../src/lib/nursery/abi/Hatcher_Hermann.json'),
    '@/lib/downloads/server': { AccessError }, './audit-core': core,
  });
  return { data, bucket, chain, ...server, writes: () => writes };
}
const intent = { kind: 'start', action: 'completeBreed', wallet, target, args: ['1'], value: '0', chainId: 43113 };
test('intent uses server actor/time, rejects mainnet, foreign targets and browser actor fields', async () => {
  const f = fixture(), actor = randomUUID(), result = await f.writeNurseryAudit(f.bucket, actor, intent);
  const record = JSON.parse([...f.data.values()][1]); assert.equal(record.administratorId, actor); assert.equal(record.source, 'server_authorized'); assert.equal(record.attemptId, result.attemptId);
  for (const bad of [{ ...intent, chainId: 43114 }, { ...intent, administratorId: randomUUID() }, { ...intent, target: wallet }]) await assert.rejects(f.writeNurseryAudit(f.bucket, actor, bad));
});
test('audit receipt belongs to its master actor and arbitrary payload/error strings are refused', async () => {
  const f = fixture(), actor = randomUUID(), { attemptId } = await f.writeNurseryAudit(f.bucket, actor, intent);
  await assert.rejects(f.writeNurseryAudit(f.bucket, randomUUID(), { kind: 'event', attemptId, phase: 'failed' }), /ATTEMPT_OWNER_REQUIRED/);
  await assert.rejects(f.writeNurseryAudit(f.bucket, actor, { kind: 'event', attemptId, phase: 'failed', message: 'secret must not be stored' }), /INVALID_REQUEST/);
});
test('confirmed and reverted outcomes require matching chain transaction, sender, calldata, value and receipt', async () => {
  const f = fixture(), actor = randomUUID(), { attemptId } = await f.writeNurseryAudit(f.bucket, actor, intent);
  const data = require('viem').encodeFunctionData({ abi: require('../../src/lib/nursery/abi/Breeder_Bertha.json'), functionName: 'completeBreed', args: [1n] });
  const tx = { from: wallet, to: target, input: data, value: 0n, gas: 753378n };
  f.chain.receipt = { transactionHash: hash, status: 'success', blockNumber: 123n };
  for (const bad of [{ ...tx, from: target }, { ...tx, to: wallet }, { ...tx, input: '0x' }, { ...tx, value: 1n }]) {
    f.chain.tx = bad; await assert.rejects(f.writeNurseryAudit(f.bucket, actor, { kind: 'event', attemptId, phase: 'confirmed', transactionHash: hash }), /TRANSACTION_MISMATCH/);
  }
  f.chain.tx = tx;
  await f.writeNurseryAudit(f.bucket, actor, { kind: 'event', attemptId, phase: 'confirmed', transactionHash: hash });
  const last = JSON.parse([...f.data.values()].at(-1)); assert.equal(last.source, 'chain_verified'); assert.equal(last.blockNumber, '123'); assert.equal(last.gasLimit, '753378');
  await assert.rejects(f.writeNurseryAudit(f.bucket, actor, { kind: 'event', attemptId, phase: 'reverted', transactionHash: hash }), /TRANSACTION_MISMATCH/);
});
test('audit storage failure prevents returning a signing intent', async () => {
  const f = fixture(); await assert.rejects(f.writeNurseryAudit({ ...f.bucket, put: async () => null }, randomUUID(), intent), /AUDIT_UNAVAILABLE/);
});
test('audit mutation and history both require master before storage; cross-origin mutation fails', async () => {
  let accessed = false;
  const route = load('app/api/nursery/audit/route.ts', {
    '@/lib/downloads/server': { AccessError, permission: async (admin, master) => { assert.ok(admin && master); throw new AccessError(403, 'MASTER_ADMIN_REQUIRED'); }, bucket: async () => { accessed = true; } },
    '@/lib/downloads/core': { privateHeaders }, '@/lib/player/server': { getPlayerWebOrigin: () => 'https://beta.evoverses.com' }, '@/lib/nursery/audit-server': { writeNurseryAudit() { accessed = true; } },
  });
  assert.equal((await route.GET(new Request('https://beta.evoverses.com/api/nursery/audit'))).status, 403);
  assert.equal((await route.POST(new Request('https://beta.evoverses.com/api/nursery/audit', { method: 'POST', headers: { origin: 'https://beta.evoverses.com' }, body: '{}' }))).status, 403);
  assert.equal((await route.POST(new Request('https://beta.evoverses.com/api/nursery/audit', { method: 'POST', headers: { origin: 'https://attacker.invalid' }, body: '{}' }))).status, 403);
  assert.equal(accessed, false);
});
function browser(options = {}) {
  const events = [], storage = new Map(), attemptId = randomUUID();
  const client = load('lib/nursery/audit-client.ts', { './audit-core': core }, {
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    fetch: async (_, request) => { const value = JSON.parse(request.body); events.push(value); if (options.fail?.(value)) return Response.json({}, { status: 503 }); return Response.json(value.kind === 'start' ? { attemptId } : { recorded: true }); },
  });
  return { ...client, events, storage };
}
test('real transaction flow records intent and wallet request before signing and saves hash before polling', async () => {
  const b = browser(); let saved = false;
  await b.runAuditedTransaction(intent, {
    simulate: async () => assert.equal(b.events[0].kind, 'start'), guard: async () => {},
    send: async () => { assert.equal(b.events.at(-1).phase, 'wallet_requested'); return hash; },
    submitted: h => { assert.equal(h, hash); saved = true; }, wait: async () => { assert.equal(saved, true); return { status: 'success' }; },
  });
  assert.deepEqual(b.events.map(x => x.phase ?? x.kind), ['start', 'wallet_requested', 'submitted', 'confirmed']);
});
test('permission revoked, simulation failure and audit outage each prevent wallet signing', async () => {
  for (const where of ['start', 'simulation', 'guard', 'wallet_requested']) {
    const b = browser({ fail: value => value.kind === where || value.phase === where }); let signed = false;
    await assert.rejects(b.runAuditedTransaction(intent, { simulate: async () => { if (where === 'simulation') throw Error('failed'); }, guard: async () => { if (where === 'guard') throw Error('revoked'); }, send: async () => { signed = true; return hash; }, wait: async () => ({ status: 'success' }) }));
    assert.equal(signed, false);
  }
});
test('cancelled wallet and receipt timeout have distinct outcomes, hashes survive logging failure', async () => {
  const cancelled = browser();
  await assert.rejects(cancelled.runAuditedTransaction(intent, { simulate: async () => {}, guard: async () => {}, send: async () => { throw { code: 4001 }; }, wait: async () => ({ status: 'success' }) }));
  assert.equal(cancelled.events.at(-1).phase, 'cancelled');
  const pending = browser({ fail: v => v.phase === 'submitted' });
  await assert.rejects(pending.runAuditedTransaction(intent, { simulate: async () => {}, guard: async () => {}, send: async () => hash, wait: async () => { throw Error('timeout'); } }), /Confirmation is pending/);
  assert.equal(pending.events.at(-1).phase, 'confirmation_unknown'); assert.equal(pending.events.at(-1).transactionHash, hash); assert.ok(pending.storage.size);
});

test('rendered treatment and hatch buttons require master access even for an otherwise eligible owned egg', () => {
  const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
  const div = props => React.createElement('div', props), Button = ({ variant, ...props }) => React.createElement('button', props);
  let canAct = false, canonicalTreated = false, observedCard;
  const asset = { tokenId: '5109', metadata: { type: 'EGG', treated: false, createdAt: '1970-01-01T00:00:00.000Z', species: 'Unknown', generation: 1 } };
  const { Hatchery } = load('components/nursery/hatchery.tsx', {
    '@/lib/nursery/network': { usesChainlinkRandomness: false },
    '@/lib/nursery/access': { nurseryAccessMessage: 'Master administrators only' },
    './hatch-reveal': { useHatchReveals: () => ({ records: [], remember() {} }), HatchReveal: () => null },
    './action-progress': { useNurseryAction: () => ({ progress: null, copy: null }), NurseryActionProgress: () => null },
    './approval-choice': { useEvoApprovalPreference: () => ({ ready: true, persistent: true, setPersistent() {} }), EvoApprovalChoice: () => null },
    './test-randomness': { TestRandomness: () => null },
    '@/lib/nursery/audit-client': {},
    './hooks': { useNurseryWallet: () => ({ canAct, account: { address: wallet }, busy: false, error: null }), useNow: () => 1792037670n + 259200n,
      useOwnedEvos: () => ({ assets: [asset], isLoading: false }), useRemembered: () => ({ values: [] }),
      useEgg: () => ({ data: { egg: [1n, 2n, 1n, 1792037670n, canonicalTreated, 1, 0n], fulfilled: false, owned: true } }),
    },
    '@tanstack/react-query': { useQueryClient: () => ({}), useQuery: options => ({ data: options.queryKey[0] === 'nursery-egg-list' ? ['5109'] : { quote: 0n, maximum: 0n }, isLoading: false }) },
    '@workspace/ui/components/button': { Button }, '@workspace/ui/components/input': { Input: props => React.createElement('input', props) },
    '@workspace/ui/components/card': Object.fromEntries(['Card', 'CardContent', 'CardHeader', 'CardTitle'].map(name => [name, div])),
    '@workspace/evoverses/components/evo-card': { EvoCard: ({ asset }) => { observedCard = asset; return null; } },
    '@/lib/nursery/contracts': { nurseryConfigured: true, nurseryScope: 'test', hermannAddress: hatcher },
    '@/lib/nursery/rules': load('lib/nursery/rules.ts'),
    './shared': { ConnectNursery: () => null, ErrorMessage: () => null, Loading: div, Notice: div, VrfPrice: () => null, evoAmount: n => String(n / 10n ** 18n) },
    './native-credits': { NativeCredits: () => null },
  });
  for (canonicalTreated of [false, true]) for (canAct of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(Hatchery));
    for (const label of [canonicalTreated ? 'Treated' : 'Treat · 250 EVO', 'Hatch']) {
      const button = [...html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)].find(match => match[2].includes(label));
      assert.ok(button, label); assert.equal(/\sdisabled(?:=|\s|$)/.test(button[1]), !canAct || (canonicalTreated && label === 'Treated'), label);
      if (label !== 'Hatch') assert.match(button[1], /bg-green-600/);
    }
    assert.equal(observedCard.metadata.treated, canonicalTreated);
    assert.equal(observedCard.metadata.createdAt, new Date(1792037670 * 1000).toISOString());
  }
});

test('short test incubation uses the canonical duration while production defaults remain three days', () => {
  const { hatchState, remainingTime, INCUBATION } = load('lib/nursery/rules.ts');
  assert.equal(INCUBATION, 259200n);
  assert.equal(hatchState(1000n, 1, false, false, 1119n, 120n).canRequest, false);
  assert.equal(hatchState(1000n, 1, false, false, 1120n, 120n).canRequest, true);
  assert.equal(hatchState(1000n, 1, false, false, 1120n).canRequest, false);
  assert.equal(remainingTime(59n), '59s');
});

test('age formatting accepts days without reinterpreting them as an epoch date', () => {
  const file = '../../packages/evoverses/src/utils/numbers.ts';
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module: mod, exports: mod.exports, require: () => ({ EM_DASH: '—', pluralize: (n, label) => n === 1 ? label : label + 's' }) });
  const { ageFormatter } = mod.exports;
  assert.equal(ageFormatter(2 / 1440), '< 1 Day'); assert.equal(ageFormatter(2), '2 Days'); assert.equal(ageFormatter(60), '2 Months'); assert.equal(ageFormatter(730), '2 Years'); assert.equal(ageFormatter(NaN), 'Unknown');
});

test('manual fulfilment is rejected on the Chainlink deployment', async () => {
  const f = fixture(true);
  // A fulfilment can only target a configured manual fixture; never the Chainlink wrapper.
  await assert.rejects(f.writeNurseryAudit(f.bucket, randomUUID(), { ...intent, action: 'fulfill', target, args: ['1', '42'] }), /INVALID_ACTION/);
});

test('canonical Chainlink callback evidence binds request and receipt, persists once and detects failure', async () => {
  const viem = require('viem');
  const eventAbi = viem.parseAbi(['event RandomnessRequested(uint256 indexed requestId,address indexed payer,uint256 vrfCost,bool subsidised)', 'event RandomnessReady(uint256 indexed requestId,uint256 word)', 'event WrapperFulfillmentFailed(uint256 indexed requestId,address indexed consumer)']);
  const blockHash = '0x' + 'b'.repeat(64), callbackHash = '0x' + 'c'.repeat(64), wrapper = '0x' + '5'.repeat(40), requestId = 2n ** 200n + 17n;
  for (const failed of [false, true]) {
    const data = new Map(); let scans = 0;
    const bucket = { get: async key => data.has(key) ? { etag: '1', json: async () => JSON.parse(data.get(key)) } : null, head: async key => data.has(key) ? {} : null, put: async (key, value, options) => { if (options?.onlyIf?.etagDoesNotMatch && data.has(key)) return null; data.set(key, value); return { etag: '1' }; } };
    const log = { address: target, topics: viem.encodeEventTopics({ abi: eventAbi, eventName: 'RandomnessRequested', args: { requestId, payer: wallet } }), data: viem.encodeAbiParameters([{ type: 'uint256' }, { type: 'bool' }], [55n, false]) };
    const callback = { address: failed ? wrapper : target, logIndex: 1, blockHash, transactionHash: callbackHash, topics: viem.encodeEventTopics({ abi: eventAbi, eventName: failed ? 'WrapperFulfillmentFailed' : 'RandomnessReady', args: failed ? { requestId, consumer: target } : { requestId } }), data: failed ? '0x' : viem.encodeAbiParameters([{ type: 'uint256' }], [42n]) };
    let receiptMatches = false;
    const client = { getBlock: async () => ({ hash: blockHash, timestamp: 1792037106n }), getBlockNumber: async () => 150n, getContractEvents: async options => { scans++; assert.equal(options.fromBlock, 100n); assert.equal(options.toBlock, 150n); assert.equal(options.args.requestId, requestId); return options.eventName === (failed ? 'WrapperFulfillmentFailed' : 'RandomnessReady') ? [callback] : []; }, getTransactionReceipt: async () => ({ status: 'success', transactionHash: callbackHash, blockHash, blockNumber: 150n, gasUsed: 90000n, effectiveGasPrice: 160n, logs: receiptMatches ? [callback] : [] }) };
    const vrf = load('lib/nursery/vrf-audit.ts', { 'server-only': {}, viem: { ...viem, createPublicClient: () => client }, './network': { nurseryChain: require('viem/chains').avalancheFuji, nurseryBerthaAddress: target, nurseryHermannAddress: hatcher, nurseryWrapperAddress: wrapper, usesChainlinkRandomness: true }, '@/lib/downloads/server': { AccessError } });
    const attempt = { ...intent, action: 'breed', attemptId: randomUUID(), administratorId: randomUUID(), createdAt: new Date().toISOString() };
    const requestReceipt = { logs: [log], transactionHash: hash, blockHash, blockNumber: 100n };
    assert.equal(await vrf.rememberVrfRequest(bucket, attempt, requestReceipt), String(requestId));
    await assert.rejects(vrf.reconcileVrf(bucket, 'bertha', String(requestId)), /VRF_CALLBACK_MISMATCH/);
    assert.equal([...data.keys()].filter(k => k.includes('/events/')).length, 0);
    receiptMatches = true;
    const result = await vrf.reconcileVrf(bucket, 'bertha', String(requestId)); assert.equal(result.status, failed ? 'callback_failed' : 'fulfilled');
    const records = [...data.entries()].filter(([k]) => k.includes('/events/')).map(([, v]) => JSON.parse(v)); assert.equal(records.length, 1); assert.equal(records[0].administratorId, attempt.administratorId); assert.equal(records[0].source, 'chain_verified'); assert.equal(records[0].vrfRequestId, String(requestId)); assert.equal(records[0].requestTransactionHash, hash);
    const before = scans; await vrf.reconcileVrf(bucket, 'bertha', String(requestId)); assert.equal(scans, before);
    await assert.rejects(vrf.reconcileVrf(bucket, 'hermann', String(requestId)), /VRF_AUDIT_PENDING/);
  }
});

test('Chainlink reconciliation refuses ordinary users and cross-origin calls before accessing chain/storage', async () => {
  let touched = false;
  const route = load('app/api/nursery/randomness/route.ts', { '@/lib/downloads/server': { AccessError, permission: async (a, m) => { assert.ok(a && m); throw new AccessError(403, 'MASTER_ADMIN_REQUIRED'); }, bucket: async () => { touched = true; } }, '@/lib/downloads/core': { privateHeaders }, '@/lib/player/server': { getPlayerWebOrigin: () => 'https://beta.evoverses.com' }, '@/lib/nursery/vrf-audit': { reconcileVrf: async () => { touched = true; } } });
  for (const origin of ['https://beta.evoverses.com', 'https://attacker.invalid']) { const result = await route.POST(new Request('https://beta.evoverses.com/api/nursery/randomness?keeper=bertha&id=1', { method: 'POST', headers: { origin } })); assert.equal(result.status, 403); assert.match(result.headers.get('cache-control'), /no-store/); }
  assert.equal(touched, false);
});

test('egg art uses each canonical species and retains Genesis variant selection', () => {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('../../packages/evoverses/src/lib/asset/utils.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { module: mod, exports: mod.exports, process: { env: { NEXT_PUBLIC_BASE_API_IMAGE_URL: 'https://images.example.test', NEXT_PUBLIC_API_IMAGE_SUFFIX: 'public' } }, require: name => name.includes('database') ? { Element: { none: 'none' } } : {} });
  const egg = { chainId: '43113', tokenId: '5109', metadata: { type: 'EGG', generation: 1, species: 'finantis' } };
  assert.equal(mod.exports.getEvoCardEvoImageUrl(egg), 'https://images.example.test/evo/finantis/egg/public');
  assert.equal(mod.exports.getEvoCardEvoImageUrl({ ...egg, metadata: { ...egg.metadata, species: 'nissel' } }), 'https://images.example.test/evo/nissel/egg/public');
  assert.equal(mod.exports.getEvoCardEvoImageUrl({ ...egg, metadata: { ...egg.metadata, generation: 0, species: 'Unknown' } }), 'https://images.example.test/evo/unknown/1/public');
});

test('egg species is recovered from canonical creation events, including old eggs beyond recent log ranges', async () => {
  const viem = require('viem'), blockHash = '0x' + 'd'.repeat(64);
  for (const old of [false, true]) {
    let stale = false; const ranges = [];
    const originBlock = old ? 200n : 4999n;
    const client = { getBlock: async ({ blockNumber }) => ({ number: blockNumber, timestamp: blockNumber * 2n, hash: stale ? '0x' + 'e'.repeat(64) : blockHash }), getLogs: async options => { ranges.push(options); assert.ok(options.toBlock - options.fromBlock <= 1023n); return options.fromBlock <= originBlock && options.toBlock >= originBlock ? [{ blockNumber: originBlock, blockHash, args: { tokenId: 5109n, parent1: 1n, parent2: 2n, species: 2n, generation: 1n } }] : []; } };
    const { readEggOrigin } = load('lib/nursery/egg-origin.ts', { 'server-only': {}, viem: { ...viem, createPublicClient: () => client }, './network': { nurseryChain: require('viem/chains').avalancheFuji, nurseryHermannAddress: hatcher } });
    const egg = [1n, 2n, 1n, originBlock * 2n, true, 1, 0n];
    const origin = await readEggOrigin(5109n, egg, { number: 5000n, timestamp: 10000n });
    assert.equal(origin.species, 2n); assert.equal(origin.generation, 1n); assert.equal(origin.blockNumber, originBlock);
    const before = ranges.length;
    await readEggOrigin(5109n, egg, { number: 5000n, timestamp: 10000n }); assert.equal(ranges.length, before);
    stale = true;
    await assert.rejects(readEggOrigin(5109n, egg, { number: 5000n, timestamp: 10000n }), /Canonical egg species is unavailable/);
  }
});

test('Nursery gas budgets round upward and reject missing or invalid estimates', () => {
  const { nurseryGasBudget } = load('lib/nursery/gas-budget.ts');
  assert.equal(nurseryGasBudget(602702n), 753378n);
  assert.equal(nurseryGasBudget(1n), 2n);
  assert.throws(() => nurseryGasBudget(0n)); assert.throws(() => nurseryGasBudget(-1n));
});

test('actual Nursery send path simulates and signs the same padded gas limit; failed estimates/simulations never sign', async () => {
  const viem = require('viem');
  for (const failure of [null, 'estimate', 'simulation']) {
    const audit = browser(), calls = []; let signed = false;
    const gas = load('lib/nursery/gas-budget.ts');
    const publicClient = {
      estimateGas: async request => { assert.equal(audit.events[0].kind, 'start'); calls.push({ kind: 'estimate', request }); if (failure === 'estimate') throw Error('RPC estimate failed'); return 602702n; },
      call: async request => { calls.push({ kind: 'simulation', request }); assert.equal(request.gas, 753378n); if (failure === 'simulation') throw Error('Out of gas'); return {}; },
      waitForTransactionReceipt: async () => ({ status: 'success' }),
    };
    const contracts = load('lib/nursery/contracts.ts', {
      './access': { requireNurseryAccess: async () => {} }, './audit-client': { runAuditedTransaction: audit.runAuditedTransaction }, './audit-core': core, './gas-budget': gas,
      '../beta/release-policy': { requireBreedingApproval() {} },
      './network': { nurseryChain: require('viem/chains').avalancheFuji, nurseryTokenAddress: token, nurseryNftAddress: wallet, nurseryBerthaAddress: target, nurseryHermannAddress: hatcher, nurseryNetworkConfigured: true, nurseryWrapperAddress: wallet, usesChainlinkRandomness: true },
      '@/lib/thirdweb/config': { client: {} }, './abi/Breeder_Bertha.json': require('../../src/lib/nursery/abi/Breeder_Bertha.json'), './abi/Hatcher_Hermann.json': require('../../src/lib/nursery/abi/Hatcher_Hermann.json'),
      viem: { ...viem, createPublicClient: () => publicClient },
       './wallet-send': { sendNurseryWalletTransaction: async (account, transaction) => { signed = true; assert.equal(transaction.gas, 753378n); assert.equal(transaction.gasPrice, 160n); assert.equal(transaction.value, 60772096n); assert.equal(transaction.data, calls[0].request.data); assert.equal(audit.events.at(-1).phase, 'wallet_requested'); return { transactionHash: hash }; } },
      './rules': load('lib/nursery/rules.ts'), './discovery': {},
    });
    const result = contracts.sendNurseryTransaction({ address: wallet }, target, contracts.berthaAbi, 'breed', [1n, 2n, 1000n * 10n ** 18n], { value: 60772096n, gasPrice: 160n });
    if (failure) { await assert.rejects(result); assert.equal(signed, false); assert.equal(audit.events.at(-1).errorCode, 'SIMULATION_FAILED'); }
    else { await result; assert.equal(signed, true); assert.equal(audit.events.at(-1).phase, 'confirmed'); }
  }
});

test('persistent EVO approval is granted once per spender, reused after spending, and renewed after revocation', async () => {
  const viem = require('viem'), audit = browser(); let allowance = 0n, balance = 1000n * 10n ** 18n;
  const signed = [], phases = []; let required = 0;
  const contracts = load('lib/nursery/contracts.ts', {
    './access': { requireNurseryAccess: async () => {} }, './audit-client': { runAuditedTransaction: audit.runAuditedTransaction }, './audit-core': core, './gas-budget': load('lib/nursery/gas-budget.ts'),
    '../beta/release-policy': { requireBreedingApproval() {} },
    './network': { nurseryChain: require('viem/chains').avalancheFuji, nurseryTokenAddress: token, nurseryNftAddress: wallet, nurseryBerthaAddress: target, nurseryHermannAddress: hatcher, nurseryNetworkConfigured: true, nurseryWrapperAddress: wallet, usesChainlinkRandomness: true },
    '@/lib/thirdweb/config': { client: {} }, './abi/Breeder_Bertha.json': require('../../src/lib/nursery/abi/Breeder_Bertha.json'), './abi/Hatcher_Hermann.json': require('../../src/lib/nursery/abi/Hatcher_Hermann.json'),
    viem: { ...viem, createPublicClient: () => ({ readContract: async request => { assert.equal(request.address, token); return request.functionName === 'balanceOf' ? balance : allowance; }, estimateGas: async () => 50000n, call: async () => ({}), waitForTransactionReceipt: async () => ({ status: 'success' }) }) },
     './wallet-send': { sendNurseryWalletTransaction: async (account, transaction) => { const call = viem.decodeFunctionData({ abi: viem.erc20Abi, data: transaction.data }); signed.push(call); allowance = call.args[1]; return { transactionHash: hash }; } },
    './rules': load('lib/nursery/rules.ts'), './discovery': {},
  });
  const cost = 250n * 10n ** 18n, options = { persistent: true, onRequired: () => required++, onProgress: phase => phases.push(phase) };
  await contracts.approveEvo({ address: wallet }, hatcher, cost, async () => {}, options);
  assert.equal(signed[0].args[0], hatcher); assert.equal(signed[0].args[1], viem.maxUint256);
  assert.deepEqual(phases, ['wallet', 'confirming', 'confirmed']); assert.equal(required, 1);
  // The deployed OZ token preserves max allowance while the action consumes only its actual cost.
  balance -= cost;
  await contracts.approveEvo({ address: wallet }, hatcher, cost, async () => {}, options);
  assert.equal(signed.length, 1); assert.equal(required, 1);
  allowance = 0n;
  await contracts.approveEvo({ address: wallet }, hatcher, cost, async () => {}, options);
  assert.equal(signed.length, 2);
  allowance = 0n;
  await contracts.approveEvo({ address: wallet }, hatcher, cost, async () => {}, { persistent: false });
  assert.equal(signed.at(-1).args[1], cost);
  // Opting out does not silently revoke an existing allowance.
  allowance = viem.maxUint256;
  const before = signed.length;
  await contracts.approveEvo({ address: wallet }, hatcher, cost, async () => {}, { persistent: false });
  assert.equal(signed.length, before);
  balance = 0n;
  await assert.rejects(contracts.approveEvo({ address: wallet }, hatcher, cost, async () => {}, options), /need more EVO/);
  assert.equal(signed.length, before);
});

test('progress distinguishes wallet prompts from network confirmation and keeps button labels short', () => {
  const { progressCopy } = load('lib/nursery/progress.ts');
  for (const kind of ['treat', 'breed', 'hatch', 'finish']) for (const phase of ['preparing', 'wallet', 'confirming', 'confirmed']) {
    const copy = progressCopy({ kind, step: 'action', phase, approvalNeeded: kind === 'treat' });
    assert.ok(copy.button.length <= 16); assert.ok(!copy.button.includes('wallet'));
    if (phase === 'wallet') assert.match(copy.message, /in your wallet/);
    if (phase === 'confirming') { assert.match(copy.message, /Waiting for confirmation/); assert.ok(!copy.message.includes('in your wallet')); }
  }
  assert.match(progressCopy({ kind: 'treat', step: 'approval', phase: 'confirming' }).message, /^Step 1 of 2:/);
  assert.match(progressCopy({ kind: 'treat', step: 'action', phase: 'wallet', approvalNeeded: true }).message, /^Step 2 of 2:/);
  assert.ok(!progressCopy({ kind: 'treat', step: 'action', phase: 'wallet', approvalNeeded: false }).message.includes('Step 2'));
});


test('breeding history follows the full egg lifecycle and rejects unknown or missing egg state', () => {
  const { breedHatchProgress } = load('lib/nursery/breed-hatch-progress.ts', { './rules': load('lib/nursery/rules.ts') });
  const egg = [1n, 2n, 1n, 1000n, true, 1, 9n];
  const incubating = breedHatchProgress(egg, false, 1000n, 120n);
  assert.equal(incubating.title, 'Incubating'); assert.match(incubating.advice, /2m/); assert.equal(incubating.complete, false);
  assert.equal(breedHatchProgress(egg, false, 1120n, 120n).title, 'Ready to hatch');
  assert.equal(breedHatchProgress(egg, false, 1120n, 259200n).title, 'Incubating');
  egg[5] = 2;
  assert.equal(breedHatchProgress(egg, false, 1121n, 120n).title, 'Preparing your Evo');
  assert.equal(breedHatchProgress(egg, true, 1121n, 120n).title, 'Ready to reveal');
  egg[5] = 3;
  assert.equal(breedHatchProgress(egg, false, 1121n, 120n).complete, true);
  assert.equal(breedHatchProgress(egg, false, 1121n, 120n).title, 'Hatched');
  for (const status of [0, 4]) { egg[5] = status; assert.throws(() => breedHatchProgress(egg, false, 1121n, 120n), /unavailable/); }
});

test('all nursery cards share one in-flight audit queue delivery', async () => {
  const storage=new Map(), event={kind:'event',attemptId:randomUUID(),phase:'failed',errorCode:'ACTION_FAILED'};
  storage.set('evo-nursery:audit-pending:v1',JSON.stringify([event]));
  let requests=0,release;const pending=new Promise(resolve=>{release=resolve;});
  const client=load('lib/nursery/audit-client.ts',{'./audit-core':core},{
    localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},
    fetch:async()=>{requests++;await pending;return Response.json({recorded:true});},
  });
  const first=client.retryNurseryAudit(),second=client.retryNurseryAudit();assert.equal(first,second);assert.equal(requests,1);
  release();await Promise.all([first,second]);assert.equal(requests,1);assert.equal(JSON.parse(storage.get('evo-nursery:audit-pending:v1')).length,0);
});
