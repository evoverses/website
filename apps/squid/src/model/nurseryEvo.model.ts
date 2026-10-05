import {
  Entity,
  Column,
  PrimaryColumn,
  IntColumn,
} from "@subsquid/typeorm-store";
import type { Metadata } from "../nursery/projection";
/** A contract-derived overlay, saved through Store so hot-block rollbacks include it. */
@Entity()
export class NurseryEvo {
  constructor(props?: Partial<NurseryEvo>) {
    Object.assign(this, props);
  }
  @PrimaryColumn()
  id!: string;
  @Column("text", { nullable: false })
  hatcher!: string;
  @IntColumn({ nullable: false })
  blockNumber!: number;
  @Column("text", { nullable: false })
  blockHash!: string;
  @Column("jsonb", { nullable: false })
  metadata!: Metadata;
}
