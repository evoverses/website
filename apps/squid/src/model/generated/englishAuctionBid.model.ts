import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  ManyToOne as ManyToOne_,
  Index as Index_,
  BigIntColumn as BigIntColumn_,
} from "@subsquid/typeorm-store";
import { Transaction } from "./transaction.model";
import { EnglishAuction } from "./englishAuction.model";
import { Wallet } from "./wallet.model";

/**
 * Represents a Bid placed on an EnglishAuction.
 */
@Entity_()
export class EnglishAuctionBid {
  constructor(props?: Partial<EnglishAuctionBid>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @ManyToOne_(() => Transaction, { nullable: true })
  tx!: Transaction;

  @Index_()
  @ManyToOne_(() => EnglishAuction, { nullable: true })
  auction!: EnglishAuction;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  bidder!: Wallet;

  @Index_()
  @BigIntColumn_({ nullable: false })
  amount!: bigint;
}
