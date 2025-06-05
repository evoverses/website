import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
  ManyToOne as ManyToOne_,
  BigIntColumn as BigIntColumn_,
  DateTimeColumn as DateTimeColumn_,
} from "@subsquid/typeorm-store";
import { NFT } from "./nft.model";
import { Wallet } from "./wallet.model";

@Index_([ "nft", "wallet" ], { unique: false })
@Entity_()
export class NFTWalletBalance {
  constructor(props?: Partial<NFTWalletBalance>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @ManyToOne_(() => NFT, { nullable: true })
  nft!: NFT;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  wallet!: Wallet;

  @Index_()
  @BigIntColumn_({ nullable: false })
  balance!: bigint;

  @Index_()
  @DateTimeColumn_({ nullable: true })
  updatedAt!: Date | undefined | null;
}
