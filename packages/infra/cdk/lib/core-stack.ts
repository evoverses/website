import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { InstanceClass, InstanceSize, InstanceType, Port, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ListenerAction,
  ListenerCondition,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Key } from "aws-cdk-lib/aws-kms";
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import type { Context } from "../context";
import { DatabaseUserProvisioner } from "./constructs/dabase-user-provisioner";
import { EcsGraphqlTask } from "./tasks/graphql-task";
import { EcsIndexerTask } from "./tasks/indexer-task";

interface CoreStackProps extends StackProps, Context {
  squidRepository: Repository;
}

export class CoreStack extends Stack {

  constructor(scope: Construct, id: string, props: CoreStackProps) {
    super(scope, id, props);
    const vpc = new Vpc(this, `Vpc`, {
      vpcName: `infra-vpc`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { cidrMask: 24, name: "public", subnetType: SubnetType.PUBLIC },
        { cidrMask: 24, name: "private-egress", subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      ],
    });

    const kmsKey = new Key(this, "KmsKey", {
      alias: "alias/server-encryption/dev",
    });
    const rdsSecret = new Secret(this, "DbCredentialsSecret", {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "postgres" }),
        generateStringKey: "password",
        excludePunctuation: true,
      },
    });

    const rds = new DatabaseInstance(this, `RdsInstance`, {
      engine: DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_15 }),
      vpc,
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      multiAz: false,
      allocatedStorage: 20,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      credentials: Credentials.fromSecret(rdsSecret),
      backupRetention: Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.DESTROY,
      publiclyAccessible: false,
    });

    const graphQlDbUser = new DatabaseUserProvisioner(this, "GraphqlDbUserProvisioner", {
      vpc,
      rds,
      username: "graphql_api_user",
      dbName: props.dbName,
      adminSecret: rdsSecret,
      role: "readonly",
    });

    const indexerDbUser = new DatabaseUserProvisioner(this, "IndexerDbUserProvisioner", {
      vpc,
      rds,
      username: "indexer_user",
      dbName: props.dbName,
      adminSecret: rdsSecret,
      role: "rw",
    });

    const zone = HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    const cert = new Certificate(this, "Cert", {
      domainName: props.domainName,
      validation: CertificateValidation.fromDns(zone),
    });

    const alb = new ApplicationLoadBalancer(this, "ApiALB", {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener("HttpsListener", {
      port: 443,
      protocol: ApplicationProtocol.HTTPS,
      certificates: [ cert ],
      defaultAction: ListenerAction.fixedResponse(404),
    });

    new ARecord(this, "ApiAliasRecord", {
      zone,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(alb)),
    });

    const cluster = new Cluster(this, "EcsCluster", {
      clusterName: `infra-cluster`,
      vpc,
    });

    const graphqlTask = new EcsGraphqlTask(this, "GraphqlTask", {
      ...props,
      repo: props.squidRepository,
      cluster,
      userSecret: graphQlDbUser.secret,
      rds,
    });
    const indexerTask = new EcsIndexerTask(this, "IndexerTask", {
      ...props,
      repo: props.squidRepository,
      cluster,
      userSecret: indexerDbUser.secret,
      rds,
    });

    listener.addTargets("GraphqlTargets", {
      priority: 1,
      conditions: [ ListenerCondition.pathPatterns([ "/graphql" ]) ],
      port: 4350,
      protocol: ApplicationProtocol.HTTP,
      targets: [ graphqlTask.service ],
      healthCheck: { path: "/health" },
    });

    graphqlTask.service.connections.allowFrom(
      listener,
      Port.tcp(4350),
      "Allow ALB to reach GraphQL ECS",
    );
  }
}
