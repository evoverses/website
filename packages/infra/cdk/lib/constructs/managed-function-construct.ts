import { CustomResource, Duration } from "aws-cdk-lib";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, type NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { join } from "node:path";
import type { SetRequired } from "type-fest";
import { CConstruct, type CConstructProps } from "../../models/c-construct";

interface ManagedFunctionConstructProps extends CConstructProps {
  function: SetRequired<NodejsFunctionProps, "entry" | "vpc">;
  resourceProperties?: Record<string, any>;
}

export class ManagedFunctionConstruct extends CConstruct {
  public readonly fn: NodejsFunction;
  public readonly provider: Provider;

  constructor(scope: Construct, id: string, props: ManagedFunctionConstructProps) {
    super(scope, id);

    const projectRoot = this.getContext("projectRoot");
    const lambdaPath = this.getContext("lambdaPath");

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
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      ...props.function,
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
