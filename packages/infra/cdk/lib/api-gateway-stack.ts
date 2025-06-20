import { DomainName, HttpApi, MappingValue, ParameterMapping } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpUrlIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { HttpMethod } from "aws-cdk-lib/aws-events";
import { ARecord, type HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { CStack, type CStackProps } from "../models/c-stack";

interface ApiGatewayStackProps extends CStackProps {
  zone: HostedZone;
  albDnsName: string;
}

export class ApiGatewayStack extends CStack {
  public readonly api: HttpApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);
    const stage = this.getContext("stage");

    const domainName = this.getContext("domainName");

    const certificate = new Certificate(this, "Cert", {
      domainName,
      validation: CertificateValidation.fromDns(props.zone),
      certificateName: domainName,

    });

    const apiDomain = new DomainName(this, "Domain", {
      domainName,
      certificate,
    });

    this.api = new HttpApi(this, "HttpApi", {
      apiName: `${stage === "prod" ? "" : `${stage}-`}evoverses-api`,
      description: "API Gateway in front of ALB",
      defaultDomainMapping: {
        domainName: apiDomain,
      },
      createDefaultStage: true,
    });

    const albIntegration = new HttpUrlIntegration("albIntegration", `http://${props.albDnsName}`, {
      parameterMapping: new ParameterMapping()
        .overwritePath(MappingValue.requestPath())
        .appendHeader("x-original-path", MappingValue.requestPath()),
    });

    this.api.addRoutes({
      path: "/graphql",
      methods: [ HttpMethod.POST ],
      integration: albIntegration,
    });
    this.api.addRoutes({
      path: "/metadata/{proxy+}",
      methods: [ HttpMethod.GET ],
      integration: albIntegration,
    });

    new ARecord(this, "ApiAliasRecord", {
      zone: props.zone,
      recordName: domainName.replace(/\.$/, "") + ".",
      target: RecordTarget.fromAlias({
        bind: () => (
          {
            dnsName: apiDomain.regionalDomainName,
            hostedZoneId: apiDomain.regionalHostedZoneId,
          }
        ),
      }),
    });
  }
}
