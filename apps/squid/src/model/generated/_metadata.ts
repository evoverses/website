import assert from "assert";
import * as marshal from "./marshal";
import { Attribute } from "./_attribute";

export class Metadata {
  private _name!: string | undefined | null;
  private _description!: string | undefined | null;
  private _image!: string | undefined | null;
  private _imageData!: string | undefined | null;
  private _externalUrl!: string | undefined | null;
  private _backgroundColor!: string | undefined | null;
  private _animationUrl!: string | undefined | null;
  private _youtubeUrl!: string | undefined | null;
  private _uri!: string;
  private _decoded!: unknown | undefined | null;
  private _attributes!: (Attribute)[] | undefined | null;

  constructor(props?: Partial<Omit<Metadata, "toJSON">>, json?: any) {
    Object.assign(this, props);
    if (json != null) {
      this._name = json.name == null ? undefined : marshal.string.fromJSON(json.name);
      this._description = json.description == null ? undefined : marshal.string.fromJSON(json.description);
      this._image = json.image == null ? undefined : marshal.string.fromJSON(json.image);
      this._imageData = json.imageData == null ? undefined : marshal.string.fromJSON(json.imageData);
      this._externalUrl = json.externalUrl == null ? undefined : marshal.string.fromJSON(json.externalUrl);
      this._backgroundColor = json.backgroundColor == null ? undefined : marshal.string.fromJSON(json.backgroundColor);
      this._animationUrl = json.animationUrl == null ? undefined : marshal.string.fromJSON(json.animationUrl);
      this._youtubeUrl = json.youtubeUrl == null ? undefined : marshal.string.fromJSON(json.youtubeUrl);
      this._uri = marshal.string.fromJSON(json.uri);
      this._decoded = json.decoded;
      this._attributes =
        json.attributes == null ? undefined : marshal.fromList(
          json.attributes,
          val => new Attribute(undefined, marshal.nonNull(val)),
        );
    }
  }

  get name(): string | undefined | null {
    return this._name;
  }

  set name(value: string | undefined | null) {
    this._name = value;
  }

  get description(): string | undefined | null {
    return this._description;
  }

  set description(value: string | undefined | null) {
    this._description = value;
  }

  get image(): string | undefined | null {
    return this._image;
  }

  set image(value: string | undefined | null) {
    this._image = value;
  }

  get imageData(): string | undefined | null {
    return this._imageData;
  }

  set imageData(value: string | undefined | null) {
    this._imageData = value;
  }

  get externalUrl(): string | undefined | null {
    return this._externalUrl;
  }

  set externalUrl(value: string | undefined | null) {
    this._externalUrl = value;
  }

  get backgroundColor(): string | undefined | null {
    return this._backgroundColor;
  }

  set backgroundColor(value: string | undefined | null) {
    this._backgroundColor = value;
  }

  get animationUrl(): string | undefined | null {
    return this._animationUrl;
  }

  set animationUrl(value: string | undefined | null) {
    this._animationUrl = value;
  }

  get youtubeUrl(): string | undefined | null {
    return this._youtubeUrl;
  }

  set youtubeUrl(value: string | undefined | null) {
    this._youtubeUrl = value;
  }

  get uri(): string {
    assert(this._uri != null, "uninitialized access");
    return this._uri;
  }

  set uri(value: string) {
    this._uri = value;
  }

  get decoded(): unknown | undefined | null {
    return this._decoded;
  }

  set decoded(value: unknown | undefined | null) {
    this._decoded = value;
  }

  get attributes(): (Attribute)[] | undefined | null {
    return this._attributes;
  }

  set attributes(value: (Attribute)[] | undefined | null) {
    this._attributes = value;
  }

  toJSON(): object {
    return {
      name: this.name,
      description: this.description,
      image: this.image,
      imageData: this.imageData,
      externalUrl: this.externalUrl,
      backgroundColor: this.backgroundColor,
      animationUrl: this.animationUrl,
      youtubeUrl: this.youtubeUrl,
      uri: this.uri,
      decoded: this.decoded,
      attributes: this.attributes == null ? undefined : this.attributes.map((val: any) => val.toJSON()),
    };
  }
}
