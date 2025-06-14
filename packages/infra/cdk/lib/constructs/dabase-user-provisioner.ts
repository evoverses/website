import { Code, Runtime, Function } from "aws-cdk-lib/aws-lambda";
import type { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { Duration, CustomResource } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { join } from "node:path";

interface DatabaseUserProvisionerProps {
  vpc: Vpc;
  rds: DatabaseInstance;
  username: string;
  dbName: string;
  adminSecret: Secret;
  role: "rw" | "readonly";
}

export class DatabaseUserProvisioner extends Construct {
  secret: Secret;

  constructor(scope: Construct, id: string, props: DatabaseUserProvisionerProps) {
    super(scope, id);

    this.secret = new Secret(this, "ApiUserSecret", {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: props.username }),
        generateStringKey: "password",
        excludePunctuation: true,
      },
    });
    const fn = new Function(this, "UserProvisionerFn", {
      runtime: Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: Code.fromAsset(join(__dirname, "..", "..", "..", "lambda", "db-bootstrap")), // see below
      timeout: Duration.seconds(30),
      vpc: props.vpc,
      environment: {
        RDS_HOST: props.rds.dbInstanceEndpointAddress,
        RDS_PORT: props.rds.dbInstanceEndpointPort,
        RDS_DB: props.dbName,
        RDS_ADMIN_SECRET_ARN: props.adminSecret.secretArn,
        USER_SECRET_ARN: this.secret.secretArn,
        USER_ROLE: props.role,
      },
    });

    props.adminSecret.grantRead(fn);
    this.secret.grantRead(fn);

    fn.addToRolePolicy(new PolicyStatement({
      actions: [ "secretsmanager:GetSecretValue" ],
      resources: [ props.adminSecret.secretArn, this.secret.secretArn ],
    }));

    new CustomResource(this, "UserProvisionerTrigger", {
      serviceToken: fn.functionArn,
    });
  }
}
