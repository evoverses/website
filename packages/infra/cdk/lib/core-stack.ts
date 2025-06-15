import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Key } from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";
import { CStack, type CStackProps } from "../models/c-stack";

interface CoreStackProps extends CStackProps {
  squidRepository: Repository;
}

export class CoreStack extends CStack {
  vpc: Vpc;
  kmsKey: Key;

  constructor(scope: Construct, id: string, props: CoreStackProps) {
    super(scope, id, props);
    const stage = this.getContext("stage");
    this.vpc = new Vpc(this, `Vpc`, {
      vpcName: `${stage}-infra-vpc`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { cidrMask: 24, name: "public", subnetType: SubnetType.PUBLIC },
        { cidrMask: 24, name: "private-egress", subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      ],
    });

    this.kmsKey = new Key(this, "KmsKey", {
      alias: `alias/master/${stage}`,
      pendingWindow: Duration.days(7),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    //const alb = new ApplicationLoadBalancer(this, "ApiALB", {
    //  vpc,
    //  internetFacing: true,
    //});
//
    //const listener = alb.addListener("HttpsListener", {
    //  port: 443,
    //  protocol: ApplicationProtocol.HTTPS,
    //  certificates: [ cert ],
    //  defaultAction: ListenerAction.fixedResponse(404),
    //});
//
    //new ARecord(this, "ApiAliasRecord", {
    //  zone,
    //  target: RecordTarget.fromAlias(new LoadBalancerTarget(alb)),
    //});
//

//
    //listener.addTargets("GraphqlTargets", {
    //  priority: 1,
    //  conditions: [ ListenerCondition.pathPatterns([ "/graphql" ]) ],
    //  port: 4350,
    //  protocol: ApplicationProtocol.HTTP,
    //  targets: [ graphqlTask.service ],
    //  healthCheck: { path: "/health" },
    //});
//
    //graphqlTask.service.connections.allowFrom(
    //  listener,
    //  Port.tcp(4350),
    //  "Allow ALB to reach GraphQL ECS",
    //);

  }
}
