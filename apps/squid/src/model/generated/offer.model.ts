import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
  BigIntColumn as BigIntColumn_,
  ManyToOne as ManyToOne_,
  DateTimeColumn as DateTimeColumn_,
} from "@subsquid/typeorm-store";
import { Marketplace } from "./marketplace.model";
import { Transaction } from "./transaction.model";
import { Wallet } from "./wallet.model";
import { NFT } from "./nft.model";
import { Token } from "./token.model";
import { StateStatus } from "./_stateStatus";

/**
 * Represents an Offer entity in Thirdweb's Marketplace.
 */
@Index_([ "marketplace", "offerId" ], { unique: false })
@Index_([ "nft", "expiresAt", "totalPrice" ], { unique: false })
@Entity_()
export class Offer {
  constructor(props?: Partial<Offer>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @BigIntColumn_({ nullable: false })
  offerId!: bigint;

  @ManyToOne_(() => Marketplace, { nullable: true })
  marketplace!: Marketplace;

  @Index_()
  @ManyToOne_(() => Transaction, { nullable: true })
  tx!: Transaction;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  offeror!: Wallet;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  seller!: Wallet | undefined | null;

  @ManyToOne_(() => NFT, { nullable: true })
  nft!: NFT;

  @Index_()
  @BigIntColumn_({ nullable: false })
  quantity!: bigint;

  @Index_()
  @BigIntColumn_({ nullable: false })
  totalPrice!: bigint;

  @Index_()
  @ManyToOne_(() => Token, { nullable: true })
  currency!: Token;

  @Index_()
  @DateTimeColumn_({ nullable: false })
  expiresAt!: Date;

  @Index_()
  @Column_("varchar", { length: 9, nullable: false })
  status!: StateStatus;
}
