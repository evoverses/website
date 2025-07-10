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
  }
}
