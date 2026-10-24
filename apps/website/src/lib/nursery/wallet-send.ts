import type { Account } from "thirdweb/wallets";
import type { Address, Hex } from "viem";

type NurseryWalletTransaction = {
  chainId: number;
  to: Address;
  data: Hex;
  value: bigint;
  gas: bigint;
  gasPrice?: bigint;
};

/** Let the connected wallet allocate its pending nonce; a second RPC must not force one. */
export function sendNurseryWalletTransaction(account: Account, transaction: NurseryWalletTransaction) {
  return account.sendTransaction({
    chainId: transaction.chainId,
    to: transaction.to,
    data: transaction.data,
    value: transaction.value,
    gas: transaction.gas,
    gasPrice: transaction.gasPrice,
  });
}
