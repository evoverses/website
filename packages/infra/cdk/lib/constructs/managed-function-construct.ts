import { CustomResource, Duration, RemovalPolicy } from "aws-cdk-lib";
import { SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, type NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { join } from "node:path";
import type { SetRequired } from "type-fest";
import { CConstruct, type CConstructProps } from "../../models/c-construct";

interface ManagedFunctionConstructProps extends CConstructProps {
  functionProps: SetRequired<NodejsFunctionProps, "entry" | "vpc">;
  resourceProperties?: Record<string, any>;
}

export class ManagedFunctionConstruct extends CConstruct {
  public readonly fn: NodejsFunction;
  public readonly provider: Provider;
  public readonly sg: SecurityGroup;

  constructor(scope: Construct, id: string, props: ManagedFunctionConstructProps) {
    super(scope, id);
    const { securityGroups: sgs = [], vpc, ...functionProps } = props.functionProps;

    const projectRoot = this.getContext("projectRoot");
    const lambdaPath = this.getContext("lambdaPath");

    this.sg = new SecurityGroup(this, this.toPrefixedId("Sg"), {
      allowAllOutbound: true,
      vpc,
    });

    this.fn = new NodejsFunction(this, this.toPrefixedId("Fn"), {
      projectRoot,
      bundling: {
        tsconfig: join(lambdaPath, "tsconfig.json"),
        externalModules: [],
        minify: true,
        nodeModules: [ "pg-format" ],
      },
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(15),
      memorySize: 128,
      retryAttempts: 0,
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [ this.sg, ...sgs ],
      ...functionProps,
      logGroup: new LogGroup(this, this.toPrefixedId("LogGroup"), {
        logGroupName: `/aws/lambda/${this.idPrefix}`,
        retention: RetentionDays.ONE_WEEK, // or whatever you want
        removalPolicy: RemovalPolicy.DESTROY,
      }),
    });

    this.provider = new Provider(this, this.toPrefixedId("FnProvider"), {
      onEventHandler: this.fn,
    });

    if (props.resourceProperties) {
      new CustomResource(this, this.toPrefixedId("Resource"), {
        serviceToken: this.provider.serviceToken,
        properties: props.resourceProperties,
      });
    }
  }
}
