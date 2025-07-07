import {
  Repository,
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  FindOneOptions,
  EntityManager,
  FindOptionsRelations,
  ObjectLiteral,
} from 'typeorm';
import { PaginationRequestDTO } from './dtos/pagination-request.dto';
import { PaginationResponseDTO } from './dtos/pagination-response.dto';
import { getQueryPaginations } from './utils/pagination.util';
import { Optional } from './utils/optional.util';
import { MergeInto } from './interfaces/merge-into.interface';

export type Nullable<T> = T | null | undefined;

export type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

export type NestedStringKeys<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends string
    ? `${Prefix}${Extract<K, string>}`
    : T[K] extends object
      ? NestedStringKeys<T[K], `${Prefix}${Extract<K, string>}.`>
      : never;
}[keyof T];

export type PrimaryKeyField<Entity, PK> = Extract<
  {
    [K in keyof Entity]-?: NonNullable<Entity[K]> extends PK ? K : never;
  }[keyof Entity],
  string
>;

export type WhereOpts<Entity extends ObjectLiteral> = {
  where: NonNullable<FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]>;
  relations?: FindOptionsRelations<Entity>;
};

export type FindOpts<Entity extends ObjectLiteral> = Omit<
  FindOneOptions<Entity>,
  'where' | 'join'
> & {
  where: NonNullable<FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]>;
};

/**
 * Single primary-key lookup.
 */
export type FindByIdOpts<
  Entity extends ObjectLiteral,
  PK extends string | number,
> = {
  /** Value for the primary key field */
  primaryField: NonNullable<PK>;
  relations?: FindOptionsRelations<Entity>;
};

export class CrudService<
  Entity extends ObjectLiteral,
  PK extends string | number = number,
