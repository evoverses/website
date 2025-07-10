import { ValidationError } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface CConstructProps {

}

export class CConstruct extends Construct {
  private _idPrefix: string = "";
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

  protected get idPrefix() {
    return this._idPrefix || this.node.id.replace("Construct", "");
  }

  protected set idPrefix(value: string) {
    this._idPrefix = value;
  }

  protected toPrefixedId(id: string) {
    return `${this.idPrefix}${id}`;
  }
}
