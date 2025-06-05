import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  ManyToOne as ManyToOne_,
  Index as Index_,
  DateTimeColumn as DateTimeColumn_,
  OneToMany as OneToMany_,
} from "@subsquid/typeorm-store";
import { Contract } from "./contract.model";
import { MarketplaceAdmin } from "./marketplaceAdmin.model";
import { MarketplaceLister } from "./marketplaceLister.model";
import { MarketplaceAsset } from "./marketplaceAsset.model";
import { DirectListing } from "./directListing.model";
import { Offer } from "./offer.model";
import { EnglishAuction } from "./englishAuction.model";
import { DirectListingSale } from "./directListingSale.model";

@Entity_()
export class Marketplace {
  constructor(props?: Partial<Marketplace>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @ManyToOne_(() => Contract, { nullable: true })
  contract!: Contract;

  @Index_()
  @DateTimeColumn_({ nullable: true })
  updatedAt!: Date | undefined | null;

  @OneToMany_(() => MarketplaceAdmin, e => e.marketplace)
  admins!: MarketplaceAdmin[];

  @OneToMany_(() => MarketplaceLister, e => e.marketplace)
  listers!: MarketplaceLister[];

  @OneToMany_(() => MarketplaceAsset, e => e.marketplace)
  assets!: MarketplaceAsset[];

  @OneToMany_(() => DirectListing, e => e.marketplace)
  listings!: DirectListing[];

  @OneToMany_(() => Offer, e => e.marketplace)
  offers!: Offer[];

  @OneToMany_(() => EnglishAuction, e => e.marketplace)
  auctions!: EnglishAuction[];

  @OneToMany_(() => DirectListingSale, e => e.marketplace)
  sales!: DirectListingSale[];
}
