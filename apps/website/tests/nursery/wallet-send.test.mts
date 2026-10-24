import {it} from "node:test";
import assert from "node:assert/strict";
import type {Account} from "thirdweb/wallets";
import {sendNurseryWalletTransaction} from "../../src/lib/nursery/wallet-send.ts";
import {acquireNurseryWallet,nurseryWalletBusy,subscribeNurseryWallet} from "../../src/lib/nursery/wallet-actions.ts";

it("wallet signing preserves the checked transaction and never forces an SDK nonce",async()=>{
  const signed:object[]=[];
  const account={sendTransaction:async(transaction:object)=>{signed.push(transaction);return {transactionHash:"0xhash"};}} as unknown as Account;
  const tx={chainId:43113,to:"0x0000000000000000000000000000000000000001" as const,data:"0x1234" as const,value:0n,gas:75000n,gasPrice:160n,nonce:107};
  await sendNurseryWalletTransaction(account,tx);
  await sendNurseryWalletTransaction(account,tx);
  for(const transaction of signed){assert.equal(Object.hasOwn(transaction,"nonce"),false);assert.deepEqual(transaction,{chainId:43113,to:tx.to,data:tx.data,value:0n,gas:75000n,gasPrice:160n});}
});
it("wallet rejection is returned once without automatic resubmission",async()=>{
  let attempts=0;const account={sendTransaction:async()=>{attempts++;throw Error("nonce too low");}} as unknown as Account;
  await assert.rejects(sendNurseryWalletTransaction(account,{chainId:43113,to:"0x0000000000000000000000000000000000000001",data:"0x",value:0n,gas:75000n}),/nonce too low/);
  assert.equal(attempts,1);
});
it("shared locks notify all cards, reject competing starts and release idempotently",()=>{
  let notifications=0;const unsubscribe=subscribeNurseryWallet(()=>{notifications++;});
  const release=acquireNurseryWallet("43113:wallet-a")!;
  assert.equal(nurseryWalletBusy("43113:wallet-a"),true);
  assert.equal(acquireNurseryWallet("43113:wallet-a"),undefined);
  const other=acquireNurseryWallet("43113:wallet-b")!;assert.equal(nurseryWalletBusy("43113:wallet-b"),true);
  other();release();const before=notifications;release();assert.equal(notifications,before);
  assert.equal(nurseryWalletBusy("43113:wallet-a"),false);unsubscribe();
});
