const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const pricing = require(process.env.EVOROS_TEST_LIB + '/lib/store/pricing.js');
function harness() {
  const slots = []; let index = 0, nextFetch, timeout;
  const react = {
    useState(initial) { const slot = index++; if (!(slot in slots)) slots[slot] = initial; return [slots[slot], value => {slots[slot] = value;}]; },
    useRef(initial) { const slot = index++; if (!(slot in slots)) slots[slot] = {current:initial}; return slots[slot]; },
    useCallback(fn) {return fn;}, useEffect() {},
  };
  const module = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync('src/components/store/use-evo-quote.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(code, {module,exports:module.exports,Date,AbortController,
    AbortSignal:{any:AbortSignal.any,timeout(ms){assert.equal(ms,15000); timeout=new AbortController();return timeout.signal;}},
    fetch:(...args)=>nextFetch(...args),require:name=>name==='react'?react:pricing,
  });
  return {render(enabled=true){index=0;return module.exports.useEvoQuote(enabled);},fetch(fn){nextFetch=fn;},expireRequest(){timeout.abort();}};
}
const quote = () => ({priceUsd:'0.00006612',source:'DexScreener',poolAddress:'0xb99a92b6d5a7ca3a2215a63d43d5e8ad43abc4e9',fetchedAt:new Date().toISOString()});

test('refresh keeps the verified quote pending and after failure, then replaces it on success',async()=>{
 const h=harness(),q=quote();h.fetch(async()=>Response.json(q));await h.render().refresh();assert.equal(h.render().quote.priceUsd,q.priceUsd);
 let reject;h.fetch(()=>new Promise((resolve,r)=>reject=r));const pending=h.render().refresh();
 assert.equal(h.render().loading,true);assert.equal(h.render().quote.priceUsd,q.priceUsd);
 reject(Error('network'));await pending;assert.equal(h.render().loading,false);assert.equal(h.render().error,true);assert.equal(h.render().quote.priceUsd,q.priceUsd);
 const newer={...quote(),priceUsd:'0.00007'};h.fetch(async()=>Response.json(newer));await h.render().refresh();assert.equal(h.render().quote.priceUsd,newer.priceUsd);assert.equal(h.render().error,false);
});
test('a stalled request times out, enables refresh again, and does not erase the last quote',async()=>{
 const h=harness();h.fetch(async()=>Response.json(quote()));await h.render().refresh();
 h.fetch((url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout')))));
 const pending=h.render().refresh();h.expireRequest();await pending;
 assert.equal(h.render().loading,false);assert.equal(h.render().error,true);assert.ok(h.render().quote);
});
test('a cancelled older refresh cannot replace a newer result',async()=>{
 const h=harness();let release;
 h.fetch(()=>new Promise(resolve=>release=resolve));const older=h.render().refresh();
 h.fetch(async()=>Response.json({...quote(),priceUsd:'0.00008'}));await h.render().refresh();
 release(Response.json(quote()));await older;assert.equal(h.render().quote.priceUsd,'0.00008');assert.equal(h.render().loading,false);
});
