import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import type { Repository } from "aws-cdk-lib/aws-ecr";
import {
  type Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
  Secret as ECSSecret,
} from "aws-cdk-lib/aws-ecs";
import type { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { CStack, type CStackProps } from "../../../models/c-stack";

interface EcsTaskStackProps extends CStackProps {
  cluster: Cluster;
  userSecret: Secret;
  containerRepository: Repository;
  dbHost: string;
  additionalSecurityGroups: SecurityGroup[];
  vpc: Vpc;
}

export class EcsGraphQlTaskStack extends CStack {
  public readonly task: FargateTaskDefinition;
  public readonly service: FargateService;
  public readonly sg: SecurityGroup;

  constructor(scope: Construct, id: `${string}EcsTaskStack`, props: EcsTaskStackProps) {
    super(scope, id, props);
    this.idPrefix = id.replace("EcsTaskStack", "");
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

    this.sg = new SecurityGroup(this, this.toPrefixedId("Sg"), {
      allowAllOutbound: true,
      vpc: props.vpc,
    });

    this.service = new FargateService(this, this.toPrefixedId("Service"), {
      cluster: props.cluster,
      taskDefinition: this.task,
      assignPublicIp: false,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      desiredCount: 1,
      serviceName: "graphql",
      cloudMapOptions: {
        name: "graphql",
      },
      securityGroups: [ this.sg, ...props.additionalSecurityGroups ],
    });

  }
}
