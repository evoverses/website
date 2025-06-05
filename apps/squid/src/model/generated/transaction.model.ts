import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  StringColumn as StringColumn_,
  Index as Index_,
  ManyToOne as ManyToOne_,
} from "@subsquid/typeorm-store";
import { Block } from "./block.model";
import { Wallet } from "./wallet.model";

/**
 * Represents a Transaction entity, used to track metadata of a transaction.
 */
@Entity_()
export class Transaction {
  constructor(props?: Partial<Transaction>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @StringColumn_({ nullable: false })
  hash!: string;

  @Index_()
  @ManyToOne_(() => Block, { nullable: true })
  block!: Block;

  @Index_()
  @ManyToOne_(() => Wallet, { nullable: true })
  from!: Wallet;
}
