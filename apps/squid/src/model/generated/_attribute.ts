import assert from "assert";
import * as marshal from "./marshal";

export class Attribute {
  private _traitType!: string;
  private _value!: string;
  private _displayType!: string | undefined | null;

  constructor(props?: Partial<Omit<Attribute, "toJSON">>, json?: any) {
    Object.assign(this, props);
    if (json != null) {
      this._traitType = marshal.string.fromJSON(json.traitType);
      this._value = marshal.string.fromJSON(json.value);
      this._displayType = json.displayType == null ? undefined : marshal.string.fromJSON(json.displayType);
    }
  }

  get traitType(): string {
    assert(this._traitType != null, "uninitialized access");
    return this._traitType;
  }

  set traitType(value: string) {
    this._traitType = value;
  }

  get value(): string {
    assert(this._value != null, "uninitialized access");
    return this._value;
  }

  set value(value: string) {
    this._value = value;
  }

  get displayType(): string | undefined | null {
    return this._displayType;
  }

  set displayType(value: string | undefined | null) {
    this._displayType = value;
  }

  toJSON(): object {
    return {
      traitType: this.traitType,
      value: this.value,
      displayType: this.displayType,
    };
  }
}
