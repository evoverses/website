import {
  Client,
  type ClientConfig,
  type QueryArrayConfig,
  type QueryArrayResult,
  type QueryConfig,
  type QueryConfigValues,
  type QueryResult,
  type QueryResultRow,
  type Submittable,
} from "pg";
import format from "pg-format";
import type { SetRequired } from "type-fest";

type PgPassword = ClientConfig["password"]
type BaseConfig = Omit<ClientConfig, "user" | "password" | "database">

class BaseQueryClient {
  private _baseConfig: BaseConfig = {
    host: process.env.DB_HOST,
    port: 5432,
    ssl: {
      rejectUnauthorized: false,
    },
  };
  private user: string;
  private password: PgPassword;
  private database: string = "postgres";

  constructor(config?: ClientConfig) {
    Object.defineProperty(this, "password", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: "",
    });
    if (config) {
      this.config = config;
      this.client = this.makeClient();
    }
  }

  private _client: Client;

  public get client() {
    if (!this._client) {
      this._client = this.makeClient();
    }
    return this._client;
  }

  protected set client(client: Client) {
    this._client = client;
  }

  private get config(): ClientConfig {
    return { ...this._baseConfig, user: this.user, password: this.password, database: this.database };
  }

  private set config(config: ClientConfig) {
    const { user, password, database, ...rest } = config;
    this._baseConfig = { ...this._baseConfig, ...rest };
    if (user) {
      this.user = user;
    }
    if (password) {
      this.password = password;
    }
    if (database) {
      this.database = database;
    }
  }

  query<T extends Submittable>(queryStream: T): T;

  // tslint:disable:no-unnecessary-generics
  query<R extends any[] = any[], I = any[]>(
    queryConfig: QueryArrayConfig<I>,
    values?: QueryConfigValues<I>,
  ): Promise<QueryArrayResult<R>>;

  query<R extends QueryResultRow = any, I = any>(
    queryConfig: QueryConfig<I>,
  ): Promise<QueryResult<R>>;

  query<R extends QueryResultRow = any, I = any[]>(
    queryTextOrConfig: string | QueryConfig<I>,
    values?: QueryConfigValues<I>,
  ): Promise<QueryResult<R>>;

  query(
    queryTextOrConfigOrStream: any,
    values?: any,
  ): any {
    // Handle Submittable (stream) case
    if (queryTextOrConfigOrStream && typeof queryTextOrConfigOrStream.submit === "function") {
      return queryTextOrConfigOrStream;
    }

    // Handle promise-based calls
    if (values !== undefined) {
      // query(text, values) or query(config, values)
      return this.client.query(queryTextOrConfigOrStream, values);
    }

    // query(text) or query(config)
    return this.client.query(queryTextOrConfigOrStream);
  }

  queryFmt(query: string, ...args: any[]) {
    return this.query(format(query, ...args));
  }

  async connect() {
    try {
      console.log("connecting to database...");
      await this.client.connect();
      console.log("Connected to database");
      return this;
    } catch (e: unknown) {
      console.error("error connecting to database:", e);
      throw e;
    }
  }

  async disconnect() {
    if (!this.client) {
      return;
    }
    try {
      await this.client.end();
    } catch {
      // ignore
    }
  }

  async reconnect() {
    await this.disconnect();
    this.client = this.makeClient();
    return this.connect();
  }

  setDatabase(database: string): this;

  setDatabase(database: string, reconnect: true): Promise<this>;

  setDatabase(database: string, reconnect?: boolean): this | Promise<this> {
    if (database !== this.database) {
      this.config = { database };
    }
    if (reconnect) {
      return this.reconnect();
    }
    return this;
  }

  setAuth(credentials: { user?: string; password?: string; }) {
    const { user, password } = credentials;
    if (user !== this.user) {
      this.config = { user };
    }
    if (password !== this.password) {
      this.config = { password };
    }
    return this;
  }

  private makeClient() {
    return new Client(this.config);
  }
}

export class DatabaseClient extends BaseQueryClient {

  constructor(config: SetRequired<ClientConfig, "user" | "password">) {
    super(config);
  }

  public static newClient(user: string, password: string, database: string = "postgres") {
    return (
      new DatabaseClient({ user, password, database })
    ).connect();
  }

  async checkUserExists(username: string) {
    try {
      console.log(`checking if user "${username}" exists`);
      const result = await this.client.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [ username ]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (e: unknown) {
      console.error(`error checking if user "${username}" exists:`, e);
      throw e;
    }
  }

  async checkDatabaseExists(database: string) {
    try {
      console.log(`checking if database "${database}" exists`);
      const result = await this.client.query("SELECT 1 FROM pg_database WHERE datname = $1", [ database ]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (e: unknown) {
      console.error(`error checking if database "${database}" exists:`, e);
      throw e;
    }
  }

  tx() {
    return new DatabaseClientTransaction(this);
  }
}

// @ts-expect-error intentionally hiding client
export class DatabaseClientTransaction extends BaseQueryClient {
  private queries: Parameters<DatabaseClient["query"]>[] = [];
  private _committed = false;
  private _rolledBack = false;

  constructor(private db: DatabaseClient) {
    super();
  }

  protected get client() {
    return this.db.client;
  }

  private get assertCanQuery() {
    if (this._rolledBack || this._committed) {
      throw new Error("Cannot query after commit or rollback");
    }
    return true;
  }

  query(
    queryTextOrConfigOrStream: any,
    values?: any,
  ): any {
    this.assertCanQuery;
    this.queries.push([ queryTextOrConfigOrStream, values ]);
    return this;
  }

  queryFmt(query: string, ...args: any[]) {
    return this.query(format(query, ...args));
  }

  async send() {
    this.assertCanQuery;
    try {
      await this.begin();
      for (const query of this.queries) {
        await this.client.query(...query);
      }
      await this.commit();
    } catch (e) {
      console.log("error in transaction:", e);
      await this.rollback();
      throw e;
    }
  }

  private async begin() {
    await this.client.query("BEGIN");
  }

  private async commit() {
    await this.client.query("COMMIT");
  }

  private async rollback() {
    await this.client.query("ROLLBACK");
  }

}
