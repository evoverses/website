import type { IGraphQLConfig } from "graphql-config";

const config: IGraphQLConfig = {
  schema: [
    "schema.graphql",
    "src/graphql/schemas/graphile.schema.graphql",
    "src/graphql/schemas/squid.schema.graphql",
    "src/graphql/plugins/*.ts",
  ],
  extensions: {
    endpoints: {
      dev: "https://localhost:4350/graphql",
    },
  },
  include: [ "src/**/*.ts" ],
  exclude: [ "src/graphql/schemas/api.schema.graphql" ],
};

export default config;
