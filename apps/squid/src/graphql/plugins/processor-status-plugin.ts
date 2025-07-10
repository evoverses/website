import { gql, makeExtendSchemaPlugin } from "graphile-utils";
import { SQUID_STATE_SCHEMA } from "../../utils/constants";

export const ProcessorStatusPlugin = makeExtendSchemaPlugin((_build, options) => {
  const schemas: string[] = options.stateSchemas || [ SQUID_STATE_SCHEMA ];
  return {
    typeDefs: gql`
      type _ProcessorStatus {
        name: String!
        height: Int!
        hash: String!
      }

      extend type Query {
        squidStatus: [_ProcessorStatus!]!
      }
    `,
    resolvers: {
      Query: {
        squidStatus: async (_parentObject, _args, context, _info) => {
          const pg = context.pgClient;

          const { rows } = await pg.query(
            schemas
              .map((s) => `SELECT '${s}' as name, height, hash FROM ${s}.status`)
              .join(" UNION ALL "),
          );
          console.log(rows);
          return rows || [];
        },
      },
    },
  };
});
