import { playerSessionCookie } from "@/lib/player/auth-core";
import { monthSchema,proRequest,proBoardSchema,proAdminSchema,proSavedSchema } from "./pro-core";
export async function proHandler(request:Request,dependencies:{origin:string;rpc:(operation:'read'|'list'|'change',input:unknown,token?:string)=>Promise<{status:number;value:unknown}>}){
 const publicRead=request.method==='GET';const respond=(status:number,value:unknown)=>Response.json(value,{status,headers:{'Cache-Control':publicRead&&status===200?'public, max-age=60':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
 const url=new URL(request.url),bad={error:{code:'INVALID_REQUEST'}};
 if(url.origin!==dependencies.origin||request.headers.get('host')!==new URL(dependencies.origin).host||(!publicRead&&request.headers.get('origin')!==dependencies.origin))return respond(403,{error:{code:'ORIGIN_NOT_ALLOWED'}});
 if(!['GET','POST'].includes(request.method))return respond(405,bad);
 let operation:'read'|'list'|'change'='read',input:unknown={},token:string|undefined;
 try{
 if(publicRead){if([...url.searchParams.keys()].some(k=>!['month','page'].includes(k))||['month','page'].some(k=>url.searchParams.getAll(k).length>1))return respond(400,bad);const month=url.searchParams.get('month'),page=url.searchParams.get('page')??'0';if((month!==null&&!monthSchema.safeParse(month).success)||! /^(0|[1-9]\d{0,5})$/.test(page)||Number(page)>100000)return respond(400,bad);input={...(month?{month}:{}),page:Number(page)};}
 else{
  if(url.search)return respond(400,bad);const values=(request.headers.get('cookie')??'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(playerSessionCookie+'='));token=values.length===1?values[0]!.slice(playerSessionCookie.length+1):undefined;if(!token||!/^[a-f0-9]{64}$/.test(token))return respond(401,{error:{code:'INVALID_SESSION'}});
  if(!request.headers.get('content-type')?.startsWith('application/json'))return respond(415,bad);
  const reader=request.body?.getReader();if(!reader)return respond(400,bad);const chunks:Uint8Array[]=[];let size=0;try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>4096){await reader.cancel();return respond(413,bad);}chunks.push(part.value);}}finally{reader.releaseLock();}
  const parsed=proRequest.safeParse(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks))));if(!parsed.success)return respond(400,bad);operation=parsed.data.operation;input=parsed.data.input;
 }
 const result=await dependencies.rpc(operation,input,token);if(result.status!==200){const code=(result.value as {error?:{code?:string}})?.error?.code;const allowed=['ADMIN_REQUIRED','INVALID_SESSION','ACCOUNT_UNAVAILABLE','INVALID_REQUEST','RETRY_CONFLICT','STALE_ELIGIBILITY','PERIOD_DECIDED','PERIOD_OPEN','PAYOUT_WALLET_REQUIRED','RATE_LIMITED','ENTRY_UNAVAILABLE','ENTRY_TERMS_LOCKED','NO_QUALIFYING_WINNERS','USE_BONUS_CONTROL','INSUFFICIENT_RESERVE'];return respond([400,401,403,409,429].includes(result.status)?result.status:503,{error:{code:code&&allowed.includes(code)?code:'PRO_LEADERBOARD_UNAVAILABLE'}});}
 const parsed=(operation==='read'?proBoardSchema:operation==='list'?proAdminSchema:proSavedSchema).safeParse(result.value);return parsed.success?respond(200,parsed.data):respond(503,{error:{code:'PRO_LEADERBOARD_UNAVAILABLE'}});
 }catch{return respond(503,{error:{code:'PRO_LEADERBOARD_UNAVAILABLE'}});}
}
