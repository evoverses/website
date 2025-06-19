import { Duration, RemovalPolicy } from "aws-cdk-lib";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Port,
  SecurityGroup,
  SubnetType,
  type Vpc,
} from "aws-cdk-lib/aws-ec2";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import type { Key } from "aws-cdk-lib/aws-kms";
import type { NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  ParameterGroup,
  PostgresEngineVersion,
} from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { join } from "node:path";
import type { SetRequired } from "type-fest";
import { CStack, type CStackProps } from "../../models/c-stack";
import { ManagedFunctionConstruct } from "../constructs/managed-function-construct";
import { DatabaseUserStack } from "./database-user-stack";

interface DatabaseStackProps extends CStackProps {
  vpc: Vpc;
  kmsKey: Key;
}

export class DatabaseStack extends CStack {
  public readonly rds: DatabaseInstance;
  public readonly adminSecret: Secret;
  public readonly indexerUserSecret: Secret;
  public readonly graphQlUserSecret: Secret;
  public readonly rdsAccessSg: SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    this.adminSecret = new Secret(this, "DbCredentialsSecret", {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "postgres" }),
        generateStringKey: "password",
        excludePunctuation: true,
      },
    });

    const engine = DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_15 });
    const parameterGroup = new ParameterGroup(this, "PostgresParamGroup", {
      engine,
      parameters: {
        shared_preload_libraries: "pg_stat_statements,pg_cron",
      },
    });

    const database = this.getContext("dbName");

    this.rdsAccessSg = new SecurityGroup(this, "RdsAccessSG", {
      vpc: props.vpc,
      description: "Allows access to RDS",
      allowAllOutbound: true,
    });

    this.rds = new DatabaseInstance(this, `RdsInstance`, {
      engine,
      databaseName: database,
      vpc: props.vpc,
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      multiAz: false,
      allocatedStorage: 20,
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      credentials: Credentials.fromSecret(this.adminSecret),
      backupRetention: Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.DESTROY,
      publiclyAccessible: false,
      parameterGroup,
    });
    this.rds.connections.allowFrom(this.rdsAccessSg, Port.POSTGRES);

    const lambdaPath = this.getContext("lambdaPath");

    const sharedFnProps: SetRequired<NodejsFunctionProps, "vpc"> = {
      vpc: props.vpc,
      securityGroups: [ this.rdsAccessSg ],
      environment: {
        DB_HOST: this.rds.dbInstanceEndpointAddress,
      },
      initialPolicy: [ new PolicyStatement({ actions: [ "secretsmanager:GetSecretValue" ], resources: [ "*" ] }) ],
    };

    new ManagedFunctionConstruct(this, "DatabaseProvisionerConstruct", {
      functionProps: {
        ...sharedFnProps,
        entry: join(lambdaPath, "src", "db-provisioner.ts"),
        securityGroups: [ this.rdsAccessSg ],
      },
      resourceProperties: {
        adminSecretArn: this.adminSecret.secretArn,
        database,
      },
    });


    const userProvisioner = new ManagedFunctionConstruct(this, "DatabaseUserProvisionerConstruct", {
      functionProps: {
        ...sharedFnProps,
        entry: join(lambdaPath, "src", "db-user-provisioner.ts"),
      },
    });

    const schema = this.getContext("schema");
    const graphQlUserStack = new DatabaseUserStack(this, "GraphQlDatabaseUserStack", {
      username: "graphql",
      role: "readonly",
      adminSecret: this.adminSecret,
      provider: userProvisioner.provider,
      schema,
    });
    this.graphQlUserSecret = graphQlUserStack.secret;
    const indexerUserStack = new DatabaseUserStack(this, "IndexerDatabaseUserStack", {
      username: "squid",
      role: "rw",
      adminSecret: this.adminSecret,
      provider: userProvisioner.provider,
      schema,
    });
    this.indexerUserSecret = indexerUserStack.secret;
  }
}
