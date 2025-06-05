import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  ManyToOne as ManyToOne_,
  Index as Index_,
} from "@subsquid/typeorm-store";
import { Marketplace } from "./marketplace.model";
import { Contract } from "./contract.model";

@Entity_()
export class MarketplaceAsset {
  constructor(props?: Partial<MarketplaceAsset>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @ManyToOne_(() => Marketplace, { nullable: true })
  marketplace!: Marketplace | undefined | null;

  @Index_()
  @ManyToOne_(() => Contract, { nullable: true })
  asset!: Contract | undefined | null;
}
