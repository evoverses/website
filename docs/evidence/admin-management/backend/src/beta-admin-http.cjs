"use strict";
const {readJson,InputError}=require('./auth-http.cjs');
function createBetaAdminRoutes({betaAdmin,headerValues,reply}){
 const routes=new Set(['/v1/beta/admin/list','/v1/beta/admin/action']),pending=new Set(),budget=[];let active=0;
 async function perform(request,response,route){let admitted=false;
  try{
   const auth=headerValues(request,'authorization'),match=auth.length===1&&/^Bearer ([A-Za-z0-9._~+/=-]{32,1024})$/i.exec(auth[0]);
   if(!match)throw new InputError(401,'INVALID_SESSION');if(headerValues(request,'cookie').length)throw new InputError(400,'INVALID_REQUEST');
   const now=performance.now();while(budget.length&&budget[0]<now-60000)budget.shift();if(active>=4||budget.length>=60)throw new InputError(429,'RATE_LIMITED');budget.push(now);active++;admitted=true;
   const input=await readJson(request,headerValues,{maxBodyBytes:4096,bodyTimeoutMs:2000},false);if(response.destroyed)return;
   reply(response,200,await betaAdmin[route.endsWith('/list')?'list':'perform'](match[1],input));
  }catch(error){const status=error instanceof InputError?error.status:({INVALID_REQUEST:400,INVALID_SESSION:401,ACCOUNT_UNAVAILABLE:403,ADMIN_REQUIRED:403,PLAYER_UNAVAILABLE:409,TESTER_NOT_APPROVED:409,ADMIN_ACCOUNT_PROTECTED:409,LAST_ADMINISTRATOR:409,MASTER_ADMINISTRATOR_PROTECTED:409,SELF_BAN_PROTECTED:409,SELF_DELETE_PROTECTED:409,ACCOUNT_IN_BATTLE:409,STALE_ACCESS:409,RETRY_CONFLICT:409,CAPACITY_EXCEEDED:409,PRODUCT_UNAVAILABLE:409,BALANCE_HISTORY_MISMATCH:409})[error.code]||503;response.once('finish',()=>request.destroy());reply(response,status,{error:{code:status===503?'SERVICE_UNAVAILABLE':error.code}},{Connection:'close'});}
  finally{if(admitted)active--;}
 }
 return {routes,handle:(...args)=>{const task=perform(...args);pending.add(task);task.then(()=>pending.delete(task),()=>pending.delete(task));return task;},waitForIdle:()=>Promise.allSettled([...pending])};
}
module.exports={createBetaAdminRoutes};
