import { type EntityClass, type FindManyOptions, Store } from "@subsquid/typeorm-store";
import assert from "assert";
import { DataSource, EntityManager, type FindOneOptions, type FindOptionsWhere, In } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { splitIntoBatches } from "../utils";
import type { Entity } from "./entity-manager";

export class CustomStore extends Store {
  private readonly dataSource: DataSource;

  constructor(ds: DataSource) {
    super(() => new EntityManager(ds));
    this.dataSource = ds;
  }

  ds<E extends Entity>(entityClass: EntityClass<E>) {
    return this.dataSource.getRepository(entityClass);
  }

  count<E extends Entity>(entityClass: EntityClass<E>, options?: FindManyOptions<E>): Promise<number> {
    return this.ds(entityClass).count(options);
  }

  countBy<E extends Entity>(
    entityClass: EntityClass<E>,
    where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
  ): Promise<number> {
    return this.ds(entityClass).countBy(where);
  }

  find<E extends Entity>(entityClass: EntityClass<E>, options?: FindManyOptions<E>): Promise<E[]> {
    return this.ds(entityClass).find(options);
  }

  findBy<E extends Entity>(
    entityClass: EntityClass<E>,
    where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
  ): Promise<E[]> {
    return this.ds(entityClass).findBy(where);
  }

  async findOne<E extends Entity>(entityClass: EntityClass<E>, options: FindOneOptions<E>): Promise<E | undefined> {
    const result = await this.ds(entityClass).findOne(options);
    return result ?? undefined;
  }

  async findOneBy<E extends Entity>(
    entityClass: EntityClass<E>,
    where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
  ): Promise<E | undefined> {
    const result = await this.ds(entityClass).findOneBy(where);
    return result ?? undefined;
  }

  findOneByOrFail<E extends Entity>(
    entityClass: EntityClass<E>,
    where: FindOptionsWhere<E> | FindOptionsWhere<E>[],
  ): Promise<E> {
    return this.ds(entityClass).findOneByOrFail(where);
  }

  findOneOrFail<E extends Entity>(entityClass: EntityClass<E>, options: FindOneOptions<E>): Promise<E> {
    return this.ds(entityClass).findOneOrFail(options);
  }

  get<E extends Entity>(entityClass: EntityClass<E>, optionsOrId: FindOneOptions<E> | string): Promise<E | undefined> {
    return this.findOne<E>(entityClass, typeof optionsOrId === "string"
      ? { where: { id: optionsOrId } } as FindOneOptions<E>
      : optionsOrId);
  }

  insert<E extends Entity>(entity: E): Promise<void>;
  insert<E extends Entity>(entities: E[]): Promise<void>;
  async insert<E extends Entity>(e: E | E[]): Promise<void> {
    if (Array.isArray(e)) {
      if (e.length === 0) {
        return;
      }
      let entityClass = e[0]!.constructor as EntityClass<E>;
      for (let i = 1; i < e.length; i++) {
        assert(entityClass === e[i]?.constructor, "mass saving allowed only for entities of the same class");
      }
      for (let b of splitIntoBatches(e, 1000)) {
        await this.ds(entityClass).insert(b as QueryDeepPartialEntity<E>[]);
      }
    } else {
      let entityClass = e.constructor as EntityClass<E>;
      await this.ds(entityClass).insert(e as QueryDeepPartialEntity<E>);
    }
  }

  remove<E extends Entity>(entity: E): Promise<void>;
  remove<E extends Entity>(entities: E[]): Promise<void>;
  remove<E extends Entity>(entityClass: EntityClass<E>, id: string | string[]): Promise<void>;
  async remove<E extends Entity>(e: E | E[] | EntityClass<E>, id?: string | string[]): Promise<void> {
    if (id == null) {
      if (Array.isArray(e)) {
        if (e.length === 0) {
          return;
        }
        let entityClass = e[0]!.constructor as EntityClass<E>;
        for (let i = 1; i < e.length; i++) {
          assert(entityClass === e[i]!.constructor, "mass deletion allowed only for entities of the same class");
        }
        let ids = e.map(i => i.id);
        await this.ds(entityClass).delete({ id: In(ids) } as FindOptionsWhere<E>);
      } else {
        let entity = e as E;
        let entityClass = entity.constructor as EntityClass<E>;
        await this.ds(entityClass).delete({ id });
      }
    } else {
      let entityClass = e as EntityClass<E>;
      await this.ds(entityClass).delete({ id: Array.isArray(id) ? In(id) : id } as FindOptionsWhere<E>);
    }
  }

  save<E extends Entity>(entity: E): Promise<void>;
  save<E extends Entity>(entities: E[]): Promise<void>;
  save<E extends Entity>(e: E | E[]): Promise<void> {
    if (Array.isArray(e)) { // please the compiler
      return this.upsert(e);
    } else {
      return this.upsert(e);
    }
  }

  upsert<E extends Entity>(entity: E): Promise<void>;
  upsert<E extends Entity>(entities: E[]): Promise<void>;
  async upsert<E extends Entity>(e: E | E[]): Promise<void> {
    if (Array.isArray(e)) {
      if (e.length === 0) {
        return;
      }
      let entityClass = e[0]!.constructor as EntityClass<E>;
      for (let i = 1; i < e.length; i++) {
        assert(entityClass === e[i]!.constructor, "mass saving allowed only for entities of the same class");
      }
      await this.ds(entityClass).upsert(e as QueryDeepPartialEntity<E>[], [ "id" ]);
    } else {
      let entityClass = e.constructor as EntityClass<E>;
      await this.ds(entityClass).upsert(e as QueryDeepPartialEntity<E>, [ "id" ]);
    }
  }
}
