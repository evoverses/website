import { ValidationError } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface CConstructProps {

}

export class CConstruct extends Construct {

  constructor(scope: Construct, id: string, props?: CConstructProps) {
    super(scope, id);
  }

  protected getContext<T = string>(key: string, fallback?: T): T {
    const value = this.node.tryGetContext(key) ?? fallback;
    if (!value) {
      throw new ValidationError(`No context value for ${key}`, this);
    }
    return value;
  }

  protected toPrefixedId(id: string) {
    return `${this.node.id.replace("Construct", "")}${id}`;
  }
}
