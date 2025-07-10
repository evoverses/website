import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
  ManyToOne as ManyToOne_,
  BigIntColumn as BigIntColumn_,
} from "@subsquid/typeorm-store";
import { Marketplace } from "./marketplace.model";
import { Transaction } from "./transaction.model";
import { Wallet } from "./wallet.model";
import { DirectListing } from "./directListing.model";

/**
 * Represents a Sale entity for a direct listing.
 */
@Index_([ "marketplace", "listing" ], { unique: true })
@Index_([ "listing", "tx" ], { unique: false })
@Entity_()
export class DirectListingSale {
  constructor(props?: Partial<DirectListingSale>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @ManyToOne_(() => Marketplace, { nullable: true })
  marketplace!: Marketplace;

  @Index_()
  @ManyToOne_(() => Transaction, { nullable: true })
  tx!: Transaction;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  seller!: Wallet;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  buyer!: Wallet;

  @ManyToOne_(() => DirectListing, { nullable: true })
  listing!: DirectListing;

  @Index_()
  @BigIntColumn_({ nullable: false })
  quantity!: bigint;

  @Index_()
  @BigIntColumn_({ nullable: false })
  totalPrice!: bigint;
}
