import { Port, type SecurityGroup, type Vpc } from "aws-cdk-lib/aws-ec2";
import type { Repository } from "aws-cdk-lib/aws-ecr";
import { Cluster, type FargateService } from "aws-cdk-lib/aws-ecs";
import type { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { CStack, type CStackProps } from "../../models/c-stack";
import { NextJsApiEcsTaskStack } from "./tasks/api-task-stack";
import { EcsGraphQlTaskStack } from "./tasks/graphql-task-stack";
import { EcsIndexerTaskStack } from "./tasks/indexer-task";

interface EcsStackProps extends CStackProps {
  vpc: Vpc;
  containerRepository: Repository;
  graphQlSecret: Secret;
  indexerSecret: Secret;
  dbHost: string;
  dbAccessSg: SecurityGroup;
}

export class EcsStack extends CStack {
  public readonly cluster: Cluster;
  public readonly graphQlTaskService: FargateService;
  public readonly nextJsApiTaskService: FargateService;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);
    const cluster = new Cluster(this, "EcsCluster", {
      clusterName: `infra-cluster`,
      vpc: props.vpc,
      defaultCloudMapNamespace: {
        name: "internal",
      },
    });
    this.cluster = cluster;

    const graphQlTask = new EcsGraphQlTaskStack(this, "GraphqlEcsTaskStack", {
      containerRepository: props.containerRepository,
      cluster,
      userSecret: props.graphQlSecret,
      dbHost: props.dbHost,
      additionalSecurityGroups: [ props.dbAccessSg ],
      vpc: props.vpc,
    });
    this.graphQlTaskService = graphQlTask.service;

    new EcsIndexerTaskStack(this, "IndexerEcsTaskStack", {
      containerRepository: props.containerRepository,
      cluster,
      userSecret: props.indexerSecret,
      dbHost: props.dbHost,
      additionalSecurityGroups: [ props.dbAccessSg ],
      vpc: props.vpc,
    });

    const apiTask = new NextJsApiEcsTaskStack(this, "NextJsApiEcsTaskStack", {
      cluster,
      additionalSecurityGroups: [],
      vpc: props.vpc,
    });
    this.nextJsApiTaskService = apiTask.service;
    graphQlTask.sg.addIngressRule(apiTask.sg, Port.tcp(4350), "Allow graphql access to api");
  }
}
