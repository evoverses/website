import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
  BigIntColumn as BigIntColumn_,
  ManyToOne as ManyToOne_,
  DateTimeColumn as DateTimeColumn_,
  BooleanColumn as BooleanColumn_,
} from "@subsquid/typeorm-store";
import { Marketplace } from "./marketplace.model";
import { Transaction } from "./transaction.model";
import { Wallet } from "./wallet.model";
import { NFT } from "./nft.model";
import { Token } from "./token.model";
import { TokenType } from "./_tokenType";
import { StateStatus } from "./_stateStatus";

/**
 * Represents a Direct Listing entity in Thirdweb's Marketplace.
 */
@Index_([ "nft", "status", "reserved", "endAt", "pricePerToken" ], { unique: false })
@Entity_()
export class DirectListing {
  constructor(props?: Partial<DirectListing>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @BigIntColumn_({ nullable: false })
  listingId!: bigint;

  @Index_()
  @ManyToOne_(() => Marketplace, { nullable: true })
  marketplace!: Marketplace;

  @Index_()
  @ManyToOne_(() => Transaction, { nullable: true })
  tx!: Transaction;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  creator!: Wallet;

  @ManyToOne_(() => NFT, { nullable: true })
  nft!: NFT;

  @Index_()
  @BigIntColumn_({ nullable: false })
  quantity!: bigint;

  @Index_()
  @BigIntColumn_({ nullable: false })
  pricePerToken!: bigint;

  @Index_()
  @ManyToOne_(() => Token, { nullable: true })
  currency!: Token;

  @Index_()
  @DateTimeColumn_({ nullable: false })
  startAt!: Date;

  @Index_()
  @DateTimeColumn_({ nullable: false })
  endAt!: Date;

  @Index_()
  @BooleanColumn_({ nullable: false })
  reserved!: boolean;

  @Index_()
  @Column_("varchar", { length: 7, nullable: false })
  type!: TokenType;

  @Index_()
  @Column_("varchar", { length: 9, nullable: false })
  status!: StateStatus;
}
