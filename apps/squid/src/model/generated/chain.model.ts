import {
  Entity as Entity_,
  Column as Column_,
  PrimaryColumn as PrimaryColumn_,
  StringColumn as StringColumn_,
  Index as Index_,
} from "@subsquid/typeorm-store";

/**
 * Represents a Chain entity to track metadata about the blockchain networks.
 */
@Entity_()
export class Chain {
  constructor(props?: Partial<Chain>) {
    Object.assign(this, props);
  }

  @PrimaryColumn_()
  id!: string;

  @Index_()
  @StringColumn_({ nullable: true })
  name!: string | undefined | null;

  @Index_()
  @StringColumn_({ nullable: true })
  symbol!: string | undefined | null;

  @StringColumn_({ nullable: true })
  icon!: string | undefined | null;
}
