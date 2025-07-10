import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  ManyToOne as ManyToOne_,
  Index as Index_,
  IntColumn as IntColumn_,
} from "@subsquid/typeorm-store";
import { Contract } from "./contract.model";

/**
 * Represents a Token entity, tracking ERC20 tokens.
 */
@Entity_()
export class Token {
  constructor(props?: Partial<Token>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @ManyToOne_(() => Contract, { nullable: true })
  contract!: Contract;

  @IntColumn_({ nullable: false })
  decimals!: number;
}
