import type { Chain } from "thirdweb";
import type { Account, Wallet } from "thirdweb/wallets";

type OwnerListingOptions<T extends { status: string }> = {
  wallet: Wallet | undefined;
  getSelectedWallet: () => Wallet | undefined;
  chain: Chain;
  readOwner: () => Promise<string>;
  checkExisting: (owner: string) => Promise<void>;
  needsApproval: (owner: string) => Promise<boolean>;
  approve: (account: Account) => Promise<{ status: string }>;
  list: (account: Account) => Promise<T>;
  onProgress: (progress: string) => void;
};

/** Pin both sends to the external owner, independently of Thirdweb's login account. */
export async function submitOwnerListing<T extends { status: string }>(options: OwnerListingOptions<T>): Promise<T> {
  const { wallet, chain, onProgress } = options;
  if (!wallet || wallet.id === "smart" || wallet.id === "inApp") {
    throw new Error("Connect the external wallet that owns this Evo.");
  }
  const account = wallet.getAccount();
  if (!account) throw new Error("Connect the external wallet that owns this Evo.");
  const address = account.address.toLowerCase();
  const assertWallet = (checkChain = true) => {
    if (options.getSelectedWallet() !== wallet || wallet.getAccount()?.address.toLowerCase() !== address) {
      throw new Error("Your wallet changed. Select the wallet that owns this Evo and try again.");
    }
    if (checkChain && wallet.getChain()?.id !== chain.id) {
      throw new Error("Your wallet network changed. Switch back to Avalanche and try again.");
    }
  };
  const checkOwner = async () => {
    assertWallet();
    onProgress("Checking Evo ownership");
    const owner = await options.readOwner();
    assertWallet();
    if (owner.toLowerCase() !== address) {
      throw new Error("The connected wallet does not own this Evo. Connect its owner wallet and try again.");
    }
  };

  assertWallet(false);
  onProgress("Checking wallet network");
  if (wallet.getChain()?.id !== chain.id) await wallet.switchChain(chain);
  await checkOwner();
  await options.checkExisting(account.address);
  onProgress("Checking approval");
  const approvalRequired = await options.needsApproval(account.address);
  await checkOwner();
  if (approvalRequired) {
    onProgress("Requesting approval in wallet");
    const receipt = await options.approve(account);
    if (receipt.status !== "success") {
      throw new Error("The Evo approval transaction failed. No listing was submitted.");
    }
  }
  await options.checkExisting(account.address);
  await checkOwner();
  onProgress("Creating listing");
  const receipt = await options.list(account);
  if (receipt.status !== "success") throw new Error("The listing transaction failed on Avalanche.");
  return receipt;
}
