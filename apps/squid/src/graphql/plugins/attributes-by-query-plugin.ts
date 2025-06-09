import { makeExtendSchemaPlugin, gql } from "postgraphile";
import { PoolClient } from "pg";

export const AttributesByQueryPlugin = makeExtendSchemaPlugin(() => (
  {
    typeDefs: gql`
      type AttributeEntity {
        traitType: String
        value: String
        displayType: String
      }

      extend type Query {
        attributesByQuery(
          chainId: String!,
          address: String!,
          query: String!,
          limit: Int = 10
        ): [AttributeEntity!]!
      }
    `,
    resolvers: {
      Query: {
        attributesByQuery: async (_query, args, context, _info) => {
          const client: PoolClient = context.pgClient;
          const { chainId, address, query, limit } = args;
          const q = query.trim().toLowerCase().replace(/\s+/g, " ");
          const clamped = Math.min(limit ?? 10, 50);

          if (q.length === 0) {
            return [];
          }

          const raw = await client.query(
            "SELECT * FROM public.attributes_by_query($1, $2, $3, $4)",
            [ chainId, address.toLowerCase(), `%${q}%`, clamped ],
          );

          return raw.rows.map((r: any) => (
            {
              traitType: r.trait_type,
              value: r.value,
              displayType: r.display_type
            }
          ));
        }
      }
    }
  }
));
