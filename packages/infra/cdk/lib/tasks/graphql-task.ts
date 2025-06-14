import { Port, SubnetType } from "aws-cdk-lib/aws-ec2";
import {
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  Secret as ECSSecret,
} from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import type { EcsTaskProps } from "../interfaces";

export class EcsGraphqlTask extends Construct {
  service: FargateService;

  constructor(scope: Construct, id: string, props: EcsTaskProps) {
    super(scope, id);

    const taskDef = new FargateTaskDefinition(this, "GraphqlTaskDef", {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    props.userSecret.grantRead(taskDef.taskRole);

    taskDef.addContainer("GraphqlContainer", {
      containerName: "graphql",
      image: ContainerImage.fromEcrRepository(props.repo, "dev"),
      logging: LogDrivers.awsLogs({ streamPrefix: "graphql" }),
      portMappings: [ { containerPort: 4350 } ],
      command: [ "serve:prod" ],
      environment: {
        NODE_ENV: "production",
        GQL_PORT: "4350",
        DB_HOST: props.rds.dbInstanceEndpointAddress,
        DB_PORT: props.rds.dbInstanceEndpointPort,
        DB_NAME: props.dbName,
        DB_SSL: "true",
      },
      secrets: {
        DB_USER: ECSSecret.fromSecretsManager(props.userSecret, "username"),
        DB_PASS: ECSSecret.fromSecretsManager(props.userSecret, "password"),
      },
    });

    this.service = new FargateService(this, "GraphqlService", {
      cluster: props.cluster,
      taskDefinition: taskDef,
      assignPublicIp: false,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      desiredCount: 1,
    });

    props.rds.connections.allowFrom(this.service, Port.tcp(5432), "Allow Graphql ECS service to access Postgres");
  }
}
