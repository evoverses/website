import { Stage, type StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { stageContext } from "../context";
import { AlbStack } from "./alb-stack";
import { ApiGatewayStack } from "./api-gateway-stack";
import { CoreStack } from "./core-stack";
import { DatabaseStack } from "./database/database-stack";
import { EcrStack } from "./ecr-stack";
import { EcsStack } from "./ecs/ecs-stack";
import { HostedZoneStack } from "./hosted-zone-stack";
import { OpenIdConnectStack } from "./openid-connect-stack";

type AppStage = "dev" | "prod";

export class InfraStage extends Stage {
  constructor(scope: Construct, id: Capitalize<AppStage>, props?: StageProps) {
    super(scope, id, props);

    this.setAllContext(id.toLowerCase() as AppStage);

    const openIdConnectStack = new OpenIdConnectStack(this, "OpenIdConnectStack");

    const squidEcrStack = new EcrStack(this, "SquidEcrStack", {
      openIdConnectProviderArn: openIdConnectStack.providerArn,
    });

    const nextJsApiEcrStack = new EcrStack(this, "NextJsEcrStack", {
      openIdConnectProviderArn: openIdConnectStack.providerArn,
    });

    const coreStack = new CoreStack(this, "CoreStack", {
      squidRepository: squidEcrStack.repo,
    });

    const dbStack = new DatabaseStack(this, "DatabaseStack", {
      vpc: coreStack.vpc,
      kmsKey: coreStack.kmsKey,
    });

    const ecsStack = new EcsStack(this, "EcsStack", {
      vpc: coreStack.vpc,
      containerRepository: squidEcrStack.repo,
      graphQlSecret: dbStack.graphQlUserSecret,
      indexerSecret: dbStack.indexerUserSecret,
      dbHost: dbStack.rds.dbInstanceEndpointAddress,
      dbAccessSg: dbStack.rdsAccessSg,
    });

    const hostedZoneStack = new HostedZoneStack(this, "HostedZoneStack");

    const albStack = new AlbStack(this, "AlbStack", {
      vpc: coreStack.vpc,
      zone: hostedZoneStack.zone,
      graphqlService: ecsStack.graphQlTaskService,
      nextJsApiService: ecsStack.nextJsApiTaskService,
    });

    const apiGatewayStack = new ApiGatewayStack(this, "ApiGatewayStack", {
      albDnsName: albStack.dnsName,
      zone: hostedZoneStack.zone,
    });
  }

  private setAllContext(stage: AppStage) {
    this.node.setContext("stage", this.stageName.toLowerCase());
    Object.entries(stageContext[stage]).forEach(([ k, v ]) => {
      this.node.setContext(k, v);
    });
  }
}
