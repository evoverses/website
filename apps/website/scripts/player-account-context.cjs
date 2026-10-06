"use strict";
// Trusted local configuration only. Never derive allowed clients/context from login input.
function websiteAccountContext(env, expected, reviewed, verified) {
 const fail=()=>{throw new Error('Local website account configuration is incomplete or mismatched');};
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const publicKeys=['audience','productId','sandboxId','deploymentId'];
 const reviewedKeys=[...publicKeys,'issuer','applicationId'];
 const bounded=v=>typeof v==='string'&&v.length>0&&v.length<=200;
 if(env.NODE_ENV==='production'||env.EVOVERSES_LOCAL_EPIC_ACCOUNT_LOGIN!=='1'||env.NEXT_PUBLIC_EVOVERSES_LOCAL_PLAYER_LOGIN!=='1')fail();
 if(!object(expected)||Object.keys(expected).length!==4||!publicKeys.every(k=>bounded(expected[k]))||
    !object(reviewed)||!object(verified)||Object.keys(reviewed).length!==6||Object.keys(verified).length!==6||
    !reviewedKeys.every(k=>bounded(reviewed[k])&&verified[k]===reviewed[k])||!publicKeys.every(k=>expected[k]===reviewed[k])||
    !['https://api.epicgames.dev/epic/oauth/v1','https://api.epicgames.dev/epic/oauth/v2'].includes(reviewed.issuer))fail();
 const clientId=env.AUTH_EPIC_ID,secret=env.AUTH_EPIC_SECRET;
 if(typeof clientId!=='string'||!/^[A-Za-z0-9]{16,128}$/.test(clientId)||clientId===expected.audience||
    typeof secret!=='string'||!secret||secret.trim()!==secret||secret.length>2048||secret==='REPLACE_ME')fail();
 const requiredClaims={appid:reviewed.applicationId,pfpid:expected.productId,pfsid:expected.sandboxId,pfdid:expected.deploymentId};
 return {websiteClientId:clientId,issuer:reviewed.issuer,scope:'evoverses-local-epic:'+expected.productId,
   clients:[expected.audience,clientId].map(audience=>({audience,requiredClaims:{...requiredClaims}}))};
}
module.exports={websiteAccountContext};
