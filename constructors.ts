import {
  Constructor,
  ConstructorToType,
  Identity,
  ObjectOfConstructorsToTypes,
} from "./interfaces.ts";

export function parse<T>(value: unknown, constructor: Constructor<T>): T {
  if (typeof constructor === "function" && value instanceof constructor) {
    return value as T;
  }
  if (constructor.guard(value)) {
    return constructor.make(value);
  }
  throw new Error(`Can not parse ${value} into a ${constructor.name}`);
}

export class StringConstructor extends String {
  static make(value: string): string {
    return value;
  }
  static guard(value: unknown): value is string {
    return typeof value === "string";
  }
  static parse(value: unknown): string {
    return parse(value, this);
  }
}
export const string = (): Constructor<string> & typeof StringConstructor =>
  StringConstructor;

export class NumberConstructor extends Number {
  static make(value: number): number {
    return value;
  }
  static guard(value: unknown): value is number {
    return typeof value === "number";
  }
  static parse(value: unknown): number {
    return parse(value, this);
  }
}
export const number = (): Constructor<number> & typeof NumberConstructor =>
  NumberConstructor;

export class BooleanConstructor extends Boolean {
  static make(value: boolean): boolean {
    return value;
  }
  static guard(value: unknown): value is boolean {
    return typeof value === "boolean";
  }
  static parse(value: unknown): boolean {
    return parse(value, this);
  }
}
export const boolean = (): Constructor<boolean> & typeof BooleanConstructor =>
  BooleanConstructor;

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
  static guard(_: unknown): _ is unknown {
    return true;
  }
  static parse(value: unknown): unknown {
    return parse(value, this);
  }
}
export const unknown = (): Constructor<unknown> => UnknownConstructor;

export type ArrayConstructor<
  D extends Constructor,
  T extends ConstructorToType<D>,
> =
  & Constructor<
    T[]
  >
  & {
    name: "ArrayConstructor";
    definition: D;
  };
export const array = <D extends Constructor, T extends ConstructorToType<D>>(
  definition: D,
): ArrayConstructor<D, T> => ({
  name: "ArrayConstructor",
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
  T extends ObjectOfConstructorsToTypes<D>,
> extends Constructor<T> {
  name: string;
  definitions: D;
  (values: T): T;
  new (values: T): T;
  prototype: T;
}
export const record = <
  D extends Record<string, Constructor>,
  T extends ObjectOfConstructorsToTypes<D>,
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
    if (
      values === null || typeof values !== "object" || values instanceof Array
    ) {
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
  T extends ConstructorToType<D[number]>,
> = Constructor<T> & {
  name: "UnionConstructor";
  definitions: D;
};
export const union = <
  D extends Constructor[],
  T extends ConstructorToType<D[number]>,
>(
  definitions: D,
): UnionConstructor<D, T> => ({
  name: "UnionConstructor",
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

type LiteralTypes = string | number | boolean | bigint | null | undefined;

export type LiteralConstructor<T extends LiteralTypes> = Constructor<T> & {
  name: "LiteralConstructor";
  value: T;
};
export const literal = <T extends LiteralTypes>(
  value: T,
): LiteralConstructor<T> => ({
  name: "LiteralConstructor",
  value,
  make(value: Identity<T>): T {
    return value;
  },
  guard(subject: T): subject is T {
    if (typeof value === "number" && Number.isNaN(value)) {
      return typeof subject === "number" && Number.isNaN(subject);
    }
    return value === subject;
  },
  parse(value: unknown): T {
    return parse(value, this);
  },
});

export type EnumConstructor<T extends LiteralTypes, A extends T[]> =
  & Constructor<A[number]>
  & {
    name: "EnumConstructor";
    values: A;
  };
export const enums = <T extends LiteralTypes, A extends T[]>(
  values: A,
): EnumConstructor<T, A> => ({
  name: "EnumConstructor",
  values,
  make(value: Identity<A[number]>): A[number] {
    return value;
  },
  guard(subject: A[number]): subject is A[number] {
    if (typeof subject === "number" && Number.isNaN(subject)) {
      return values.some(Number.isNaN);
    }
    return values.includes(subject);
  },
  parse(value: unknown): A[number] {
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
  literal,
  enum: enums,
  enums,
};

export default Data;
