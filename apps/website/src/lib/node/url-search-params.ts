export class UrlSearchParams {
  private readonly sp: URLSearchParams;

  constructor(init?: ConstructorParameters<typeof URLSearchParams>[0]) {
    this.sp = new URLSearchParams(init);
  }

  get size(): number {
    return this.sp.size;
  }

  static fromDynamicRecord(record?: Record<string, string | string[] | undefined> | string): UrlSearchParams {
    if (typeof record === "string") {
      return new UrlSearchParams(record);
    }

    const sp = new UrlSearchParams();
    if (record) {
      for (const [ key, value ] of Object.entries(record)) {
        if (value) {
          sp.set(key, value);
        }
      }
    }
    return sp;
  }

  get<T = string>(key: string): T | undefined {
    return this.sp.get(key) as T || undefined;
  }

  getAll<T = string>(key: string): T[] {
    return this.sp.getAll(key) as T[];
  }

  getMinMax<T = string>(key: string): { min?: T, max?: T } {
    const v = {} as { min?: T, max?: T };
    const min = this.get(`min${key}`);
    const max = this.get(`max${key}`);
    if (min) {
      v.min = min as T;
    }
    if (max) {
      v.max = max as T;
    }
    return v;
  }

  set(key: string, value: string): void;

  set(key: string, values: string[]): void;

  set(key: string, values: string | string[]): void;

  set(key: string, value: string | string[]): void {
    if (Array.isArray(value)) {
      this.sp.delete(key);
      value.forEach((v) => this.sp.append(key, v));
    } else {
      this.sp.set(key, value);
    }
  }

  toString(): string {
    return this.sp.toString();
  }

  delete(key: string): void {
    this.sp.delete(key);
  }

  append(name: string, value: string): void {
    this.sp.append(name, value);
  }

  keys() {
    return this.sp.keys();
  }

  has(key: string) {
    return this.sp.has(key);
  }

  values() {
    return this.sp.values();
  }

  entries() {
    return this.sp.entries();
  }

  forEach(callbackfn: (value: string, key: string, parent: UrlSearchParams) => void, thisArg?: any): void {
    const wrappedCallback = (value: string, key: string, _parent: URLSearchParams) => {
      callbackfn.call(thisArg, value, key, this);
    };
    return this.sp.forEach(wrappedCallback, thisArg);
  }

  sort(): void {
    return this.sp.sort();
  }

  [Symbol.iterator](): IterableIterator<[ string, string ]> {
    return this.sp[Symbol.iterator]();
  }
}
