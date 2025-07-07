type Nullable<T> = T | null | undefined;

export class NoSuchElementError extends Error {
  constructor(msg = 'No value present') {
    super(msg);
    this.name = 'NoSuchElementError';
    if (Error.captureStackTrace)
      Error.captureStackTrace(this, NoSuchElementError);
  }
}

export class Optional<T> {
  /**
   * Returns an `Optional` of type `<T>` whose payload is given non-null `value`.
   *
   * @param value a value
   * @throws {TypeError} when given value is `null` or `undefined`.
   * */
  static of<T>(value: Nullable<T> | (() => Nullable<T>)): Optional<T> {
    if (value === null || value === undefined) {
      throw new TypeError('value should not be null or undefined');
    }
    return new Optional<T>(
      typeof value === 'function' ? (value as Function)() : value,
    );
  }

  /**
   * Asynchronously creates an Optional from a promise or async function.
   *
   * @param source A Promise of T|null|undefined or a function returning one.
   * @returns A Promise resolving to Optional.of(value) if non-null, or Optional.empty() otherwise.
   */
  static async ofAsync<T, P = Promise<Nullable<T>>>(
    value: P | (() => P),
    options: { emptyOnError?: boolean } = {},
  ): Promise<Optional<T>> | never {
    if (value === null || value === undefined) {
      throw new TypeError('value should not be null or undefined');
    }
    try {
      const result = await (typeof value === 'function'
        ? (value as Function)()
        : value);
      return result ? Optional.of(result) : Optional.empty();
    } catch (err) {
      if (options.emptyOnError) return Optional.empty();
      throw err;
    }
  }

  /**
   * Returns an `Optional<T>` describing the specified `value`, if non-null,
   * otherwise returns an empty `Optional<T>`.
   *
   * @param value a value
   * @returns `Optional<T>`
   * */
  static ofNullable<T>(value: Nullable<T>): Optional<T> {
    if (value === null || value === undefined) {
      return Optional.empty();
    }
    return new Optional<T>(value);
  }

  /**
   * Returns an empty optional `Optional`.
   *
   * @returns an empty `Optional`
   * */
  static empty(): Optional<any> {
    return this.#EMPTY;
  }
  /**
   * Return `true` if `value` is empty, otherwise return `false`.
   * @returns `true` if `value` is empty, otherwise return `false`.
   * */
  isEmpty(): boolean {
    return !this.isPresent();
  }

  /**
   * Return true if there is a value present, otherwise false.
   * @returns true if `value` is present, otherwise return false
   * */
  isPresent(): boolean {
    return this.value !== null && this.value !== undefined;
  }

  /**
   * If a `value` is present in this `Optional<T>`, returns the `value`,
   * otherwise throws an error.
   *
   * @returns the `value`.
   * */
  get(): T {
    if (!this.value) {
      throw new NoSuchElementError();
    }
    return this.value;
  }

  /**
   * Return the `value` if present, otherwise return `other`.
   * @returns `value` otherwise `other`
   * */
  orElse(other: T): T {
    return this.value ? this.value : other;
  }

  /**
   * Return the `value` if present, otherwise return `other`.
   * @returns `value` otherwise `other`
   * */
  orElseGet(other: () => T): T {
    return this.value ? this.value : other();
  }

  /**
   * Return the `value` if present, otherwise return `other`.
   * @returns `value` otherwise `other`
   * */
  orElseAsync(other: Promise<T>): Promise<T> {
    if (this.value) return Promise.resolve(this.value);
    return other;
  }

  /**
   * Return the `value` if present, otherwise return `other`.
   * @returns `value` otherwise `other`
   * */
  orElseGetAsync(other: () => Promise<T>): Promise<T> {
    if (this.value) return Promise.resolve(this.value);
    return other();
  }

  /**
   * Return the contained value, if present, otherwise throw an
   * error to be created by the provided supplier.
   *
   * @returns `value` otherwise throws an error.
   * */
  orElseThrow<E extends Error>(errorSupplier: E | (() => E)): T | never {
    if (this.value) return this.value;
    if (typeof errorSupplier === 'function') throw errorSupplier();
    throw errorSupplier;
  }

  /**
   * If a `value` is present in this `Optional`, returns the `value`,
   * otherwise return `null`.
   *
   * @returns `value` otherwise `null`.
   * */
  orNull(): T | null {
    return this.value ? this.value : null;
  }

  /**
   * If a `value` is present, apply the provided mapping function to it,
   * and if the result is non-null, return an `Optional` describing the result.
   * Otherwise return an empty `Optional`.
   *
   * @returns an `Optional` describing the result of applying a mapping function
   * to the `value` of this `Optional`, if a `value` is present,
   * otherwise an empty `Optional`.
   * */
  map<M = any>(fn: NonNullable<(value: T) => M>): Optional<M> {
    if (!this.value) return Optional.empty();
    return Optional.ofNullable(fn(this.value));
  }

  /**
   * If a `value` is present, apply the provided `Optional`-bearing mapping function to it,
   * return that result, otherwise return an empty Optional.
   *
   * This method is similar to `Optional.map`, but the provided mapper is
   * one whose result is already an `Optional`, and if invoked,
   * `Optional.flatMap` does not wrap it with an additional `Optional`.
   *
   * @returns the result of applying an `Optional`-bearing mapping function
   * to the `value` of this `Optional`, if a `value` is present, otherwise an empty `Optional`.
   * */
  flatMap<M = any>(fn: NonNullable<(value: T) => Optional<M>>): Optional<M> {
    if (!this.value) return Optional.empty();
    return fn(this.value);
  }

  /**
   * If a `value` is present, and the `value` matches the given `predicate`,
   * return an `Optional` describing the `value`, otherwise return an empty `Optional`.
   *
   * @returns an `Optional` describing the `value` of this `Optional`
   * if a `value` is present and the `value` matches the given `predicate`,
   * otherwise an empty `Optional`.
   */
  filter(predicate: (value: T) => boolean): Optional<T> {
    if (!this.value || !predicate(this.value)) {
      return Optional.empty();
    }
    return this;
  }

  static #EMPTY = new Optional<any>(null);
  private constructor(private readonly value: T | null | undefined) {}
}
