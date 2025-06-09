import cors from "cors";
import express from "express";
import { NodePlugin } from "graphile-build";
import { PgAllRows, PgRowByUniqueConstraint, PgTablesPlugin } from "graphile-build-pg";
import { Pool } from "pg";
import { postgraphile } from "postgraphile";
import { AttributesByQueryPlugin } from "./graphql/plugins/attributes-by-query-plugin";
import { CollectionPlugin } from "./graphql/plugins/collection-plugin";
import { EvoPlugin } from "./graphql/plugins/evo-plugin";
import { ProcessorStatusPlugin } from "./graphql/plugins/processor-status-plugin";
import { getEnv } from "./utils";
import { DATABASE_CONFIG, DEVELOPMENT, SQUID_STATE_SCHEMA } from "./utils/constants";

const app = express();

const devOrigins = DEVELOPMENT ? [
  "http://localhost:3000",
  "http://localhost:4350",
] : [];

const allowedOrigins = [
  ...devOrigins,
  "https://evoverses.com",
  "https://preview.evoverses.com",
  "https://ngrok.cajun.tools",
];

const evosClient = new Pool({ ...DATABASE_CONFIG, database: "evos" });

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked CORS request from ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.get("/graphql", (_req, res, _next) => {
  res.send(`<div>Whatcha doin?</div>`);
});

app.use(
  postgraphile(
    DATABASE_CONFIG,
    getEnv("DB_SCHEMA", "public"),
    {
      graphiql: true,
      enhanceGraphiql: true,
      dynamicJson: true,
      ignoreRBAC: true,
      ...(
        DEVELOPMENT ? {
          showErrorStack: "json",
          extendedErrors: [ "hint", "detail", "errcode" ],
          exportGqlSchemaPath: "./src/graphql/schemas/api.schema.graphql",
        } : {}
      ),
      // readCache: "",
      disableDefaultMutations: true,
      disableQueryLog: DEVELOPMENT, // set false to see the processed queries
      skipPlugins: [ NodePlugin, PgTablesPlugin, PgAllRows, PgRowByUniqueConstraint ],
      appendPlugins: [
        EvoPlugin,
        AttributesByQueryPlugin,
        CollectionPlugin,
        ProcessorStatusPlugin,
      ],
      additionalGraphQLContextFromRequest: async () => (
        { evosClient }
      ),
      externalGraphqlRoute: getEnv("GQL_BASE_PATH") ? getEnv("GQL_BASE_PATH") + "/api/graphql" : undefined,
      graphileBuildOptions: {
        stateSchemas: [ SQUID_STATE_SCHEMA ],
        pgDisableNodeIdField: true,
        pgDisableNodeInterface: true,
      },
    },
  ),
);

app.listen(getEnv("GQL_PORT", "4350"), () => {
  console.log(`Squid API listening on port ${getEnv("GQL_PORT", "4350")}`);
});
