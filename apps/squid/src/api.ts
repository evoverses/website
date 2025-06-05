import SimplifyInflectorPlugin from "@graphile-contrib/pg-simplify-inflector";
import AggregatesPlugin from "@graphile/pg-aggregates";
import cors from "cors";
import express from "express";
import { NodePlugin } from "graphile-build";
import { postgraphile } from "postgraphile";
import FilterPlugin from "postgraphile-plugin-connection-filter";
import { DEVELOPMENT, SQUID_STATE_SCHEMA } from "./constants";
import { AssetPlugin } from "./plugins/asset-plugin";
import { AttributesByQueryPlugin } from "./plugins/attributes-by-query-plugin";
import { CollectionPlugin } from "./plugins/collection-plugin";
import { ProcessorStatusPlugin } from "./plugins/processor-status-plugin";
import { ProfilePlugin } from "./plugins/profile-plugin";
import { getEnv } from "./utils";

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
    {
      host: getEnv("DB_HOST", "localhost"),
      port: parseInt(getEnv("DB_PORT", "5432")),
      database: getEnv("DB_NAME", "postgres"),
      user: getEnv("DB_USER", "postgres"),
      password: getEnv("DB_PASS", "postgres"),
      ...(
        getEnv("DB_SSL", "false").toLowerCase() === "true" ? {
          ssl: { rejectUnauthorized: false },
        } : {}
      ),
    },
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
          exportGqlSchemaPath: "./api-schema.graphql",
        } : {}
      ),
      disableDefaultMutations: true,
      disableQueryLog: true, // set false to see the processed queries
      skipPlugins: [ NodePlugin ],
      appendPlugins: [
        AggregatesPlugin,
        FilterPlugin,
        SimplifyInflectorPlugin,
        ProcessorStatusPlugin,
        AssetPlugin,
        AttributesByQueryPlugin,
        CollectionPlugin,
        ProfilePlugin,
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
