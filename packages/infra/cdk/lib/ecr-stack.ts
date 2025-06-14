// lib/ecr-stack.ts
import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { PolicyStatement, Role, WebIdentityPrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface EcrStackProps extends StackProps {
  githubOrg: string;
  githubRepo: string;
  arn: string;
}

export class EcrStack extends Stack {
  public readonly repo: Repository;
  public readonly githubPushRoleArn: string;

  constructor(scope: Construct, id: string, props: EcrStackProps) {
    super(scope, id, props);

    this.repo = new Repository(this, "EcrRepo", {
      imageScanOnPush: true,
    });

    const githubPushRole = new Role(this, "GithubOidcEcrPushRole", {
      assumedBy: new WebIdentityPrincipal(props.arn, {
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": `repo:${props.githubOrg}/${props.githubRepo}:*`,
        },
      }),
    });

    githubPushRole.addToPolicy(new PolicyStatement({
      actions: [
        "ecr:GetAuthorizationToken",
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
