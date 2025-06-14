import type { Environment } from "aws-cdk-lib";

export interface Context {
  readonly env?: Environment,
  readonly domainName: string,
  readonly dbName: string
}

export const context: Context = {
  env: {
    region: "us-east-2",
    account: "934769272164",
  },
  domainName: "api.evoverses.com",
  dbName: "squid",
} as const;
