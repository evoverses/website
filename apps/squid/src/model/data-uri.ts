export class DataURI {
  public readonly mediaType: string;
  public readonly format: string;
  public readonly content: string;

  constructor(public readonly uri: string) {
    if (!uri.startsWith("data:")) {
      throw new Error("Invalid data URI");
    }
    const fci = uri.indexOf(",", 5);
    if (fci === -1) {
      throw new Error("Invalid data URI format");
    }
    const mediaTypeAndFormat = uri.slice(5, fci);
    const content = uri.slice(fci + 1);

    const [ mediaType, format ] = mediaTypeAndFormat.split(";");
    if (!mediaType || !format) {
      throw new Error("Invalid data URI mediaType/format");
    }
    this.mediaType = mediaType;
    this.format = format;
    this.content = content;
  }

  public jsonContent() {
    if (this.mediaType !== "application/json") {
      throw new Error("Content is not JSON");
    }
    if (this.format === "base64") {
      return JSON.parse(atob(this.content));
    } else if (/utf-?8/.test(this.format)) {
      return JSON.parse(this.content);
    } else {
      throw new Error(`Unsupported content format "${this.format}"`);
    }
  }
}
