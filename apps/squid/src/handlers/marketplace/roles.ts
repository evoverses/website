import { events as marketplaceEvents } from "../../abi/marketplaceV3";
import {
  Contract,
  ContractType,
  Marketplace,
  MarketplaceAdmin,
  MarketplaceAsset,
  MarketplaceLister,
  Wallet,
} from "../../model";
import type { Log } from "../../types/processor";
import type { Context } from "../../utils/context";
import { getOrCreateContract } from "../core/contracts";
import { parseLogGenerics } from "../shared";
import { getOrCreateWallet } from "../wallets";
import { getOrCreateMarketplace } from "./marketplaces";
import { MarketplaceRole, type RoleGrantedEventData, type RoleRevokedEventData } from "./types";

export const parseRoleEvents = (ctx: Context, logs: Log[]) => {
  const roleGrantedEvents: RoleGrantedEventData[] = [];
  const roleRevokedEvents: RoleRevokedEventData[] = [];
  for (let log of logs) {
    switch (log.topics[0]) {
      case marketplaceEvents.RoleGranted.topic: {
        roleGrantedEvents.push(parseRoleGrantedOrRevokedEvent(ctx, log));
        break;
      }
      case marketplaceEvents.RoleRevoked.topic: {
        roleRevokedEvents.push(parseRoleGrantedOrRevokedEvent(ctx, log, true));
      }
    }
  }
  return { roleGrantedEvents, roleRevokedEvents };
};

export const loadRoleEntities = (ctx: Context) => ctx.entities.loadMany(
  Marketplace,
  Contract,
  Wallet,
  MarketplaceAdmin,
  MarketplaceLister,
  MarketplaceAsset,
);

export const processRoleEvents = (ctx: Context, events: ReturnType<typeof parseRoleEvents>) => {
  processRoleGrantedOrRevokedEvents(ctx, events);
};

const parseRoleGrantedOrRevokedEvent = (ctx: Context, log: Log, revoked?: boolean): RoleGrantedEventData => {
  const {
    role: rawRole,
    account: rawAccount,
    // sender
  } = marketplaceEvents[revoked ? "RoleRevoked" : "RoleGranted"].decode(log);
  const marketplace = log.address.toLowerCase();
  const account = rawAccount.toLowerCase();
  const role = rawRole.toLowerCase() as MarketplaceRole;
  ctx.entities.defer(Marketplace, marketplace);
  ctx.entities.defer(Contract, marketplace);
  switch (role) {
    case MarketplaceRole.DEFAULT_ADMIN_ROLE: {
      ctx.entities.defer(Wallet, account);
      ctx.entities.defer(MarketplaceAdmin, ctx.entities.toId(marketplace, account));
      break;
    }
    case MarketplaceRole.ASSET_ROLE: {
      ctx.entities.defer(Contract, account);
      ctx.entities.defer(MarketplaceAsset, ctx.entities.toId(marketplace, account));
      break;
    }
    case MarketplaceRole.LISTER_ROLE: {
      ctx.entities.defer(Wallet, account);
      ctx.entities.defer(MarketplaceLister, ctx.entities.toId(marketplace, account));
      break;
    }
  }
  return {
    role,
    account: account.toLowerCase(),
    ...parseLogGenerics(log),
  };
};

const processRoleGrantedOrRevokedEvents = (ctx: Context, events: ReturnType<typeof parseRoleEvents>) => {
  const { roleGrantedEvents, roleRevokedEvents } = events;
  for (let event of roleGrantedEvents) {
    const id = ctx.entities.toId(event.contract, event.account);
    const marketplace = getOrCreateMarketplace(ctx, getOrCreateContract(ctx, event.contract, ContractType.MARKETPLACE));
    switch (event.role) {
      case MarketplaceRole.DEFAULT_ADMIN_ROLE: {
        const role = ctx.entities.get(MarketplaceAdmin, id, false);
        if (!role) {
          ctx.entities.add(new MarketplaceAdmin({
            id,
            marketplace,
            admin: getOrCreateWallet(ctx, event.account),
          }));
        } else {
          role.admin = getOrCreateWallet(ctx, event.account);
          role.marketplace = marketplace;
          ctx.entities.add(role);
        }
        break;
      }
      case MarketplaceRole.ASSET_ROLE: {
        const role = ctx.entities.get(MarketplaceAsset, id, false);
        if (!role) {
          ctx.entities.add(new MarketplaceAsset({
            id,
            marketplace,
            asset: getOrCreateContract(ctx, event.account, ContractType.ERC721),
          }));
        } else {
          role.asset = getOrCreateContract(ctx, event.account, ContractType.ERC721);
          role.marketplace = marketplace;
          ctx.entities.add(role);
        }
        break;
      }
      case MarketplaceRole.LISTER_ROLE: {
        const role = ctx.entities.get(MarketplaceLister, id, false);
        if (!role) {
          ctx.entities.add(new MarketplaceLister({
            id,
            marketplace,
            lister: getOrCreateWallet(ctx, event.account),
          }));
        } else {
          role.lister = getOrCreateWallet(ctx, event.account);
          role.marketplace = marketplace;
          ctx.entities.add(role);
        }
        break;
      }
    }
  }
  for (let event of roleRevokedEvents) {
    const id = ctx.entities.toId(event.contract, event.account);
    getOrCreateMarketplace(ctx, getOrCreateContract(ctx, event.contract, ContractType.MARKETPLACE));
    switch (event.role) {
      case MarketplaceRole.DEFAULT_ADMIN_ROLE: {
        const role = ctx.entities.get(MarketplaceAdmin, id, false);
        if (role) {
          role.admin = null;
          role.marketplace = null;
          ctx.entities.add(role);
        }
        break;
      }
      case MarketplaceRole.ASSET_ROLE: {
        const role = ctx.entities.get(MarketplaceAsset, id, false);
        if (role) {
          role.asset = null;
          role.marketplace = null;
          ctx.entities.add(role);
        }
        break;
      }
      case MarketplaceRole.LISTER_ROLE: {
        const role = ctx.entities.get(MarketplaceLister, id, false);
        if (role) {
          role.lister = null;
          role.marketplace = null;
          ctx.entities.add(role);
        }
        break;
      }
    }
  }
};
