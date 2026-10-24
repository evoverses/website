import { it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function fixture() {
  const account={address:"0xEXTERNAL"};
  const state={address:account.address,chain:43114,switched:0,checked:[] as string[],code:"0x"};
  const wallet={id:"io.metamask",getAccount:()=>({address:state.address}),getChain:()=>({id:state.chain}),switchChain:async (chain:{id:number})=>{state.chain=chain.id;state.switched++;}};
  const gate={exports:{} as Record<string,unknown>};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/nursery/wallet-actions.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:gate,exports:gate.exports});
  const require=(id:string):unknown=>{
    if(id==="react") return {useCallback:(fn:unknown)=>fn,useEffect:()=>{},useRef:(value:unknown)=>({current:value}),useState:(value:unknown)=>[value,()=>{}],useSyncExternalStore:(_subscribe:unknown,getSnapshot:()=>boolean)=>getSnapshot()};
    if(id==="@tanstack/react-query") return {useQuery:()=>({data:true,isError:false})};
    if(id==="@/hooks/use-chain-wallet") return {useChainWallet:()=>({account,wallet})};
    if(id==="thirdweb") return {defineChain:(id:number)=>({id})};
    if(id==="thirdweb/react") throw Error("Nursery must not use the login wallet or global network switch");
    if(id==="@/lib/nursery/wallet-actions") return gate.exports;
    if(id==="@/lib/nursery/access") return {requireNurseryAccess:async()=>{}};
    if(id==="@/lib/nursery/network") return {nurseryChain:{id:43113}};
    if(id==="@/lib/nursery/contracts") return {verifyNursery:async()=>{},nurseryError:(error:Error)=>error.message,nurseryClient:{getCode:async({address}:{address:string})=>{state.checked.push(address);return state.code;}}};
    if(id==="@/lib/nursery/audit-client")return {startNurseryAudit:async()=>"test-attempt",auditNurseryFailure:async()=>{}};
    if(id==="@/lib/nursery/owned")return {};
    throw Error("Unexpected import "+id);
  };
  const result={exports:{} as {useNurseryWallet:()=>{account:typeof account;wallet:typeof wallet;guard:()=>Promise<void>;busy:boolean;run:(action:()=>Promise<void>)=>Promise<void>}}};
  const code=ts.transpileModule(fs.readFileSync("src/components/nursery/hooks.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(code,{require,module:result,exports:result.exports});
  return {hook:result.exports.useNurseryWallet(),makeHook:result.exports.useNurseryWallet,state,account,wallet};
}
it("nursery discovery and transactions use the external wallet, independently of login",async()=>{
  const f=fixture();assert.equal(f.hook.account,f.account);assert.equal(f.hook.wallet,f.wallet);
  await f.hook.guard();assert.equal(f.state.switched,1);assert.equal(f.state.chain,43113);assert.deepEqual(f.state.checked,[f.account.address]);
});
it("an account change prevents nursery transactions",async()=>{
  const f=fixture();f.state.address="0xOTHER";
  await assert.rejects(f.hook.guard(),/selected wallet/);assert.deepEqual(f.state.checked,[]);
});
it("a contract account remains blocked from nursery transactions",async()=>{
  const f=fixture();f.state.code="0x1234";
  await assert.rejects(f.hook.guard(),/standard wallet/);
});

it("different egg cards share the wallet lock for the entire approval and action workflow",async()=>{
  const f=fixture();let release=()=>{};const pending=new Promise<void>(resolve=>{release=resolve;});
  let first=0,second=0;
  const running=f.hook.run(async()=>{first++;await pending;});
  assert.equal(f.makeHook().busy,true);
  await f.makeHook().run(async()=>{second++;});
  assert.equal(second,0);
  release();await running;
  assert.equal(f.makeHook().busy,false);
  await f.makeHook().run(async()=>{second++;});
  assert.equal(first,1);assert.equal(second,1);
});
it("a rejected wallet workflow releases the shared lock",async()=>{
  const f=fixture();await f.hook.run(async()=>{throw Error("wallet rejected");});
  assert.equal(f.makeHook().busy,false);
  let signed=false;await f.makeHook().run(async()=>{signed=true;});assert.equal(signed,true);
});
