export const periods = ["day", "week", "month", "all"] as const;
export type Period = typeof periods[number];
export type TrainerEntry = {rank:number;name:string;level:number;periodXp:number;lifetimeXp:number;battles:number;wins:number;losses:number;winRate:number|null};
export type Leaderboard = {period:Period;page:number;pageSize:50;total:number;periodStart:string|null;calculatedAt:string;entries:TrainerEntry[];own?:TrainerEntry|null;ownRow?:number|null};
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const natural=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
export function selection(url:URL):{period:Period;page:number}{
 if([...url.searchParams.keys()].some(k=>!["period","page"].includes(k))||url.searchParams.getAll("period").length>1||url.searchParams.getAll("page").length>1)throw Error("Invalid selection");
 const period=url.searchParams.get("period")??"day",raw=url.searchParams.get("page")??"0";
 if(!periods.includes(period as Period)||!/^\d{1,6}$/.test(raw)||Number(raw)>100000)throw Error("Invalid selection");
 return {period:period as Period,page:Number(raw)};
}
function entry(v:unknown):TrainerEntry{
 if(!record(v)||Object.keys(v).sort().join(',')!=="battles,level,lifetimeXp,losses,name,periodXp,rank,winRate,wins"||typeof v.name!=="string"||!v.name.length||v.name.length>80||
 ![v.rank,v.level,v.periodXp,v.lifetimeXp,v.battles,v.wins,v.losses].every(natural)||Number(v.rank)<1||Number(v.level)<1||Number(v.level)>100||Number(v.wins)+Number(v.losses)>Number(v.battles)||Number(v.lifetimeXp)<Number(v.periodXp)||
 !(v.winRate===null||(typeof v.winRate==="number"&&Number.isFinite(v.winRate)&&v.winRate>=0&&v.winRate<=100)))throw Error("Invalid leaderboard entry");
 return v as TrainerEntry;
}
export function parseLeaderboard(v:unknown,expected:{period:Period;page:number},privateRead=false):Leaderboard{
 if(!record(v)||Object.keys(v).some(k=>!["period","page","pageSize","total","periodStart","calculatedAt","entries",...(privateRead?["own","ownRow"]:[])].includes(k))||v.period!==expected.period||v.page!==expected.page||v.pageSize!==50||!natural(v.total)||!Array.isArray(v.entries)||v.entries.length>50||
 typeof v.calculatedAt!=="string"||!/^\d{4}-\d\d-\d\dT.*Z$/.test(v.calculatedAt)||!Number.isFinite(Date.parse(v.calculatedAt))||
 !(v.periodStart===null||(typeof v.periodStart==="string"&&Number.isFinite(Date.parse(v.periodStart))&&v.periodStart.endsWith("Z")))||(expected.period==="all")!==(v.periodStart===null)||
 (privateRead&&(!Object.hasOwn(v,"own")||!(v.own===null?v.ownRow===null:natural(v.ownRow)&&v.ownRow>0))))throw Error("Invalid leaderboard response");
 return {period:expected.period,page:expected.page,pageSize:50,total:v.total,periodStart:v.periodStart as string|null,calculatedAt:v.calculatedAt,
 entries:v.entries.map(entry),...(privateRead?{own:v.own===null?null:entry(v.own),ownRow:v.ownRow as number|null}:{})};
}
export async function leaderboardRpc({connection,selection:input,token,fetchImpl=fetch}:{connection:{apiUrl:string;serviceToken:string};selection:{period:Period;page:number};token?:string;fetchImpl?:typeof fetch}):Promise<Leaderboard>{
 const url=new URL(connection.apiUrl);
 if(url.protocol!=="https:"||url.origin!==connection.apiUrl||url.username||url.password||url.port||!url.hostname.endsWith(".evoverses.com")||!/^[a-f0-9]{64}$/.test(connection.serviceToken)|| (token!==undefined&&!/^[a-f0-9]{64}$/.test(token)))throw Error("Leaderboard unavailable");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
 try{
 const response=await fetchImpl(url.origin+"/internal/leaderboard"+(token?"/me":""),{method:"POST",headers:{"Content-Type":"application/json","X-EvoVerses-Service":connection.serviceToken,...(token?{Authorization:"Bearer "+token}:{})},body:JSON.stringify(input),cache:"no-store",redirect:"manual",credentials:"omit",signal:controller.signal});
 if(response.status!==200)throw Object.assign(Error("Leaderboard unavailable"),{status:[401,403].includes(response.status)?response.status:503});
 if(!response.headers.get("content-type")?.startsWith("application/json")||!response.body)throw Error("Invalid response");
 const reader=response.body.getReader(),parts:Uint8Array[]=[];let size=0;
 try{while(true){const part=await reader.read();if(controller.signal.aborted)throw Error("Timeout");if(part.done)break;size+=part.value.length;if(size>65536)throw Error("Response too large");parts.push(part.value);}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 return parseLeaderboard(JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(Buffer.concat(parts))),input,!!token);
 }finally{clearTimeout(timer);controller.abort();}
}
