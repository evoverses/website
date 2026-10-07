"use strict";
// Optional Store on the already owned loopback account service. Disabled by default.
const fs=require('node:fs'),path=require('node:path');
async function prepareWebsiteGameStore({enabled=false,accountRepo,runRoot,db,economy}){
 if(!enabled)return null;
 if(enabled!==true||!path.isAbsolute(accountRepo||'')||!path.isAbsolute(runRoot||'')||
   path.dirname(path.resolve(runRoot))!==path.join(path.resolve(accountRepo),'Saved')||
   !/^EpicAccountLocal-[a-f0-9]{32}$/.test(path.basename(runRoot)))throw Error('Explicit owned local account run required');
 const {prepareLocalGameStore}=require(path.join(accountRepo,'Prototypes/player_economy/src/local-game-store.cjs'));
 return prepareLocalGameStore({enabled:true,db,economy,beforeFirstMigration:async()=>{
   const backup=await db.dumpDataDir('gzip');
   const file=path.join(runRoot,'GameStoreBeforeSchema004-'+Date.now()+'.tar.gz');
   const bytes=Buffer.from(await backup.arrayBuffer());if(!bytes.length)throw Error('Empty local backup');
   fs.writeFileSync(file,bytes,{flag:'wx'});if(fs.statSync(file).size!==bytes.length)throw Error('Incomplete local backup');
 }});
}
module.exports={prepareWebsiteGameStore};
