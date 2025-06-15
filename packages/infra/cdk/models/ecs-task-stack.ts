import type { Repository } from "aws-cdk-lib/aws-ecr";
import { type Cluster, FargateService, FargateTaskDefinition } from "aws-cdk-lib/aws-ecs";
import type { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { CStack, type CStackProps } from "./c-stack";

export type EcsTaskStackId = `${string}EcsTaskStack`;

export interface EcsTaskStackProps extends CStackProps {
  cluster: Cluster;
  userSecret: Secret;
  dbHost: string;
  containerRepository: Repository;
}

export class EcsTaskStack extends CStack {
  public task: FargateTaskDefinition;
  public service: FargateService;

  constructor(scope: Construct, id: EcsTaskStackId, props: EcsTaskStackProps) {
    super(scope, id, props);
  }

  protected get idPrefix() {
    return this.node.id.replace("EcsTaskStack", "");
  }

  protected toPrefixedId(id: string) {
    return `${this.idPrefix}${id}`;
  }
}
