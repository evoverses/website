const {test}=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm'), ts=require('typescript');
const result={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/marketplace/listing-safety.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:result,exports:result.exports});
const {assertNoDuplicateListing,checkListingDuplicates}=result.exports;
const target={tokenId:4503n,assetContract:'0xNFT',creator:'0xOWNER'};
const listing={listingId:3n,tokenId:4503n,assetContract:'0xnft',listingCreator:'0xowner',status:1,endTimestamp:200n,quantity:1n};
test('both duplicate records are named even before their sale window begins',()=>assert.throws(()=>assertNoDuplicateListing([listing,{...listing,listingId:4n}],target,100n),/listing #3, #4/));
test('expired, cancelled, sold, other NFTs and other sellers do not block',()=>{
 for(const change of [{endTimestamp:100n},{status:2},{status:3},{quantity:0n},{tokenId:5n},{assetContract:'0xother'},{listingCreator:'0xother'}]) assert.doesNotThrow(()=>assertNoDuplicateListing([{...listing,...change}],target,100n));
});
test('checks later pages with inclusive ranges',async()=>{
 const pages=[];await assert.rejects(()=>checkListingDuplicates(async()=>205n,async(a,b)=>{pages.push([a,b]);return a===200n?[listing]:[]},target,100n),/listing #3/);
 assert.deepEqual(pages,[[0n,99n],[100n,199n],[200n,204n]]);
});
test('failed or excessive reads block submission rather than pretending there is no listing',async()=>{
 await assert.rejects(()=>checkListingDuplicates(async()=>{throw Error('RPC unavailable')},async()=>[],target,100n),/RPC unavailable/);
 await assert.rejects(()=>checkListingDuplicates(async()=>1n,async()=>{throw Error('RPC unavailable')},target,100n),/RPC unavailable/);
 await assert.rejects(()=>checkListingDuplicates(async()=>1001n,async()=>[],target,100n),/safely check/);
 let reads=0;await checkListingDuplicates(async()=>0n,async()=>{reads++;return[]},target,100n);assert.equal(reads,0);
});
