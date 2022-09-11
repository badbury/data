type Types = string | number | unknown | TypesObject | TypesArray;
type TypesObject = { [key: string]: Types };
type TypesArray = Types[];

type Constructor<T = unknown> = {
  make(t: T): T;
  guard(subject: unknown): subject is T;
  parse(subject: unknown): T;
  name: string;
};

type ObjectOfConstructorsToTypes<T extends { [key: string]: Constructor }> = {
  [key in keyof T]: ConstructorToType<T[key]>;
};

type ConstructorToType<T extends Constructor> = ReturnType<T['make']>;

export function parse<T>(value: unknown, constructor: Constructor<T>): T {
  if (typeof constructor === 'function' && value instanceof constructor) {
    return value as T;
  }
  if (constructor.guard(value)) {
    return constructor.make(value);
  }
  throw new Error(`Can not parse ${value} into a ${constructor.name}`);
}

interface CompleteMatch<R> {
  run(): R;
}

interface IncompleteMatch<T, L, R> {
  with<I extends T, K>(
    target: Constructor<I>,
    handler: (value: I) => K,
  ): Exclude<T, L | I> extends never ? CompleteMatch<R | K> : IncompleteMatch<T, L | I, R | K>;

  default<K>(handler: (value: Exclude<T, L>) => K): CompleteMatch<R | K>;
}

class MatchBuilder<T, L, R> implements IncompleteMatch<T, L, R>, CompleteMatch<R> {
  constructor(private value: T, private map: Map<Constructor<T>, (value: T) => R> = new Map()) {}
  with<I extends T, K>(target: Constructor<I>, handler: (value: I) => K) {
    const map: Map<Constructor<T>, (value: T) => R | K> = new Map(this.map);
    map.set(target, handler as (value: T) => R | K);
    return new MatchBuilder<T, L | I, R | K>(this.value, map);
  }
  default<K>(handler: (value: Exclude<T, L>) => K) {
    const map: Map<Constructor<T>, (value: T) => R | K> = new Map(this.map);
    map.set(unknown() as any, handler as (value: T) => R | K);
    return new MatchBuilder(this.value, map);
  }
  run() {
    for (const [constructor, handler] of this.map.entries()) {
      if (constructor.guard(this.value)) {
        return handler(this.value);
      }
    }
    throw new Error('Unexpected incomplete match');
  }
}

export function match<T>(value: T): IncompleteMatch<T, never, never> {
  return new MatchBuilder<T, never, never>(value);
}

export class StringConstructor extends String {
  static make(value: string): string {
    return value;
  }
  static guard(value: unknown): value is string {
    return typeof value === 'string';
  }
  static parse(value: unknown): string {
    return parse(value, this);
  }
}
export const string = (): Constructor<string> => StringConstructor;

export class NumberConstructor extends Number {
  static make(value: number): number {
    return value;
  }
  static guard(value: unknown): value is number {
    return typeof value === 'number';
  }
  static parse(value: unknown): number {
    return parse(value, this);
  }
}
export const number = (): Constructor<number> => NumberConstructor;

export class BooleanConstructor extends Boolean {
  static make(value: boolean): boolean {
    return value;
  }
  static guard(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }
  static parse(value: unknown): boolean {
    return parse(value, this);
  }
}
export const boolean = (): Constructor<boolean> => BooleanConstructor;

export class NullConstructor {
  static make(value: null): null {
    return value;
  }
  static guard(value: unknown): value is null {
    return value === null;
  }
  static parse(value: unknown): null {
    return parse(value, this);
  }
}
export const nil = (): Constructor<null> => NullConstructor;

export class UnknownConstructor {
  static make(value: unknown): unknown {
    return value;
  }
  static guard(value: unknown): value is unknown {
    return true;
  }
  static parse(value: unknown): unknown {
    return parse(value, this);
  }
}
export const unknown = (): Constructor<unknown> => UnknownConstructor;

export type ArrayConstructor<D extends Constructor, T extends ConstructorToType<D>> = Constructor<
  T[]
> & {
  name: 'ArrayConstructor';
  definition: D;
};
export const array = <D extends Constructor, T extends ConstructorToType<D>>(
  definition: D,
): ArrayConstructor<D, T> => ({
  name: 'ArrayConstructor',
  definition,
  make(value: T[]): T[] {
    return value;
  },
  guard(value: unknown): value is T[] {
    return Array.isArray(value) && value.every(definition.guard);
  },
  parse(value: unknown): T[] {
    return parse(value, this);
  },
});

export interface RecordConstructor<
  D extends Record<string, Constructor>,
  T extends ObjectOfConstructorsToTypes<D>
> extends Constructor<T> {
  name: string;
  definitions: D;
  (values: T): T;
  new (values: T): T;
  prototype: T;
}
export const record = <
  D extends Record<string, Constructor>,
  T extends ObjectOfConstructorsToTypes<D>
>(
  definitions: D = {} as D,
): RecordConstructor<D, T> => {
  const properties = Object.keys(definitions) as (keyof T)[];
  const _Class = function (this: unknown, values: T) {
    if (!(this instanceof _Class)) {
      return new _Class(values);
    }
    for (const key of properties) {
      this[key] = values[key];
    }
  } as RecordConstructor<D, T>;
  _Class.definitions = definitions;
  _Class.make = function (values: T) {
    return new this(values);
  };
  _Class.guard = function (values: unknown): values is T {
    if (values === null || typeof values !== 'object' || values instanceof Array) {
      return false;
    }
    for (const key of properties) {
      if (values !== null && !(key in values)) {
        return false;
      }
      if (!definitions[key as keyof D].guard((values as T)[key])) {
        return false;
      }
    }
    return true;
  };
  _Class.parse = function (value: unknown): T {
    return parse(value, this);
  };
  return _Class;
};

export type UnionConstructor<
  D extends Constructor[],
  T extends ConstructorToType<D[number]>
> = Constructor<T> & {
  name: 'UnionConstructor';
  definitions: D;
};
export const union = <D extends Constructor[], T extends ConstructorToType<D[number]>>(
  definitions: D,
): UnionConstructor<D, T> => ({
  name: 'UnionConstructor',
  definitions,
  make(value: T): T {
    for (const definition of definitions) {
      if (definition.guard(value)) {
        return (definition as Constructor<T>).make(value);
      }
    }
    return value;
  },
  guard(subject: T): subject is T {
    return definitions.some((definition) => definition.guard(subject));
  },
  parse(value: unknown): T {
    return parse(value, this);
  },
});

export const Data = {
  string,
  number,
  boolean,
  null: nil,
  nil,
  unknown,
  array,
  record,
  union,
};

export default Data;
