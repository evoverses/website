import { TypeormDatabase, type TypeormDatabaseOptions } from "@subsquid/typeorm-store";

/** Resume from the durable finalized checkpoint, not the old provisional tail.
 * The unchanged TypeORM transaction rolls back that tail before replaying finalized events.
 */
export class FinalizedPortalDatabase extends TypeormDatabase {
  constructor(options: TypeormDatabaseOptions) {
    super({ ...options, supportHotBlocks: false });
  }
  override async connect() {
    const state = await super.connect();
    return { ...state, top: [] };
  }
}
