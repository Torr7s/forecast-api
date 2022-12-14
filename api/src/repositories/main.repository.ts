import { BaseRepository, FilterOptions, WithId } from './base.repository';

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class DatabaseInternalError extends DatabaseError {};

export class DatabaseValidationError extends DatabaseError {};

export class DatabaseUnknownClientError extends DatabaseError {};

export abstract class MainRepository<T> implements BaseRepository<T> {
  public abstract create(data: T): Promise<WithId<T>>;
  public abstract find(options: FilterOptions): Promise<WithId<T>[]>;
  public abstract findOne(options: FilterOptions): Promise<WithId<T> | undefined>;
  public abstract deleteAll(): Promise<void>;
} 