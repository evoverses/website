import { Stack, type StackProps } from "aws-cdk-lib";
import { OpenIdConnectProvider } from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

export class OpenIdConnectStack extends Stack {
  arn: string;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const provider = new OpenIdConnectProvider(this, "GitHubOidcProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: [ "sts.amazonaws.com" ],
    });
    this.arn = provider.openIdConnectProviderArn;
  }
}
