import { typedData } from "@/data/viem/signature";
import { Address } from "abitype";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import { recoverTypedDataAddress, verifyTypedData } from "viem";

export const DISCORD_SCOPES = [ "identify", "email", "guilds.members.read" ];

export default {
  providers: [
    DiscordProvider({
      authorization: `https://discord.com/api/oauth2/authorize?scope=${DISCORD_SCOPES.join("+")}`,
    }),
    GoogleProvider({}),
    CredentialsProvider({
      id: "web3",
      name: "Web3",
      credentials: {
        address: { label: "Address", type: "text", placeholder: "0x..." },
        signature: { label: "Signature", type: "text", placeholder: "0x..." },
        sessionTicket: { label: "Session Ticket", type: "text", placeholder: "hidden" },
        csrfToken: { label: "CSRF Token", type: "text", placeholder: "hidden" },
      },
      authorize: async (credentials, req) => {
        if (!credentials) {
          throw new Error("No credentials");
        }

        if (!credentials.sessionTicket) {
          throw new Error("You must be logged in to add a wallet");
        }
        const address = await recoverTypedDataAddress({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: {
            from: { wallet: credentials.address as Address, nonce: credentials.csrfToken as string },
            contents: typedData.contents,
          },
          signature: credentials.signature as Address,
        });

        const valid = await verifyTypedData({
          address,
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: {
            from: { wallet: credentials.address as Address, nonce: credentials.csrfToken as string },
            contents: typedData.contents,
          },
          signature: credentials.signature as Address,
        });
        if (!valid) {
          throw new Error("Invalid signature");
        }
        // await addWallet(session.user.id,  address);
        return { id: address, sessionTicket: credentials.sessionTicket };
      },
    }),
  ],
} satisfies NextAuthConfig;
