import type { Vpc } from "aws-cdk-lib/aws-ec2";
import type { Repository } from "aws-cdk-lib/aws-ecr";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import type { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { CStack, type CStackProps } from "../../models/c-stack";
import type { EcsTaskStack } from "../../models/ecs-task-stack";
import { EcsGraphQlTaskStack } from "./tasks/graphql-task-stack";
import { EcsIndexerTaskStack } from "./tasks/indexer-task";

interface EcsStackProps extends CStackProps {
  vpc: Vpc;
  containerRepository: Repository;
  secrets: Record<"graphql" | "indexer", Secret>;
  dbHost: string;
}

export class EcsStack extends CStack {
  public readonly tasks: Record<"graphql" | "indexer", EcsTaskStack> = {} as any;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);
    const cluster = new Cluster(this, "EcsCluster", {
      clusterName: `infra-cluster`,
      vpc: props.vpc,
    });

    this.tasks.graphql = new EcsGraphQlTaskStack(this, "GraphqlEcsTaskStack", {
      containerRepository: props.containerRepository,
      cluster,
      userSecret: props.secrets.graphql,
      dbHost: props.dbHost,
    });
    this.tasks.indexer = new EcsIndexerTaskStack(this, "IndexerEcsTaskStack", {
      containerRepository: props.containerRepository,
      cluster,
      userSecret: props.secrets.indexer,
      dbHost: props.dbHost,
    });
  }
}
