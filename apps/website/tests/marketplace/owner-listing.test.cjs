const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const result = {exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/marketplace/owner-listing.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, {module:result,exports:result.exports});
const {submitOwnerListing} = result.exports;
function fixture() {
  const external = {address:'0xOWNER'}, login = {address:'0xLOGIN'};
  const state = {address:external.address, owner:'0xowner', chainId:43114, selected:null, events:[], signers:[]};
  const wallet = {id:'io.metamask',getAccount:()=>state.address ? {...external,address:state.address} : undefined,getChain:()=>({id:state.chainId}),switchChain:async chain=>{state.events.push('switch');state.chainId=chain.id;}};
  state.selected=wallet;
  const options = {
    wallet, getSelectedWallet:()=>state.selected, chain:{id:43114},
    readOwner:async()=>{state.events.push('owner');return state.owner;},
    checkExisting:async owner=>{assert.equal(owner,external.address);state.events.push('duplicates');},
    needsApproval:async owner=>{assert.equal(owner,external.address);state.events.push('approval-read');return true;},
    approve:async account=>{state.signers.push(account);state.events.push('approve');return {status:'success'};},
    list:async account=>{state.signers.push(account);state.events.push('list');return {transactionHash:'0xreceipt',status:'success'};},
    onProgress:()=>{},
  };
  return {state,options,wallet,external,login};
}
test('both transactions use the pinned external owner, regardless of a separate login account',async()=>{
  const {state,options,external,login}=fixture();
  assert.deepEqual(await submitOwnerListing(options),{transactionHash:'0xreceipt',status:'success'});
  assert.equal(state.signers.length,2);
  assert.equal(state.signers[0],state.signers[1]);
  assert.equal(state.signers[0].address,external.address);
  assert.notEqual(state.signers[0].address,login.address);
  assert.deepEqual(state.events,['owner','duplicates','approval-read','owner','approve','duplicates','owner','list']);
});
test('missing, in-app and smart wallets cannot submit',async()=>{
  for (const id of [undefined,'smart','inApp']) {
    const {state,options}=fixture();options.wallet=id ? {...options.wallet,id} : undefined;
    await assert.rejects(()=>submitOwnerListing(options),/external wallet/);assert.deepEqual(state.signers,[]);
  }
});
test('non-owner fails before approval or listing',async()=>{
  const {state,options}=fixture();state.owner='0xOTHER';
  await assert.rejects(()=>submitOwnerListing(options),/does not own/);assert.deepEqual(state.events,['owner']);
});
test('already approved owner skips approval and still checks ownership before listing',async()=>{
  const {state,options}=fixture();options.needsApproval=async()=>false;
  await submitOwnerListing(options);assert.deepEqual(state.signers.map(a=>a.address),['0xOWNER']);
});
test('switches the selected external wallet to the contract chain',async()=>{
  const {state,options}=fixture();state.chainId=1;
  await submitOwnerListing(options);assert.equal(state.events[0],'switch');assert.equal(state.chainId,43114);
});
test('network-switch rejection cannot send transactions',async()=>{
  const {state,options}=fixture();state.chainId=1;options.wallet.switchChain=async()=>{throw Error('rejected');};
  await assert.rejects(()=>submitOwnerListing(options),/rejected/);assert.deepEqual(state.signers,[]);
});
test('account changes, wallet switches and disconnects during reads prevent sends',async()=>{
  for (const change of [s=>s.address='0xOTHER',s=>s.address=undefined,s=>s.selected=undefined,s=>s.chainId=1]) {
    const {state,options}=fixture();options.needsApproval=async()=>{change(state);return true;};
    await assert.rejects(()=>submitOwnerListing(options),/changed/);assert.deepEqual(state.signers,[]);
  }
});
test('ownership or wallet changes after approval prevent listing',async()=>{
  for (const change of [s=>s.owner='0xOTHER',s=>s.address='0xOTHER',s=>s.selected=undefined,s=>s.chainId=1]) {
    const {state,options}=fixture();const approve=options.approve;
    options.approve=async account=>{const receipt=await approve(account);change(state);return receipt;};
    await assert.rejects(()=>submitOwnerListing(options),/changed|does not own/);
    assert.deepEqual(state.events.filter(e=>e==='approve'||e==='list'),['approve']);
  }
});
test('failed ownership reads and duplicate checks fail closed',async()=>{
  for (const method of ['readOwner','checkExisting']) {
    const {state,options}=fixture();options[method]=async()=>{throw Error('RPC or duplicate failure');};
    await assert.rejects(()=>submitOwnerListing(options),/failure/);assert.deepEqual(state.signers,[]);
  }
});
test('duplicate appearing after approval prevents another listing',async()=>{
  const {state,options}=fixture();let reads=0;
  options.checkExisting=async()=>{if (++reads===2) throw Error('already listed');};
  await assert.rejects(()=>submitOwnerListing(options),/already listed/);
  assert.deepEqual(state.events.filter(e=>e==='approve'||e==='list'),['approve']);
});
test('approval rejection cannot become listing success',async()=>{
  const {state,options}=fixture();options.approve=async()=>{throw Error('user rejected');};
  await assert.rejects(()=>submitOwnerListing(options),/rejected/);assert.deepEqual(state.signers,[]);
});

test('reverted approval prevents listing and reverted listing cannot show success',async()=>{
  for (const method of ['approve','list']) {
    const {state,options}=fixture();
    options[method]=async()=>({status:'reverted'});
    await assert.rejects(()=>submitOwnerListing(options),/transaction failed/);
    if(method==='approve') assert.equal(state.events.includes('list'),false);
  }
});
