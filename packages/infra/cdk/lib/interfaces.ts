import type { Repository } from "aws-cdk-lib/aws-ecr";
import { type Cluster } from "aws-cdk-lib/aws-ecs";
import type { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import type { Secret } from "aws-cdk-lib/aws-secretsmanager";
import type { Context } from "../context";

export interface EcsTaskProps extends Context {
  cluster: Cluster;
  userSecret: Secret;
  rds: DatabaseInstance;
  repo: Repository;
}
