import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  BigIntColumn as BigIntColumn_,
  Index as Index_,
  ManyToOne as ManyToOne_,
  DateTimeColumn as DateTimeColumn_,
  OneToMany as OneToMany_,
} from "@subsquid/typeorm-store";
import * as marshal from "./marshal";
import { Contract } from "./contract.model";
import { Wallet } from "./wallet.model";
import { Metadata } from "./_metadata";
import { NFTWalletBalance } from "./nftWalletBalance.model";

/**
 * Represents an NFT entity, capturing ERC721 and ERC1155 tokens.
 */
@Entity_()
export class NFT {
  constructor(props?: Partial<NFT>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @BigIntColumn_({ nullable: false })
  tokenId!: bigint;

  @Index_()
  @ManyToOne_(() => Contract, { nullable: true })
  contract!: Contract;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  owner!: Wallet | undefined | null;

  @Column_(
    "jsonb",
    {
      transformer: {
        to: obj => obj == null ? undefined : obj.toJSON(),
        from: obj => obj == null ? undefined : new Metadata(undefined, obj),
      }, nullable: true,
    },
  )
  metadata!: Metadata | undefined | null;

  @Index_()
  @DateTimeColumn_({ nullable: true })
  updatedAt!: Date | undefined | null;

  @OneToMany_(() => NFTWalletBalance, e => e.nft)
  balances!: NFTWalletBalance[];
}
