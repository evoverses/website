// lib/ecr-stack.ts
import { CfnOutput } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { PolicyStatement, Role, WebIdentityPrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { CStack, type CStackProps } from "../models/c-stack";

interface EcrStackProps extends CStackProps {
  openIdConnectProviderArn: string;
}

export class EcrStack extends CStack {
  public readonly repo: Repository;
  public readonly githubPushRoleArn: string;

  constructor(scope: Construct, id: string, props: EcrStackProps) {
    super(scope, id, props);

    this.repo = new Repository(this, "Repo", {
      imageScanOnPush: false,
    });
    const githubOrg = this.getContext("githubOrg");
    const githubRepo = this.getContext("githubRepo");
    const githubPushRole = new Role(this, "GithubOidcEcrPushRole", {
      assumedBy: new WebIdentityPrincipal(props.openIdConnectProviderArn, {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": `repo:${githubOrg}/${githubRepo}:ref:refs/heads/*`,
        },
      }),
    });
    githubPushRole.addToPolicy(new PolicyStatement({
      actions: [
        "ecr:GetAuthorizationToken", // must be *
      ],
      resources: [ "*" ],
    }));
    githubPushRole.addToPolicy(new PolicyStatement({
      actions: [
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:GetDownloadUrlForLayer",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart",
      ],
      resources: [ this.repo.repositoryArn ],
    }));

    new CfnOutput(this, "EcrUri", { value: this.repo.repositoryUri });

    new CfnOutput(this, "GithubPushRoleArn", { value: githubPushRole.roleArn });

    this.githubPushRoleArn = githubPushRole.roleArn;
  }
}
