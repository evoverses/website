import { CustomResource, RemovalPolicy } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { CStack, type CStackProps } from "../../models/c-stack";

interface DatabaseUserStackProps extends CStackProps {
  username: string;
  provider: Provider;
  adminSecret: Secret;
  role: "rw" | "readonly";
  schema?: string;
}

export class DatabaseUserStack extends CStack {
  public readonly secret: Secret;

  constructor(scope: Construct, id: `${string}DatabaseUserStack`, props: DatabaseUserStackProps) {
    super(scope, id, props);
    this.idPrefix = id.replace("DatabaseUserStack", "");

    this.secret = new Secret(this, this.toPrefixedId("DatabaseUserSecret"), {
      removalPolicy: RemovalPolicy.DESTROY,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: props.username }),
        generateStringKey: "password",
        excludePunctuation: true,
      },
    });

    const database = this.getContext("dbName");

    new CustomResource(this, this.toPrefixedId("DatabaseUserResource"), {
      serviceToken: props.provider.serviceToken,
      properties: {
        resourceId: props.username,
        role: props.role,
        adminSecretArn: props.adminSecret.secretArn,
        userSecretArn: this.secret.secretArn,
        database,
        schema: props.schema || props.username,
      },
    });
  }
}
