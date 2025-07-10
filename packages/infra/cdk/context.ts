import { join } from "node:path";

const projectRoot = join(__dirname, "..", "..", "..");

type Stage = "dev" | "prod";

type GithubContext = {
  githubOrg: string;
  githubRepo: string;
}

type ApiContext = {
  domainName: string;
}

type DatabaseContext = {
  dbName: string;
  schema: string;
}

type ProjectPathContext = {
  lambdaPath: string;
  projectRoot: string;
}
type StageContext = GithubContext & ApiContext & DatabaseContext & ProjectPathContext;

const githubContext: GithubContext = {
  githubOrg: "evoverses",
  githubRepo: "website",
};

const projectPathContext = {
  lambdaPath: join(projectRoot, "apps", "lambda"),
  projectRoot,
};

const dbContext: DatabaseContext = {
  schema: "squid",
  dbName: "evoverses-dev",
};

export const stageContext: Record<Stage, StageContext> = {
  dev: {
    domainName: "api.dev.evoverses.com",
    ...dbContext,
    ...githubContext,
    ...projectPathContext,
  },
  prod: {
    domainName: "api.evoverses.com",
    ...dbContext,
    dbName: "evoverses",
    ...githubContext,
    ...projectPathContext,
  },
};
