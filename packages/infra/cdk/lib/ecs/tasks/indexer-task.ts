import {
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  Secret as ECSSecret,
} from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import { EcsTaskStack, type EcsTaskStackId, type EcsTaskStackProps } from "../../../models/ecs-task-stack";

export class EcsIndexerTaskStack extends EcsTaskStack {

  constructor(scope: Construct, id: EcsTaskStackId, props: EcsTaskStackProps) {
    super(scope, id, props);

    this.task = new FargateTaskDefinition(this, "IndexerTaskDef", {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    props.userSecret.grantRead(this.task.taskRole);

    const dbName = this.getContext("dbName");

    this.task.addContainer("IndexerContainer", {
      image: ContainerImage.fromEcrRepository(props.containerRepository, "dev"),
      logging: LogDrivers.awsLogs({ streamPrefix: "indexer" }),
      command: [ "process:prod" ],
      environment: {
        NODE_ENV: "production",
        DB_HOST: props.dbHost,
        DB_PORT: "5432",
        DB_NAME: dbName,
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
      taskDefinition: this.task,
      desiredCount: 1,
    });
  }
}
