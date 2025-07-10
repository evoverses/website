import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
  BigIntColumn as BigIntColumn_,
  ManyToOne as ManyToOne_,
  DateTimeColumn as DateTimeColumn_,
  IntColumn as IntColumn_,
  OneToMany as OneToMany_,
} from "@subsquid/typeorm-store";
import { Marketplace } from "./marketplace.model";
import { Transaction } from "./transaction.model";
import { Wallet } from "./wallet.model";
import { NFT } from "./nft.model";
import { Token } from "./token.model";
import { StateStatus } from "./_stateStatus";
import { EnglishAuctionBid } from "./englishAuctionBid.model";

/**
 * Represents an EnglishAuction entity in Thirdweb's Marketplace (English Auctions).
 */
@Index_([ "marketplace", "auctionId" ], { unique: true })
@Entity_()
export class EnglishAuction {
  constructor(props?: Partial<EnglishAuction>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @BigIntColumn_({ nullable: false })
  auctionId!: bigint;

  @ManyToOne_(() => Marketplace, { nullable: true })
  marketplace!: Marketplace;

  @Index_()
  @ManyToOne_(() => Transaction, { nullable: true })
  tx!: Transaction;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  creator!: Wallet;

  @Index_()
  @ManyToOne_(() => NFT, { nullable: true })
  nft!: NFT;

  @Index_()
  @BigIntColumn_({ nullable: false })
  quantity!: bigint;

  @Index_()
  @BigIntColumn_({ nullable: false })
  minimumBidAmount!: bigint;

  @Index_()
  @BigIntColumn_({ nullable: false })
  buyoutBidAmount!: bigint;

  @Index_()
  @ManyToOne_(() => Token, { nullable: true })
  currency!: Token;

  @Index_()
  @DateTimeColumn_({ nullable: true })
  startAt!: Date | undefined | null;

  @Index_()
  @DateTimeColumn_({ nullable: false })
  endAt!: Date;

  @IntColumn_({ nullable: false })
  timeBufferInSeconds!: number;

  @IntColumn_({ nullable: false })
  bidBufferBps!: number;

  @Index_()
  @Column_("varchar", { length: 9, nullable: false })
  status!: StateStatus;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  winningBidder!: Wallet | undefined | null;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  closer!: Wallet | undefined | null;

  @OneToMany_(() => EnglishAuctionBid, e => e.auction)
  bids!: EnglishAuctionBid[];
}
