"use strict";
const {test}=require("node:test"), assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript");
const sourceRoot=path.resolve(__dirname,"../../src");
function load(file, imports={},env={}) {
  const compiled=ts.transpileModule(fs.readFileSync(path.join(sourceRoot,file),"utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
  }).outputText;
  const module={exports:{}};
  vm.runInNewContext(compiled,{module,exports:module.exports,process:{env},require:name=>{
    if(!(name in imports))throw new Error("Unexpected import: "+name);
    return imports[name];
  }});
  return module.exports;
}
const preview=env=>load("lib/thirdweb/preview.ts",{},env).localWalletPreview;
test("UI preview requires explicit opt-in AND development mode",()=>{
  assert.equal(preview({NODE_ENV:"development",NEXT_PUBLIC_EVOVERSES_LOCAL_WALLET_PREVIEW:"1"}),true);
  for(const NODE_ENV of ["production","test",undefined])
    assert.equal(preview({NODE_ENV,NEXT_PUBLIC_EVOVERSES_LOCAL_WALLET_PREVIEW:"1"}),false);
  for(const flag of [undefined,"0","true"])
    assert.equal(preview({NODE_ENV:"development",NEXT_PUBLIC_EVOVERSES_LOCAL_WALLET_PREVIEW:flag}),false);
});
test("SDK UI placeholder is confined to explicit preview; genuine config is preserved",()=>{
  const imports={"@/utils/node":{assertEnvNotNull:(v,key)=>{if(v==null)throw Error(key);return v;}},"./preview":{localWalletPreview:true}};
  const config=load("lib/thirdweb/env.client.ts",imports,{NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN:"localhost:3100"});
  assert.equal(config.authDomain,"localhost:3100");assert.equal(config.clientId,"0123456789abcdef0123456789abcdef");
  const real=load("lib/thirdweb/env.client.ts",imports,{NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN:"localhost:3100",NEXT_PUBLIC_THIRDWEB_CLIENT_ID:"configured-public-client"});
  assert.equal(real.clientId,"configured-public-client");
  assert.throws(()=>load("lib/thirdweb/env.client.ts",{...imports,"./preview":{localWalletPreview:false}},{NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN:"localhost:3100"}),/NEXT_PUBLIC_THIRDWEB_CLIENT_ID/);
});
test("preview rejects wallet cookies without creating an auth client or reading keys",async()=>{
  const never=()=>{throw Error("Preview must not invoke credentials or auth");};
  const auth=load("lib/thirdweb/auth.edge.ts",{
    "./preview":{localWalletPreview:true},"./env.client":{clientId:"preview"},
    "@/lib/thirdweb/env":{},"@/lib/thirdweb/env.client":{authDomain:"localhost:3100"},
    "@/utils/node":{assertEnvNotNull:never},"thirdweb":{createThirdwebClient:never},
    "thirdweb/auth":{createAuth:never},"viem/accounts":{privateKeyToAddress:never}
  });
  for(const cookie of [undefined,"claimed-wallet-jwt",{value:"claimed-wallet-jwt"}])
    assert.equal((await auth.verifyAuthCookie(cookie)).valid,false);
});
test("preview reports signed out and refuses both wallet login actions before credential use",async()=>{
  const never=()=>{throw Error("Preview must not invoke credentials or auth");};
  const auth=load("lib/thirdweb/auth.ts",{
    "./preview":{localWalletPreview:true},"@/data/constants":{DeadBeef:"guest-address"},
    "@/lib/thirdweb/config":{client:{}},"@/lib/thirdweb/env":{},
    "@/lib/thirdweb/env.client":{authDomain:"localhost:3100"},"@/utils/node":{assertEnvNotNull:never},
    "next/headers":{cookies:never},"thirdweb/auth":{createAuth:never},
    "thirdweb/wallets":{privateKeyToAccount:never},"./auth.edge":{verifyAuthCookie:never}
  });
  assert.equal(await auth.isLoggedIn(),false);assert.equal(await auth.getAuthCookie(),false);
  assert.equal(await auth.getAuthCookieAddress(),"guest-address");
  await assert.rejects(auth.generatePayload({address:"untrusted"}),/unavailable in the local UI preview/);
  await assert.rejects(auth.login({payload:"untrusted"}),/unavailable in the local UI preview/);
});
test("configured normal wallet JWT verification still uses the actual verifier",async()=>{
  let called=0;
  const auth=load("lib/thirdweb/auth.edge.ts",{
    "./preview":{localWalletPreview:false},"./env.client":{clientId:"configured-public-client"},
    "@/lib/thirdweb/env":{adminPrivateKey:"test-key-not-a-real-secret"},
    "@/lib/thirdweb/env.client":{authDomain:"configured-domain"},
    "@/utils/node":{assertEnvNotNull:v=>v},"thirdweb":{createThirdwebClient:input=>{assert.equal(input.clientId,"configured-public-client");return {};}},
    "thirdweb/auth":{createAuth:()=>({verifyJWT:({jwt})=>{called++;assert.equal(jwt,"test-wallet-cookie");return {valid:false};}})},
    "viem/accounts":{privateKeyToAddress:()=>"test-address"}
  });
  assert.equal((await auth.verifyAuthCookie(undefined)).valid,false);assert.equal(called,0);
  assert.equal((await auth.verifyAuthCookie("test-wallet-cookie")).valid,false);assert.equal(called,1);
});
