import { OpenIdConnectProvider } from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";
import { CStack, type CStackProps } from "../models/c-stack";

interface OpenIdConnectStackProps extends CStackProps {

}

export class OpenIdConnectStack extends CStack {
  providerArn: string;

  constructor(scope: Construct, id: string, props?: OpenIdConnectStackProps) {
    super(scope, id, props);
    const provider = new OpenIdConnectProvider(this, "GitHubOidcProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIds: [ "sts.amazonaws.com" ],
    });
    this.providerArn = provider.openIdConnectProviderArn;
  }
}
