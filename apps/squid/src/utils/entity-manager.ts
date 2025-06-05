// noinspection JSUnusedGlobalSymbols

import { assertNotNull } from "@subsquid/evm-processor";
import { Logger } from "@subsquid/logger";
import { type FindManyOptions, type FindOneOptions, Store } from "@subsquid/typeorm-store";
import assert from "assert";
import { In } from "typeorm";
import { pluralize, splitIntoBatches } from ".";
import { Chain } from "../model";
import type { Arrayable, Nullable, Prop, PropType } from "../types/shared";
import { Context } from "./context";

export interface Entity {
  id: string;
}

export interface EntityClass<T extends Entity> {
  new(): T;
}

export class EntityManager {
  private deferredIds = new Map<EntityClass<Entity>, Set<string>>();
  private cache = new Map<EntityClass<any>, Map<string, any>>();
  private log: Logger;
  private readonly normalizeId: boolean = true;

  constructor(private store: Store, public readonly chain: Chain, log: Logger, opts: { normalizeId?: boolean } = {}) {
    this.log = log.child("entity-manager", { chainId: chain.id });
    if (opts.normalizeId !== undefined) {
      this.normalizeId = opts.normalizeId;
    }
  }

  toId(...parts: (string | number | bigint)[]) {
    const id = parts.map(String).join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return (
      !this.normalizeId || id.startsWith(`${this.chain.id}-`)
    ) ? id : `${this.chain.id}-${id}`;
  }

  defer<T extends Entity>(entity: EntityClass<T>, ...ids: string[]) {
    let set = this.deferredIds.get(entity);
    if (set == null) {
      set = new Set();
      this.deferredIds.set(entity, set);
    }

    let cache = this.getCache(entity);
    for (const id of ids) {
      if (!cache.has(this.toId(id))) {
        set.add(this.toId(id));
      }
    }
    return this;
  }

  deferRaw<T extends Entity>(entity: EntityClass<T>, ...ids: string[]) {
    let set = this.deferredIds.get(entity);
    if (set == null) {
      set = new Set();
      this.deferredIds.set(entity, set);
    }

    let cache = this.getCache(entity);
    for (const id of ids) {
      if (!cache.has(id)) {
        set.add(id);
      }
    }
    return this;
  }

  deferCount<T extends Entity>(entity: EntityClass<T>) {
    return this.deferredIds.get(entity)?.size || 0;
  }

  async load<T extends Entity = Entity>(entity: EntityClass<T>) {
    const fetched = new Map<string, T>();

    const cache = this.getCache(entity);

    const ids = this.deferredIds.get(entity);
    if (!ids || ids.size === 0) {
      return fetched;
    }

    for (const idBatch of splitIntoBatches([ ...ids ], 1_000)) {
      await this.store.findBy<Entity>(entity, { id: In(idBatch) })
        .then(es => es.forEach((e) => {
            cache.set(e.id, e);
            fetched.set(e.id, e as T);
          }),
        );
    }
    ids.clear();

    return fetched;
  }

  async loadMany(...entities: EntityClass<Entity>[]) {
    for (const entity of entities) {
      await this.load(entity);
    }
  }

  get<T extends Entity>(
    entity: EntityClass<T>,
    id: string,
  ): Promise<T | undefined>;
  get<T extends Entity>(
    entity: EntityClass<T>,
    id: string,
    search: false,
  ): T | undefined;
  get<T extends Entity>(
    entity: EntityClass<T>,
    id: string,
    search = true,
  ): Promise<T | undefined> | (T | undefined) {
    const cache = this.getCache(entity);
    let value = cache.get(this.toId(id));
    if (search) {
      return value == null ? this.store.get(entity, this.toId(id)).then((e) => {
        if (e) {
          cache.set(e.id, e);
        }
        return e;
      }) : new Promise((resolve) => resolve(value));
    } else {
      return value;
    }
  }

