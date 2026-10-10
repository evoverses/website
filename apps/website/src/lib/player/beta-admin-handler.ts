import { playerSessionCookie } from "./auth-core";
import { z } from "zod";
const uuid = z.string().uuid();
const reason = z.string().trim().min(1).max(200);
const common = {requestId:uuid,playerId:uuid,reason};
const action = z.discriminatedUnion("action",[
 z.object({...common,action:z.literal("approve"),expectedVersion:z.number().int().min(0).max(2147483647)}).strict(),
 z.object({...common,action:z.literal("revoke"),expectedVersion:z.number().int().min(0).max(2147483647)}).strict(),
 z.object({...common,action:z.literal("ban"),expectedAccountStatus:z.enum(["active","suspended"])}).strict(),
 z.object({...common,action:z.literal("unban"),expectedAccountStatus:z.enum(["active","suspended"])}).strict(),
 z.object({...common,action:z.literal("delete"),expectedAccountStatus:z.enum(["active","suspended"])}).strict(),
 z.object({...common,action:z.literal("promote_admin")}).strict(),
 z.object({...common,action:z.literal("revoke_admin")}).strict(),
 z.object({...common,action:z.literal("grant_evoros"),amount:z.number().int().positive().max(2147483647)}).strict(),
 z.object({...common,action:z.literal("grant_item"),productId:z.string().regex(/^[a-z][a-z0-9_]{0,79}$/),revision:z.number().int().positive(),quantity:z.number().int().min(1).max(1000)}).strict(),
]);
const inputSchema=z.discriminatedUnion("operation",[
 z.object({operation:z.literal("list"),input:z.object({search:z.string().max(80).optional(),sort:z.enum(["name","experience","access","administrator","evoros"]).optional(),direction:z.enum(["asc","desc"]).optional(),page:z.number().int().min(1).max(100000).optional()}).strict()}).strict(),
 z.object({operation:z.literal("action"),input:action}).strict(),
]);
const player=z.object({id:uuid,displayName:z.string().max(80),experience:z.number().int().nonnegative(),accountStatus:z.enum(["active","suspended","closed"]),evoros:z.number().int().nonnegative(),access:z.enum(["pending","approved","revoked"]),version:z.number().int().nonnegative(),administrator:z.boolean(),masterAdministrator:z.boolean(),initialGrant:z.boolean()});
const result=z.object({operationId:uuid,playerId:uuid,action:z.enum(["approve","revoke","grant_evoros","grant_item","promote_admin","revoke_admin","ban","unban","delete"]),access:z.enum(["pending","approved","revoked"]),version:z.number().int().nonnegative(),evoros:z.number().int().nonnegative(),evorosGranted:z.number().int().nonnegative(),sessionsRevoked:z.number().int().nonnegative(),accountStatus:z.enum(["active","suspended","closed"]).optional(),administrator:z.boolean().optional(),productId:z.string().optional(),revision:z.number().int().positive().optional(),quantityGranted:z.number().int().positive().optional(),remainingQuantity:z.number().int().nonnegative().optional()});
export const betaAdminSnapshotSchema=z.object({administratorId:uuid,players:z.array(player).max(100),more:z.boolean(),total:z.number().int().nonnegative(),page:z.number().int().positive(),products:z.array(z.object({productId:z.string(),revision:z.number().int().positive(),name:z.string(),category:z.string(),packSize:z.union([z.literal(2),z.literal(4),z.literal(6),z.null()])})).max(100),history:z.array(z.object({id:uuid,administratorId:uuid.nullable(),ruleId:z.string().nullable(),eventKey:z.string().nullable(),playerId:uuid,displayName:z.string(),action:z.enum(["bootstrap","approve","revoke","grant_evoros","grant_item","promote_admin","revoke_admin","ban","unban","delete"]),reason:z.string().max(200),createdAt:z.string().datetime(),result:z.record(z.unknown()).transform(value=>{const parsed=result.safeParse(value);return parsed.success?parsed.data:{};})})).max(50)});
export type BetaAdminSnapshot=z.infer<typeof betaAdminSnapshotSchema>;
const allowedErrors=new Set(["INVALID_SESSION","ACCOUNT_UNAVAILABLE","ADMIN_REQUIRED","PLAYER_UNAVAILABLE","TESTER_NOT_APPROVED","ADMIN_ACCOUNT_PROTECTED","SELF_BAN_PROTECTED","SELF_DELETE_PROTECTED","ACCOUNT_IN_BATTLE","STALE_ACCESS","RETRY_CONFLICT","CAPACITY_EXCEEDED","PRODUCT_UNAVAILABLE","BALANCE_HISTORY_MISMATCH","RATE_LIMITED","LAST_ADMINISTRATOR","MASTER_ADMINISTRATOR_PROTECTED"]);
const reply=(status:number,body:object)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
export async function betaAdminHandler(request:Request,dependencies:{enabled:boolean; webOrigin?:"http://localhost:3100"|"https://beta.evoverses.com"; rpc:(operation:"list"|"action",token:string,input:unknown)=>Promise<{status:number;value:unknown}>}){
 if(!dependencies.enabled)return reply(503,{error:{code:"BETA_ADMIN_UNAVAILABLE"}});
 const url=new URL(request.url);
 const origin=dependencies.webOrigin??"http://localhost:3100";
 const matchingUrl=origin==="http://localhost:3100"?url.protocol==="http:"&&url.port==="3100":url.origin===origin;
 if(request.method!=="POST"||!matchingUrl||request.headers.get("host")!==new URL(origin).host||request.headers.get("origin")!==origin||url.search)return reply(403,{error:{code:"ORIGIN_NOT_ALLOWED"}});
 const cookies=(request.headers.get("cookie")||"").split(";").map(v=>v.trim()).filter(v=>v.startsWith(playerSessionCookie+"="));
 const token=cookies.length===1?cookies[0]!.slice(playerSessionCookie.length+1):"";
 if(!/^[a-f0-9]{64}$/.test(token))return reply(401,{error:{code:"INVALID_SESSION"}});
 if(!request.headers.get("content-type")?.startsWith("application/json"))return reply(415,{error:{code:"INVALID_REQUEST"}});
 try{
  if(Number(request.headers.get("content-length")||0)>4096)return reply(413,{error:{code:"INVALID_REQUEST"}});
  const reader=request.body?.getReader();if(!reader)return reply(400,{error:{code:"INVALID_REQUEST"}});
  const chunks:Uint8Array[]=[];let length=0;
  try{while(true){const chunk=await reader.read();if(chunk.done)break;length+=chunk.value.byteLength;if(length>4096){await reader.cancel();return reply(413,{error:{code:"INVALID_REQUEST"}});}chunks.push(chunk.value);}}finally{reader.releaseLock();}
  let raw:unknown;try{raw=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(Buffer.concat(chunks)));}catch{return reply(400,{error:{code:"INVALID_REQUEST"}});}
  const parsed=inputSchema.safeParse(raw);if(!parsed.success)return reply(400,{error:{code:"INVALID_REQUEST"}});
  const response=await dependencies.rpc(parsed.data.operation,token,parsed.data.input);
  if(response.status!==200){const code=(response.value as {error?:{code?:unknown}})?.error?.code;return reply([401,403,409,429].includes(response.status)?response.status:503,{error:{code:typeof code==="string"&&allowedErrors.has(code)?code:"BETA_ADMIN_UNAVAILABLE"}});}
  const value=(parsed.data.operation==="list"?betaAdminSnapshotSchema:result).safeParse(response.value);
  if(!value.success)return reply(503,{error:{code:"BETA_ADMIN_UNAVAILABLE"}});
  return reply(200,value.data);
 }catch{return reply(503,{error:{code:"BETA_ADMIN_UNAVAILABLE"}});}
}
