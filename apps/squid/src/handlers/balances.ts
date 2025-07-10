import { events as erc1155Events } from "../abi/erc1155";
import { events as erc721Events } from "../abi/erc721";
import { Contract, ContractType, NFT, NFTWalletBalance, Wallet } from "../model";
import type { TransferEventData } from "../types/nft";
import type { Log } from "../types/processor";
import { range, toDate } from "../utils";
import type { Context } from "../model/context";

export const getOrCreateNftWalletBalance = (ctx: Context, nft: NFT, wallet: Wallet) => {
  const id = ctx.entities.toId(wallet.address, nft.contract.address, nft.tokenId);
  let balance = ctx.entities.get(NFTWalletBalance, id, false);
  if (!balance) {
    balance = new NFTWalletBalance({ id, nft, wallet, balance: 0n });
    ctx.entities.add(balance);
  }
  return balance;
};

export const parseNftTransferEvent = (
  ctx: Context,
  log: Log,
): TransferEventData[] => {
  const contract = log.address;
  try {
    switch (log.topics[0]) {
      case erc721Events.Transfer.topic: {
        if (log.topics.length === 4) {
          const { from, to, tokenId } = erc721Events.Transfer.decode(log);
          if (from === to) {
            break;
          }
          ctx.entities.defer(Wallet, from, to);
          ctx.entities.defer(Contract, log.address);
          ctx.entities.defer(NFT, `${log.address}-${tokenId}`);
          return [ {
            from,
            to,
            fromTokenId: tokenId,
            toTokenId: tokenId,
            contract,
            type: ContractType.ERC721,
            timestamp: toDate(log.block.timestamp),
          } ];
        } else if (log.topics.length === 3) {
          ctx.log.trace("Skipping 3 Topic ERC20 Transfer Event");
          break;
        } else {
          ctx.log.warn(`ERC721 Transfer Event has invalid topic length`);
          break;
        }
      }
      case erc721Events.ConsecutiveTransfer.topic: {
        const { from, to, fromTokenId, toTokenId } = erc721Events.ConsecutiveTransfer.decode(log);
        if (from === to) {
          break;
        }
        ctx.entities.defer(Wallet, from, to);
        ctx.entities.defer(Contract, log.address);
        ctx.entities.defer(
          NFT,
          ...range(Number(fromTokenId), Number(toTokenId)).map(tokenId => `${log.address}-${tokenId}`),
        );
        return [ {
          from,
          to,
          fromTokenId,
          toTokenId,
          contract,
          type: ContractType.ERC721,
          timestamp: toDate(log.block.timestamp),
        } ];
      }
      case erc1155Events.TransferSingle.topic: {
        const { from, to, id, value } = erc1155Events.TransferSingle.decode(log);
        if (from === to) {
          break;
        }
        ctx.entities.defer(Wallet, from, to);
        ctx.entities.defer(Contract, log.address);
        ctx.entities.defer(NFT, `${log.address}-${id}`);
        return [ {
          from,
          to,
          fromTokenId: id,
          toTokenId: id,
          contract,
          type: ContractType.ERC1155,
          value,
          timestamp: toDate(log.block.timestamp),
        } ];
      }
      case erc1155Events.TransferBatch.topic: {
        const { from, to, ids, values } = erc1155Events.TransferBatch.decode(log);
        if (from === to) {
          break;
        }
        ctx.entities.defer(Wallet, from, to);
        ctx.entities.defer(Contract, log.address);
        ctx.entities.defer(NFT, ...ids.map(tokenId => `${log.address}-${tokenId}`));
        return ids.map((id, i) => (
          {
            from,
            to,
            fromTokenId: id,
            toTokenId: id,
            contract,
            type: ContractType.ERC1155,
            value: values[i]!,
            timestamp: toDate(log.block.timestamp),
          }
        ));
      }
      default: {
        ctx.log.warn(`Transfer Event has invalid topic`);
      }
    }
  } catch (e) {
    ctx.log.warn(`Error parsing Transfer Event: ${e}`);
  }

  return [];
};
