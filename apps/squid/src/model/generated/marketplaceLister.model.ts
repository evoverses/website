import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  ManyToOne as ManyToOne_,
  Index as Index_,
} from "@subsquid/typeorm-store";
import { Marketplace } from "./marketplace.model";
import { Wallet } from "./wallet.model";

@Entity_()
export class MarketplaceLister {
  constructor(props?: Partial<MarketplaceLister>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @ManyToOne_(() => Marketplace, { nullable: true })
  marketplace!: Marketplace | undefined | null;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  lister!: Wallet | undefined | null;
}
