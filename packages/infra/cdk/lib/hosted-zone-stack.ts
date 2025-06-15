import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { CStack, type CStackProps } from "../models/c-stack";

interface HostedZoneStackProps extends CStackProps {

}

export class HostedZoneStack extends CStack {
  public readonly zone: HostedZone;
  public readonly cert: Certificate;

  constructor(scope: Construct, id: string, props?: HostedZoneStackProps) {
    super(scope, id, props);

    const domainName = this.getContext("domainName");
    this.zone = new HostedZone(this, "HostedZone", {
      zoneName: domainName,
      comment: `Hosted zone for ${domainName}`,
    });

    this.cert = new Certificate(this, "Cert", {
      domainName,
      validation: CertificateValidation.fromDns(this.zone),
    });

  }
}
