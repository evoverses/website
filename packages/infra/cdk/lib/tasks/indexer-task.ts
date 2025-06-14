import { Port } from "aws-cdk-lib/aws-ec2";
import {
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  Secret as ECSSecret,
} from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import type { EcsTaskProps } from "../interfaces";

export class EcsIndexerTask extends Construct {
  service: FargateService;

  constructor(scope: Construct, id: string, props: EcsTaskProps) {
    super(scope, id);

    const taskDef = new FargateTaskDefinition(this, "IndexerTaskDef", {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    props.userSecret.grantRead(taskDef.taskRole);

    taskDef.addContainer("IndexerContainer", {
      image: ContainerImage.fromEcrRepository(props.repo, "dev"),
      logging: LogDrivers.awsLogs({ streamPrefix: "indexer" }),
      command: [ "process:prod" ],
      environment: {
        NODE_ENV: "production",
        DB_HOST: props.rds.dbInstanceEndpointAddress,
        DB_PORT: props.rds.dbInstanceEndpointPort,
        DB_NAME: props.dbName,
        DB_SSL: "true",
        DB_SSL_REJECT_UNAUTHORIZED: "false",
        SQD_DEBUG: "sqd:processor:mapping,sqd:processor:mapping:*",
        SQD_ALLOW_SENTINEL: "BlockHeader.totalDifficulty,BlockHeader.baseFeePerGas",
        MARKETPLACE_ADDRESSES: "0x888BEB2C914657B1eA2cCC91555C5800eecdD4c0",
        NFT_ADDRESSES: "0x4151b8afa10653d304fdac9a781afccd45ec164c",
        GATEWAY_NETWORK_SLUG: "avalanche-mainnet",
        CHAIN_ID: "43114",
      },
      secrets: {
        DB_USER: ECSSecret.fromSecretsManager(props.userSecret, "username"),
        DB_PASS: ECSSecret.fromSecretsManager(props.userSecret, "password"),
      },
    });

    this.service = new FargateService(this, "IndexerService", {
      cluster: props.cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
    });
    props.rds.connections.allowFrom(this.service, Port.tcp(5432), "Allow Indexer ECS service to access Postgres");
  }
}
