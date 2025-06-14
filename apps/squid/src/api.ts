import cors from "cors";
import express from "express";
import { NodePlugin } from "graphile-build";
import { PgAllRows, PgRowByUniqueConstraint, PgTablesPlugin } from "graphile-build-pg";
import { postgraphile } from "postgraphile";
import { AttributesByQueryPlugin } from "./graphql/plugins/attributes-by-query-plugin";
import { CollectionPlugin } from "./graphql/plugins/collection-plugin";
import { EvoPlugin } from "./graphql/plugins/evo-plugin";
import { ProcessorStatusPlugin } from "./graphql/plugins/processor-status-plugin";
import { getEnv } from "./utils";
import { DATABASE_CONFIG, DEVELOPMENT, SQUID_STATE_SCHEMA } from "./utils/constants";
import { corsMiddleware } from "./utils/middlewares";

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

app.use(corsMiddleware(allowedOrigins));

app.get("/graphql", (_req, res, _next) => {
  res.send(`<div>Whatcha doin?</div>`);
});
app.get("/health", (_req, res, _next) => {
  res.send(`ok`);
});

app.use(
  postgraphile(
    DATABASE_CONFIG,
    getEnv("DB_SCHEMA", "public"),
    {
      dynamicJson: true,
      ignoreRBAC: true,
      ...(
        DEVELOPMENT ? {
          graphiql: true,
          enhanceGraphiql: true,
          showErrorStack: "json",
          extendedErrors: [ "hint", "detail", "errcode" ],
          exportGqlSchemaPath: "./src/graphql/schemas/api.schema.graphql",
          disableQueryLog: true,
        } : {}
      ),
      // readCache: "",
      disableDefaultMutations: true,
      skipPlugins: [ NodePlugin, PgTablesPlugin, PgAllRows, PgRowByUniqueConstraint ],
      appendPlugins: [
        EvoPlugin,
        AttributesByQueryPlugin,
        CollectionPlugin,
        ProcessorStatusPlugin,
      ],
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