> {
  protected constructor(
    protected readonly repository: Repository<Entity>,
    protected readonly primaryField: PrimaryKeyField<Entity, PK>,
    protected readonly searchField?: NestedStringKeys<Entity>,
  ) {}

  private buildNestedWhere(path: string, value: any): object {
    const keys = path.split('.');
    return keys.reduceRight((acc, key) => ({ [key]: acc }), value);
  }

  async findMany(
    opts?: FindOneOptions<Entity>,
    transactionManager?: EntityManager,
  ): Promise<Entity[]> {
    return (
      transactionManager?.getRepository(this.repository.target) ??
      this.repository
    ).find(opts);
  }

  /**
   * Retrieves entities.
   * Override or extend this method in your subclass if additional search logic is needed.
   */
  async findWithPagination<
    T extends PaginationRequestDTO = PaginationRequestDTO,
  >(
    request: T,
    opts: FindOpts<Entity> = { where: {} },
    transactionManager?: EntityManager,
  ): Promise<PaginationResponseDTO<Entity>> {
    const { limit, offset, search = '' } = getQueryPaginations(request);

    if (search && this.searchField) {
      const ilikeCondition = ILike(`%${search}%`);
      const searchCondition = this.buildNestedWhere(
        this.searchField,
        ilikeCondition,
      );

      opts.where = Array.isArray(opts.where)
        ? opts.where.map((obj) => ({ ...obj, ...searchCondition }))
        : { ...opts.where, ...searchCondition };
    }

    const options: FindManyOptions<Entity> = {
      ...opts,
      skip: offset,
      take: limit,
    };

    const [entities, count] = await (
      transactionManager?.getRepository(this.repository.target) ??
      this.repository
    ).findAndCount(options);
    return new PaginationResponseDTO(request, entities, count);
  }

  /**
   * Checks entity by the given options and returns whether it's exists or not.
   */
  async existsBy(
    opts: WhereOpts<Entity>,
    transactionManager?: EntityManager,
  ): Promise<boolean> {
    return (
      transactionManager?.getRepository(this.repository.target) ??
      this.repository
    ).exists(opts);
  }

  /**
   * Count entity by the given options.
   */
  async countBy(
    opts: WhereOpts<Entity>,
    transactionManager?: EntityManager,
  ): Promise<number> {
    return (
      transactionManager?.getRepository(this.repository.target) ??
      this.repository
    ).count(opts);
  }

  /**
   * Retrieves an entity by primary field.
   */
  findOne(
    opts: FindByIdOpts<Entity, PK>,
    transactionManager?: EntityManager,
  ): Promise<Optional<Entity>>;

  /**
   * Retrieves an entity by options.
   */
  findOne(
    opts: FindOpts<Entity>,
    transactionManager?: EntityManager,
  ): Promise<Optional<Entity>>;

  /**
   * Retrieves an entity by options or primary field.
   */
  async findOne(
    opts: FindByIdOpts<Entity, PK> | FindOpts<Entity>,
    transactionManager?: EntityManager,
  ): Promise<Optional<Entity>> {
    if ('primaryField' in opts) {
      const { primaryField, relations } = opts;

      const where: FindOptionsWhere<Entity> = {
        [this.primaryField]: primaryField,
      } as FindOptionsWhere<Entity>;

      return Optional.ofAsync(
        this.repository.findOne({
          where: where,
          relations,
        }),
      );
    }

    return Optional.ofAsync(
      (transactionManager
        ? transactionManager.getRepository(this.repository.target)
        : this.repository
      ).findOne(opts),
    );
  }

  /**
   * Retrieves an entity by primary field.
   */
  findOneOrFail(
    opts: FindByIdOpts<Entity, PK>,
    errorSupplier: Error | (() => Error),
    transactionManager?: EntityManager,
  ): Promise<Entity> | never;

  /**
   * Retrieves an entity by options.
   */
  findOneOrFail(
    opts: FindOpts<Entity>,
    errorSupplier: Error | (() => Error),
    transactionManager?: EntityManager,
  ): Promise<Entity> | never;

  /**
   * Retrieves an entity by options or primary field.
   */
  async findOneOrFail(
    opts: FindByIdOpts<Entity, PK> | FindOpts<Entity>,
    errorSupplier: Error | (() => Error),
    transactionManager?: EntityManager,
  ): Promise<Entity> | never {
    if ('primaryField' in opts) {
      const { primaryField, relations } = opts;

      const where: FindOptionsWhere<Entity> = {
        [this.primaryField]: primaryField,
      } as FindOptionsWhere<Entity>;

      return Optional.ofAsync<Entity>(
        this.repository.findOne({
          where: where,
          relations,
        }),
      ).then((data) => data.orElseThrow(errorSupplier));
    }

    return Optional.ofAsync<Entity>(
      (transactionManager
        ? transactionManager.getRepository(this.repository.target)
        : this.repository
      ).findOne(opts),
    ).then((data) => data.orElseThrow(errorSupplier));
  }

  /**
   * Creates a new entity record from the given data.
   */
  async create(
    entity: Entity,
    transactionManager?: EntityManager,
  ): Promise<Entity> {
    const idColumn = this.repository.metadata.primaryColumns.find(
      (col) => col.propertyName === this.primaryField,
    );
    if (idColumn?.isGenerated) {
      // prevents the data to be updated by its primary field
      delete entity[this.primaryField];
    }

    return (
      transactionManager?.getRepository(this.repository.target) ??
      this.repository
    ).save(entity);
  }

  /**
   * Creates new entities record from the given data.
   */
  async createMany(
    entities: Entity[],
    transactionManager?: EntityManager,
  ): Promise<Entity[]> {
    if (!entities.length) {
      return entities;
    }

    const idColumn = this.repository.metadata.primaryColumns.find(
      (col) => col.propertyName === this.primaryField,
    );
    if (idColumn?.isGenerated) {
      // prevents the data to be updated by its primary field
      for (const obj of entities) {
        delete obj[this.primaryField];
      }
    }

    return (
      transactionManager?.getRepository(this.repository.target) ??
      this.repository
    ).save(entities);
  }

  /**
   * Updates an entity by its options.
   */
  async update(
    opts: FindByIdOpts<Entity, PK> | WhereOpts<Entity>,
    data: MergeInto<Entity>,
    transactionManager?: EntityManager,
  ): Promise<{ before: Entity; after: Entity }> | never {
    const targetOpts: FindOneOptions<Entity> = { ...opts };

    if ('primaryField' in opts) {
      const { primaryField } = opts;
      targetOpts.where = {
        [this.primaryField]: primaryField,
      } as FindOptionsWhere<Entity>;
    }

    const repo =
      transactionManager?.getRepository(this.repository.target) ??
      this.repository;
    const before = await repo.findOneOrFail(targetOpts);
    const after = await repo.save(data.merge(this.clone(before)));
    return { before, after };
  }

  /**
   * Updates entities by its options.
   */
  async updateMany(
    targetOpts: WhereOpts<Entity>,
    data: MergeInto<Entity>,
    transactionManager?: EntityManager,
  ): Promise<{ before: Entity[]; after: Entity[] }> {
    const entities = await this.repository.find(targetOpts);
    if (!entities.length) {
      return { before: [], after: [] };
    }

    const repo =
      transactionManager?.getRepository(this.repository.target) ??
      this.repository;

    // to not mutate the original `entities`, we clone each entity before passing it to `merge`
    const after = await repo.save(
      entities.map((entity) => data.merge(this.clone(entity))),
    );

    return { before: entities, after };
  }

  /**
   * Deletes an entity by its options.
   */
  async softDelete(
    opts: FindByIdOpts<Entity, PK> | WhereOpts<Entity>,
    transactionManager?: EntityManager,
  ): Promise<Entity> | never {
    const repo =
      transactionManager?.getRepository(this.repository.target) ??
      this.repository;

    if ('primaryField' in opts) {
      const { primaryField, relations } = opts;

      const where: FindOptionsWhere<Entity> = {
        [this.primaryField]: primaryField,
      } as FindOptionsWhere<Entity>;

      return repo.softRemove(await repo.findOneOrFail({ where, relations }));
    }

    return repo.softRemove(await repo.findOneOrFail(opts));
  }

  /**
   * Deletes an entity by its options.
   */
  async softDeleteMany(
    opts: WhereOpts<Entity>,
    transactionManager?: EntityManager,
  ): Promise<Entity[]> {
    const repo =
      transactionManager?.getRepository(this.repository.target) ??
      this.repository;

    const entities = await repo.find(opts);
    return repo.softRemove(entities);
  }

  /**
   * Deletes an entity by its options.
   */
  async hardDelete(
    opts: FindByIdOpts<Entity, PK> | WhereOpts<Entity>,
    transactionManager?: EntityManager,
  ): Promise<Entity> | never {
    const repo =
      transactionManager?.getRepository(this.repository.target) ??
      this.repository;

    if ('primaryField' in opts) {
      const { primaryField, relations } = opts;

      const where: FindOptionsWhere<Entity> = {
        [this.primaryField]: primaryField,
      } as FindOptionsWhere<Entity>;

      const data = await repo.findOneOrFail({ where, relations });
      await repo.remove(data);
      return data;
    }

    const data = await repo.findOneOrFail(opts);
    await repo.remove(data);
    return data;
  }

  /**
   * Deletes an entity by its options.
   */
  async hardDeleteMany(
    opts: WhereOpts<Entity>,
    transactionManager?: EntityManager,
  ): Promise<Entity[]> {
    const repo =
      transactionManager?.getRepository(this.repository.target) ??
      this.repository;

    const entities = await repo.find({ ...opts, withDeleted: true });
    return repo.remove(entities);
  }

  protected withTransaction<T>(
    transactionManager: Nullable<EntityManager>,
    fn: (transactionManager: EntityManager) => Promise<T>,
  ): Promise<T> {
    if (transactionManager) return fn(transactionManager);
    return this.repository.manager.transaction(fn);
  }

  protected clone(entity: Entity): Entity {
    return structuredClone(entity);
  }
}
