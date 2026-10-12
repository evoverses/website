import { playerSessionCookie } from "@/lib/player/auth-core";
import { archiveSchema,adminRewardsSchema,personalRewardsSchema,rewardRequest,decisionSchema,preparedSchema } from "./rewards-core";
export type RewardsOperation="archive"|"mine"|"list"|"prepare"|"approve"|"withhold";
const allowedErrors=new Set(["INVALID_REQUEST","INVALID_SESSION","ACCOUNT_UNAVAILABLE","ADMIN_REQUIRED","RETRY_CONFLICT","PERIOD_DECIDED","STALE_ELIGIBILITY","PRODUCT_UNAVAILABLE","CAPACITY_EXCEEDED","RATE_LIMITED"]);
export async function rewardsHandler(request:Request,kind:"archive"|"mine"|"admin",dependencies:{origin:string;rpc:(operation:RewardsOperation,input:unknown,token?:string)=>Promise<{status:number;value:unknown}>}){
 const respond=(status:number,body:unknown)=>Response.json(body,{status,headers:{"Cache-Control":kind==="archive"&&status===200?"public, max-age=60":"no-store","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"}});
 const url=new URL(request.url);
 if(url.origin!==dependencies.origin||request.headers.get("host")!==new URL(dependencies.origin).host||(kind==="admin"&&request.headers.get("origin")!==dependencies.origin))return respond(403,{error:{code:"ORIGIN_NOT_ALLOWED"}});
 const expectedMethod=kind==="admin"?"POST":"GET";if(request.method!==expectedMethod)return respond(405,{error:{code:"INVALID_REQUEST"}});
 let operation:RewardsOperation=kind==="archive"?"archive":"mine",input:unknown={},token:string|undefined;
 if(kind!=="archive"){
  const values=(request.headers.get("cookie")??"").split(";").map(v=>v.trim()).filter(v=>v.startsWith(playerSessionCookie+"="));token=values.length===1?values[0]!.slice(playerSessionCookie.length+1):undefined;
  if(!token||!/^[a-f0-9]{64}$/.test(token))return respond(401,{error:{code:"INVALID_SESSION"}});
 }
 try{
  if(kind==="archive") {if([...url.searchParams.keys()].some(k=>k!=="page"&&k!=="period")||url.searchParams.getAll("page").length>1||url.searchParams.getAll("period").length>1)return respond(400,{error:{code:"INVALID_REQUEST"}});const page=url.searchParams.get("page")??"0";if(!/^(0|[1-9]\d{0,5})$/.test(page)||Number(page)>100000)return respond(400,{error:{code:"INVALID_REQUEST"}});const period=url.searchParams.get("period");if(period!==null&&!["day","week","month"].includes(period))return respond(400,{error:{code:"INVALID_REQUEST"}});input={page:Number(page),...(period===null?{}:{period})};}
  else if(url.search)return respond(400,{error:{code:"INVALID_REQUEST"}});
  if(kind==="admin"){
   if(!request.headers.get("content-type")?.startsWith("application/json"))return respond(415,{error:{code:"INVALID_REQUEST"}});
   const reader=request.body?.getReader();if(!reader)return respond(400,{error:{code:"INVALID_REQUEST"}});const chunks:Uint8Array[]=[];let size=0;
   try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>4096){await reader.cancel();return respond(413,{error:{code:"INVALID_REQUEST"}});}chunks.push(part.value);}}finally{reader.releaseLock();}
   let raw:unknown;try{raw=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(Buffer.concat(chunks)));}catch{return respond(400,{error:{code:"INVALID_REQUEST"}});}
   const parsed=rewardRequest.safeParse(raw);if(!parsed.success)return respond(400,{error:{code:"INVALID_REQUEST"}});operation=parsed.data.operation;input=parsed.data.input;
  }
  const result=await dependencies.rpc(operation,input,token);
  if(result.status!==200){const code=(result.value as {error?:{code?:string}})?.error?.code;return respond([400,401,403,409,429].includes(result.status)?result.status:503,{error:{code:code&&allowedErrors.has(code)?code:"REWARDS_UNAVAILABLE"}});}
  const schema=operation==="archive"?archiveSchema:operation==="mine"?personalRewardsSchema:operation==="list"?adminRewardsSchema:operation==="prepare"?preparedSchema:decisionSchema;
  const parsed=schema.safeParse(result.value);if(!parsed.success)return respond(503,{error:{code:"REWARDS_UNAVAILABLE"}});return respond(200,parsed.data);
 }catch{return respond(503,{error:{code:"REWARDS_UNAVAILABLE"}});}
}
