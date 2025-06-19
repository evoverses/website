import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { type Cluster, ContainerImage, FargateService, FargateTaskDefinition, LogDrivers } from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import { join } from "node:path";
import { CStack, type CStackProps } from "../../../models/c-stack";

interface NextJsApiEcsTaskStackProps extends CStackProps {
  cluster: Cluster;
  additionalSecurityGroups: SecurityGroup[];
  vpc: Vpc;
}

export class NextJsApiEcsTaskStack extends CStack {
  public readonly task: FargateTaskDefinition;
  public readonly service: FargateService;
  public readonly sg: SecurityGroup;

  constructor(scope: Construct, id: `${string}EcsTaskStack`, props: NextJsApiEcsTaskStackProps) {
    super(scope, id, props);
    this.idPrefix = id.replace("EcsTaskStack", "");
    this.task = new FargateTaskDefinition(this, this.toPrefixedId("TaskDef"), {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const projectRoot = this.getContext("projectRoot");
    this.task.addContainer(this.toPrefixedId("Container"), {
      containerName: "nextjs-api",
      image: ContainerImage.fromAsset(projectRoot, {
        platform: Platform.LINUX_AMD64,
        file: join("apps", "api", "Dockerfile"),
      }),
      logging: LogDrivers.awsLogs({ streamPrefix: "nextjs-api" }),
      portMappings: [ { containerPort: 3000 } ],
      environment: {
        NEXT_PUBLIC_EVOVERSES_GRAPHQL_URL: "http://graphql.internal:4350/graphql",
        NEXT_PUBLIC_BASE_API_IMAGE_URL: "https://imagedelivery.net/rnUCH_14xCvfZoyELQslRQ",
        NEXT_PUBLIC_API_IMAGE_SUFFIX: "public",
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
      serviceName: "nextjs-api",
      cloudMapOptions: {
        name: "nextjs-api",
      },
      securityGroups: [ this.sg, ...props.additionalSecurityGroups ],
    });
  }
}
