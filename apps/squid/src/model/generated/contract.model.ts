import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
  StringColumn as StringColumn_,
  JSONColumn as JSONColumn_,
  ManyToOne as ManyToOne_,
  DateTimeColumn as DateTimeColumn_,
  OneToMany as OneToMany_,
} from "@subsquid/typeorm-store";
import { ContractType } from "./_contractType";
import { Chain } from "./chain.model";
import { MarketplaceAsset } from "./marketplaceAsset.model";

/**
 * Represents a Contract entity to track metadata about smart contracts.
 */
@Index_([ "chain", "address" ], { unique: false })
@Index_([ "chain", "name" ], { unique: false })
@Entity_()
export class Contract {
  constructor(props?: Partial<Contract>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @StringColumn_({ nullable: false })
  address!: string;

  @Index_()
  @StringColumn_({ nullable: true })
  name!: string | undefined | null;

  @Index_()
  @StringColumn_({ nullable: true })
  symbol!: string | undefined | null;

  @StringColumn_({ nullable: true })
  uri!: string | undefined | null;

  @JSONColumn_({ nullable: true })
  metadata!: unknown | undefined | null;

  @Index_()
  @Column_("varchar", { length: 11, nullable: false })
  type!: ContractType;

  @ManyToOne_(() => Chain, { nullable: true })
  chain!: Chain;

  @Index_()
  @DateTimeColumn_({ nullable: true })
  updatedAt!: Date | undefined | null;

  @OneToMany_(() => MarketplaceAsset, e => e.asset)
  assetMarketplaces!: MarketplaceAsset[];
}
