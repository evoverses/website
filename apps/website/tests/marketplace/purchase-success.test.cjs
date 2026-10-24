const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm'), ts=require('typescript');
for(const needsApproval of [false,true]) test(`confirmed purchase links with approval ${needsApproval}`,async()=>{
 let hash; const approvals=[];
 const jsx=(type,props)=>({type,props:props||{}});
 const mocks={
 'react':{Fragment:'Fragment',useState:()=>[hash,v=>hash=v],useCallback:f=>f},
 'react/jsx-runtime':{jsx,jsxs:jsx},
 '@/hooks/use-chain':{useChain:()=>({switchChainIfNeeded:async()=>{}})},
 '@/hooks/use-token-price':{useEvoPrice:()=>1},
 '@/data/contracts':{evoContract:{},marketplaceContract:{address:'0xmarket'}},
 '@/lib/evo/utils':{toAssetFullName:()=> 'Evo'}, '@/utils/strings':{shortenAddress:()=> 'wallet'},
 '@/utils/url':{toBlockExplorerTxUrl:h=>h?`https://snowscan.xyz/tx/${h}`:'#'},
 'thirdweb/react':{TransactionButton:'TransactionButton',useActiveAccount:()=>({address:'0xbuyer'}),useSendAndConfirmTransaction:()=>({data:needsApproval?{transactionHash:'0xapproval'}:undefined,mutateAsync:async tx=>{approvals.push(tx);return {transactionHash:'0xapproval'};}})},
 'thirdweb/extensions/erc20':{allowance:async()=>needsApproval?0n:10n,approve:tx=>tx},
 'thirdweb/extensions/marketplace':{buyFromListing:tx=>tx},'viem':{formatEther:()=> '1'}
 };
 const result={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/drawers/buy-now-drawer.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:result,exports:result.exports,require:id=>mocks[id]||new Proxy({},{get:(_,k)=>String(k)}),setTimeout});
 const render=()=>result.exports.BuyNowDrawer({asset:{chainId:43114,listings:[{id:'1',pricePerToken:'10'}]},children:'Buy'});
 const nodes=t=>!t||typeof t!=='object'?[]:[t,...[t.props?.children].flat(Infinity).flatMap(nodes)];
 const button=nodes(render()).find(n=>n.type==='TransactionButton');
 assert.equal((await button.props.transaction()).recipient,'0xbuyer');
 assert.equal(approvals.length,needsApproval?1:0);
 assert.equal(nodes(render()).filter(n=>n.type==='a').length,0);
 button.props.onTransactionConfirmed({transactionHash:'0xpurchase'});
 const links=nodes(render()).filter(n=>n.type==='a');
 assert.equal(links[0].props.href,'https://snowscan.xyz/tx/0xpurchase');
 assert.equal(links[0].props.target,'_blank');
 assert.equal(links[0].props.rel,'noopener noreferrer');
 assert.equal(links[1].props.href,'/profile');
 assert.equal(links[1].props.target,undefined);
});
