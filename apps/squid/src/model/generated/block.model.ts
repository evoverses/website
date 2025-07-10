import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  Index as Index_,
  IntColumn as IntColumn_,
  DateTimeColumn as DateTimeColumn_,
  ManyToOne as ManyToOne_,
  OneToMany as OneToMany_,
} from "@subsquid/typeorm-store";
import { Chain } from "./chain.model";
import { Transaction } from "./transaction.model";

/**
 * Represents a Block entity, used to track timestamps of related events.
 */
@Index_([ "id", "timestamp" ], { unique: false })
@Entity_()
export class Block {
  constructor(props?: Partial<Block>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @IntColumn_({ nullable: false })
  number!: number;

  @Index_()
  @DateTimeColumn_({ nullable: false })
  timestamp!: Date;

  @Index_()
  @ManyToOne_(() => Chain, { nullable: true })
  chain!: Chain;

  @OneToMany_(() => Transaction, e => e.block)
  transactions!: Transaction[];
}
