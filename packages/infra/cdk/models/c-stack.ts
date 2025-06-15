import { Stack, type StackProps, ValidationError } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface CStackProps extends StackProps {

}

export class CStack extends Stack {
  constructor(scope: Construct, id: string, props?: CStackProps) {
    super(scope, id, props);
  }

  private _idPrefix: string = "";

  protected get idPrefix() {
    return this._idPrefix;
  }

  protected set idPrefix(value: string) {
    this._idPrefix = value;
  }

  protected getContext<T = string>(key: string, fallback?: T): T {
    const value = this.node.tryGetContext(key) ?? fallback;
    if (!value) {
      throw new ValidationError(`No context value for ${key}`, this);
    }
    return value;
  }

  protected toPrefixedId(id: string) {
    return `${this.idPrefix}${id}`;
  }
}
