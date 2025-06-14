import { App } from "aws-cdk-lib";
import { context } from "../context";
import { CoreStack } from "../lib/core-stack";
import { EcrStack } from "../lib/ecr-stack";

const app = new App();
const squidStack = new EcrStack(app, "SquidEcrStack", {
  ...context,
  githubOrg: "evoverses",
  githubRepo: "website",
});
new CoreStack(app, "DevCoreStack", { ...context, squidRepository: squidStack.repo });
