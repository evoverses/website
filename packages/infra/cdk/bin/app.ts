import { App } from "aws-cdk-lib";
import { context } from "../context";
import { CoreStack } from "../lib/core-stack";
import { EcrStack } from "../lib/ecr-stack";
import { OpenIdConnectStack } from "../lib/openid-connect-stack";

const app = new App();
const openId = new OpenIdConnectStack(app, "OpenIdConnectStack", context);
const squidStack = new EcrStack(app, "SquidEcrStack", {
  ...context,
  githubOrg: "evoverses",
  githubRepo: "website",
  arn: openId.arn,
});
new CoreStack(app, "DevCoreStack", { ...context, squidRepository: squidStack.repo });
