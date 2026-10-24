const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file){const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/nursery/'+file+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:mod,exports:mod.exports,require});return mod.exports;}
const {resolveNurseryNetwork,mainnetNurseryDependencies:d,chainlinkFujiWrapper}=load('network-config');
const main={NEXT_PUBLIC_NURSERY_NETWORK:'mainnet-pilot',NEXT_PUBLIC_NURSERY_EVO_ADDRESS:d.token,NEXT_PUBLIC_NURSERY_NFT_ADDRESS:d.nft,NEXT_PUBLIC_NURSERY_WRAPPER_ADDRESS:d.wrapper,NEXT_PUBLIC_NURSERY_BERTHA_ADDRESS:'0x'+ '1'.repeat(40),NEXT_PUBLIC_NURSERY_HERMANN_ADDRESS:'0x'+'2'.repeat(40),NEXT_PUBLIC_NURSERY_REGISTRY_VERSION:'2'};
test('explicit mainnet release pins real dependencies and defaults to read-only',()=>{const n=resolveNurseryNetwork(main);assert.equal(n.configured,true);assert.equal(n.chain.id,43114);assert.equal(n.chainlink,true);assert.equal(n.transactionsEnabled,false);assert.match(n.message,/Live assets/);});
test('mainnet signing requires the reviewed build setting as well as valid wiring',()=>{assert.equal(resolveNurseryNetwork({...main,NEXT_PUBLIC_NURSERY_MAINNET_APPROVED:'1'}).transactionsEnabled,true);for(const key of ['NEXT_PUBLIC_NURSERY_EVO_ADDRESS','NEXT_PUBLIC_NURSERY_NFT_ADDRESS','NEXT_PUBLIC_NURSERY_WRAPPER_ADDRESS'])assert.equal(resolveNurseryNetwork({...main,[key]:chainlinkFujiWrapper,NEXT_PUBLIC_NURSERY_MAINNET_APPROVED:'1'}).transactionsEnabled,false);});
test('unknown network, missing registry version, missing/duplicate addresses fail closed',()=>{for(const change of [{NEXT_PUBLIC_NURSERY_NETWORK:'mainnet'},{NEXT_PUBLIC_NURSERY_REGISTRY_VERSION:'1'},{NEXT_PUBLIC_NURSERY_HERMANN_ADDRESS:''},{NEXT_PUBLIC_NURSERY_HERMANN_ADDRESS:main.NEXT_PUBLIC_NURSERY_BERTHA_ADDRESS}]){const n=resolveNurseryNetwork({...main,...change,NEXT_PUBLIC_NURSERY_MAINNET_APPROVED:'1'});assert.equal(n.configured,false);assert.equal(n.transactionsEnabled,false);}});
test('existing Fuji release remains the default and cannot use the mainnet assets',()=>{const env={NEXT_PUBLIC_FUJI_EVO_ADDRESS:'0x'+'3'.repeat(40),NEXT_PUBLIC_FUJI_EVO_NFT_ADDRESS:'0x'+'4'.repeat(40),NEXT_PUBLIC_FUJI_BERTHA_ADDRESS:'0x'+'5'.repeat(40),NEXT_PUBLIC_FUJI_HERMANN_ADDRESS:'0x'+'6'.repeat(40),NEXT_PUBLIC_FUJI_WRAPPER_ADDRESS:chainlinkFujiWrapper};const n=resolveNurseryNetwork(env);assert.equal(n.chain.id,43113);assert.equal(n.configured,true);assert.equal(n.chainlink,true);assert.equal(n.transactionsEnabled,true);assert.equal(resolveNurseryNetwork({...env,NEXT_PUBLIC_FUJI_EVO_ADDRESS:d.token}).configured,false);});
const {preserveMainnetProvenance:merge}=load('asset-provenance');
const canonical={chainId:'43114',address:d.nft,tokenId:'1',metadata:{type:'EVO',xp:0,createdAt:'fixture-now',hatchedAt:'fixture-now',totalBreeds:4,parent1Id:null,parent2Id:null}};
const indexed={...canonical,metadata:{...canonical.metadata,xp:987,createdAt:'2022-01-01',hatchedAt:'2022-01-02',totalBreeds:3,parent1Id:'10',parent2Id:'11'}};
test('mainnet imports preserve settled XP, dates and ancestry while chain counters prevail',()=>{const result=merge(canonical,indexed,true);assert.equal(result.metadata.xp,987);assert.equal(result.metadata.createdAt,'2022-01-01');assert.equal(result.metadata.parent1Id,'10');assert.equal(result.metadata.totalBreeds,4);});
test('unknown imported dates remain unknown instead of a synthetic current date',()=>{assert.equal(merge(canonical,{...indexed,metadata:{...indexed.metadata,createdAt:null}},true).metadata.createdAt,null);});
test('imported adults fail closed on missing or mismatched provenance',()=>{for(const value of [null,{...indexed,tokenId:'other'},{...indexed,chainId:'43113'},{...indexed,metadata:{type:'EGG'}},{...indexed,metadata:{...indexed.metadata,xp:-1}}])assert.throws(()=>merge(canonical,value,true));});
test('new confirmed chain-born adults can display before indexing without synthetic imported history',()=>{const result=merge(canonical,null,false);assert.equal(result.metadata.xp,0);assert.equal(result.metadata.createdAt,canonical.metadata.createdAt);});

test('legacy zero-sentinel dates and old ancestry field names retain their meaning',()=>{const result=merge(canonical,{...indexed,metadata:{...indexed.metadata,createdAt:'1970-01-01T00:00:00',hatchedAt:'1970-01-01T00:00:00',parent1Id:undefined,parent1TokenId:'123'}},true);assert.equal(result.metadata.createdAt,null);assert.equal(result.metadata.hatchedAt,null);assert.equal(result.metadata.parent1Id,'123');});

test('every legacy size percentage is preserved for imported adults and mismatches fail closed',()=>{
 for(let raw=0;raw<=20;raw++){
  const percentage=(raw-10)*10;
  const chain={...canonical,metadata:{...canonical.metadata,size:percentage}};
  const prior={...indexed,metadata:{...indexed.metadata,size:percentage}};
  assert.equal(merge(chain,prior,true).metadata.size,percentage);
  assert.throws(()=>merge(chain,{...prior,metadata:{...prior.metadata,size:percentage+10}},true));
 }
});
