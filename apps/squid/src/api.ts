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
import { middlewares, requireAuth } from "./utils/middlewares";
import { appRoutes, graphqlRoutes } from "./utils/routes";

const app = express();

app.use(...middlewares);
app.get("/", requireAuth, graphqlRoutes.get);
app.use("/graphiql", requireAuth);
app.get("/health", appRoutes.health);

console.log(`running in ${DEVELOPMENT ? "development" : "production"} mode`);

app.use(
  postgraphile(
    DATABASE_CONFIG,
    [ "squid", "metadata", SQUID_STATE_SCHEMA ],
    {
      ignoreRBAC: true,
      dynamicJson: true,
      graphqlRoute: "/",
      ...(
        DEVELOPMENT ? {
          showErrorStack: "json",
          extendedErrors: [ "hint", "detail", "errcode" ],
          exportGqlSchemaPath: "./src/graphql/schemas/api.schema.graphql",
          sortExport: true,
          enhanceGraphiql: true,
          externalGraphqlRoute: "/",
          graphiql: true,
          graphiqlRoute: "/graphiql",
        } : {
          externalGraphqlRoute: "/graphql",
          disableQueryLog: true,
        }
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
