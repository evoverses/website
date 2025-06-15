import { SubnetType } from "aws-cdk-lib/aws-ec2";
import {
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  Secret as ECSSecret,
} from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import { EcsTaskStack, type EcsTaskStackId, type EcsTaskStackProps } from "../../../models/ecs-task-stack";

export class EcsGraphQlTaskStack extends EcsTaskStack {

  constructor(scope: Construct, id: EcsTaskStackId, props: EcsTaskStackProps) {
    super(scope, id, props);

    this.task = new FargateTaskDefinition(this, this.toPrefixedId("TaskDef"), {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    props.userSecret.grantRead(this.task.taskRole);

    const dbName = this.getContext("dbName");

    this.task.addContainer(this.toPrefixedId("Container"), {
      containerName: "graphql",
      image: ContainerImage.fromEcrRepository(props.containerRepository, "dev"),
      logging: LogDrivers.awsLogs({ streamPrefix: "graphql" }),
      portMappings: [ { containerPort: 4350 } ],
      command: [ "serve:prod" ],
      environment: {
        NODE_ENV: "production",
        GQL_PORT: "4350",
        DB_HOST: props.dbHost,
        DB_PORT: "5432",
        DB_NAME: dbName,
        DB_SSL: "true",
      },
      secrets: {
        DB_USER: ECSSecret.fromSecretsManager(props.userSecret, "username"),
        DB_PASS: ECSSecret.fromSecretsManager(props.userSecret, "password"),
      },
    });

    this.service = new FargateService(this, this.toPrefixedId("Service"), {
      cluster: props.cluster,
      taskDefinition: this.task,
      assignPublicIp: false,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      desiredCount: 1,
    });

  }
}