  getByProperty<T extends Entity>(entity: EntityClass<T>, property: Prop<T>, value: PropType<T>[], search: false): T[];
  getByProperty<T extends Entity>(entity: EntityClass<T>, property: Prop<T>, value: PropType<T>[]): Promise<T[]>;
  getByProperty<T extends Entity>(entity: EntityClass<T>, property: Prop<T>, value: PropType<T>): Promise<Nullable<T>>;
  getByProperty<T extends Entity>(
    entity: EntityClass<T>,
    property: Prop<T>,
    value: PropType<T>,
    search: false,
  ): Nullable<T>;
  getByProperty<T extends Entity>(
    entityClass: EntityClass<T>,
    property: Prop<T>,
    value: Arrayable<PropType<T>>,
    search = true,
  ): T[] | Promise<T[]> | Promise<Nullable<T>> | Nullable<T> {
    const cachedEntities = this.values(entityClass);
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return [];
      }
      const loadedEntities = cachedEntities.filter(e => value.includes(e[property]));
      if (search) {
        const loadedProperties = loadedEntities.map(e => e[property]);
        const missingProperties = value.filter(v => loadedProperties.includes(v));
        return this.find(entityClass, { where: { [property]: In(missingProperties) } } as FindManyOptions<T>)
          .then(entities => {
            const map = new Map<string, T>();
            for (let entity of loadedEntities) {
              map.set(entity.id, entity);
            }
            for (let entity of entities) {
              map.set(entity.id, entity);
            }
            return [ ...map.values() ];
          })
          .catch(e => {
            this.log.error(`Error in getByProperty: ${e}`);
            return loadedEntities;
          });
      } else {
        return loadedEntities;
      }
    } else {
      const entity = cachedEntities.find(e => e[property] === value);
      if (search) {
        if (entity) {
          return entity;
        } else {
          return this.store.findOne(entityClass, { where: { [property]: value } } as FindOneOptions<T>)
            .then(v => v ?? null)
            .catch(v => null);
        }
      } else {
        return entity ?? null;
      }
    }
  }

  getByPropertyOrFail<T extends Entity>(
    entity: EntityClass<T>,
    property: Prop<T>,
    value: PropType<T>[],
    search: false,
  ): T[];
  getByPropertyOrFail<T extends Entity>(entity: EntityClass<T>, property: Prop<T>, value: PropType<T>[]): Promise<T[]>;
  getByPropertyOrFail<T extends Entity>(entity: EntityClass<T>, property: Prop<T>, value: PropType<T>): Promise<T>;
  getByPropertyOrFail<T extends Entity>(
    entity: EntityClass<T>,
    property: Prop<T>,
    value: PropType<T>,
    search: false,
  ): T;
  getByPropertyOrFail<T extends Entity>(
    entityClass: EntityClass<T>,
    property: Prop<T>,
    value: Arrayable<PropType<T>>,
    search = true,
  ): T[] | T | Promise<T[]> | Promise<T> {

    if (Array.isArray(value)) {
      if (search) {
        return this.getByProperty(entityClass, property, value).then(val => {
          assert(val.length >= value.length);
          return val;
        }) as Promise<T[]>;
      } else {
        return this.getByProperty(entityClass, property, value, false);
      }
    } else {
      if (search) {
        return this.getByProperty(entityClass, property, value).then(val => assertNotNull(val)) as Promise<T>;
      } else {
        return assertNotNull(this.getByProperty(entityClass, property, value, false));
      }
    }
  }

  async find<T extends Entity>(entity: EntityClass<T>, options: FindManyOptions<T>): Promise<T[]> {
    const results = await this.store.find(entity, options);
    for (const result of results) {
      this.getCache(entity).set(result.id, result);
    }
    return results;
  };

  getOrFail<T extends Entity>(entity: EntityClass<T>, id: string): Promise<T>;
  getOrFail<T extends Entity>(
    entity: EntityClass<T>,
    id: string,
    search: false,
  ): T;
  getOrFail<T extends Entity>(
    entity: EntityClass<T>,
    id: string,
    search = true,
  ): Promise<T> | T {
    if (search) {
      return this.get(entity, this.toId(id)).then((e) => assertNotNull(e));
    } else {
      return assertNotNull(this.get(entity, this.toId(id), search));
    }
  }

  add<T extends Entity>(entity: T) {
    this.getCache(entity.constructor as EntityClass<T>).set(entity.id, entity);
    return this;
  }

  values<T extends Entity>(entity: EntityClass<T>): T[] {
    return [ ...this.getCache(entity).values() ];
  }

  private getCache<T extends Entity>(entity: EntityClass<T>) {
    let value = this.cache.get(entity);
    if (value == null) {
      value = new Map();
      this.cache.set(entity, value);
    }
    return value;
  }

  async save(...entities: EntityClass<Entity>[]) {
    const batchSize = 10_000;
    for (const entity of entities) {
      const set = this.getCache(entity);
      if (set.size > 0) {
        const name = entity.toString().split(" ")[1];
        this.log.debug(`Saving ${set.size} ${name} ${pluralize(set.size, "entity", "entities")}`);
        for (let batch of splitIntoBatches([ ...set.values() ], batchSize)) {
          await this.store.upsert(batch);
        }
        set.clear();
      }
    }
  }

  clearCache() {
    this.cache.clear();
    this.deferredIds.clear();
  }
}

export class MultiChainEntityManager {
  private cache = new Map<string, EntityManager>();

  constructor(private store: Store, private log: Logger) {
  }

  async get(chainId: string): Promise<Context> {
    let em = this.cache.get(chainId);
    if (!em) {
      const chain = await this.store.findOne(Chain, { where: { id: String(chainId) } });
      if (!chain) {
        throw new Error(`Chain ${chainId} not found`);
      }
      em = new EntityManager(this.store, chain, this.log);
      this.cache.set(chainId, em);
    }
    return new Context(em, this.log);
  }
}

export type EntityConstructor<T> = {
  new(...args: any[]): T
}
