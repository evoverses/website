import { createEvoQuoteWorker } from '../../../src/lib/store/evo-quote-worker.ts';
export default createEvoQuoteWorker({fetch:async()=>new Response('delegated',{status:418})},async(url,init)=>{
 // A real Workers Request catches unsupported redirect modes before any network I/O.
 const request=new Request(url,init);
 if(request.redirect!=='manual'||request.headers.has('cookie')||request.headers.has('origin'))throw Error('Unsafe quote request.');
 return Response.json({value:{priceUsd:'0.0001',fetchedAt:new Date().toISOString(),source:'Avalanche',chainId:43114,blockNumber:'97697155',poolAddress:'0xb99a92b6d5a7ca3a2215a63d43d5e8ad43abc4e9',oracleAddress:'0x0a77230d17318075983913bc2145db16c7366156',oracleUpdatedAt:new Date().toISOString()}});
});
