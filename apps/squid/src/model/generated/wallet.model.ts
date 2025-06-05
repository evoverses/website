import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  StringColumn as StringColumn_,
  Index as Index_,
  ManyToOne as ManyToOne_,
  OneToMany as OneToMany_,
} from "@subsquid/typeorm-store";
import { Chain } from "./chain.model";
import { Transaction } from "./transaction.model";
import { DirectListing } from "./directListing.model";
import { Offer } from "./offer.model";
import { EnglishAuctionBid } from "./englishAuctionBid.model";
import { EnglishAuction } from "./englishAuction.model";
import { DirectListingSale } from "./directListingSale.model";
import { MarketplaceAdmin } from "./marketplaceAdmin.model";
import { MarketplaceLister } from "./marketplaceLister.model";

/**
 * Represents a Wallet entity, tracking activity for an Ethereum address.
 */
@Entity_()
export class Wallet {
  constructor(props?: Partial<Wallet>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @StringColumn_({ nullable: false })
  address!: string;

  @Index_()
  @ManyToOne_(() => Chain, { nullable: true })
  chain!: Chain;

  @OneToMany_(() => Transaction, e => e.from)
  transactions!: Transaction[];

  @OneToMany_(() => DirectListing, e => e.creator)
  listings!: DirectListing[];

  @OneToMany_(() => Offer, e => e.offeror)
  offers!: Offer[];

  @OneToMany_(() => EnglishAuctionBid, e => e.bidder)
  bids!: EnglishAuctionBid[];

  @OneToMany_(() => EnglishAuction, e => e.creator)
  auctions!: EnglishAuction[];

  @OneToMany_(() => DirectListingSale, e => e.seller)
  sales!: DirectListingSale[];

  @OneToMany_(() => MarketplaceAdmin, e => e.admin)
  adminMarketplaces!: MarketplaceAdmin[];

  @OneToMany_(() => MarketplaceLister, e => e.lister)
  listerMarketplaces!: MarketplaceLister[];
}
