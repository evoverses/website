import { Port, type Vpc } from "aws-cdk-lib/aws-ec2";
import type { FargateService } from "aws-cdk-lib/aws-ecs";
import {
  ApplicationListener,
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ListenerAction,
  ListenerCondition,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { type HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { CStack, type CStackProps } from "../models/c-stack";

interface AlbStackProps extends CStackProps {
  vpc: Vpc;
  zone: HostedZone;
  graphqlService: FargateService;
  nextJsApiService: FargateService;
}

export class AlbStack extends CStack {
  public readonly alb: ApplicationLoadBalancer;
  public readonly listener: ApplicationListener;
  public readonly dnsName: string;

  constructor(scope: Construct, id: string, props: AlbStackProps) {
    super(scope, id, props);

    this.alb = new ApplicationLoadBalancer(this, "ApiALB", {
      vpc: props.vpc,
      internetFacing: true,
    });
    this.dnsName = this.alb.loadBalancerDnsName;
    this.listener = this.alb.addListener("HttpsListener", {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      defaultAction: ListenerAction.fixedResponse(404),
    });

    this.listener.addTargets("GraphqlTargets", {
      priority: 1,
      conditions: [ ListenerCondition.pathPatterns([ "/graphql" ]) ],
      port: 4350,
      protocol: ApplicationProtocol.HTTP,
      targets: [ props.graphqlService ],
      healthCheck: { path: "/health" },
    });

    this.listener.addTargets("NextJsTargets", {
      priority: 2,
      conditions: [ ListenerCondition.pathPatterns([ "/metadata/*" ]) ],
      port: 3000,
      protocol: ApplicationProtocol.HTTP,
      targets: [ props.nextJsApiService ],
      healthCheck: { path: "/health" },
    });

    props.graphqlService.connections.allowFrom(
      this.listener,
      Port.tcp(4350),
      "Allow ALB to reach GraphQL ECS",
    );

    props.nextJsApiService.connections.allowFrom(
      this.listener,
      Port.tcp(3000),
      "Allow ALB to reach NextJs Api ECS",
    );
  }
}
