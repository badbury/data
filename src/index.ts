type Types = string | number | unknown | TypesObject | TypesArray;
type TypesObject = { [key: string]: Types };
type TypesArray = Types[];

type Constructor<T extends unknown = unknown> = {
  make(t: T): T;
  guard(subject: unknown): subject is T;
  name: string;
};

type ObjectOfConstructorsToTypes<T extends { [key: string]: Constructor }> = {
  [key in keyof T]: ConstructorToType<T[key]>;
};

type ConstructorToType<T extends Constructor> = ReturnType<T['make']>;

export const Data = function (): void {};

export class StringConstructor extends String {
  static make(value: string): string {
    return value;
  }
  static guard(value: unknown): value is string {
    return typeof value === 'string';
  }
}
Data.string = (): Constructor<string> => StringConstructor;

export class NumberConstructor extends Number {
  static make(value: number): number {
    return value;
  }
  static guard(value: unknown): value is number {
    return typeof value === 'number';
  }
}
Data.number = (): Constructor<number> => NumberConstructor;

export class BooleanConstructor extends Boolean {
  static make(value: boolean): boolean {
    return value;
  }
  static guard(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }
}
Data.boolean = (): Constructor<boolean> => BooleanConstructor;

export class NullConstructor {
  static make(value: null): null {
    return value;
  }
  static guard(value: unknown): value is null {
    return value === null;
  }
}
Data.null = (): Constructor<null> => NullConstructor;

export class UnknownConstructor {
  static make(value: unknown): unknown {
    return value;
  }
  static guard(value: unknown): value is unknown {
    return true;
  }
}
Data.unknown = (): Constructor<unknown> => UnknownConstructor;

export type ArrayConstructor<D extends Constructor, T extends ConstructorToType<D>> = Constructor<
  T[]
> & {
  name: 'ArrayConstructor';
  definition: D;
};
Data.array = <D extends Constructor, T extends ConstructorToType<D>>(
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
});

export interface RecordConstructor<
  D extends Record<string, Constructor>,
  T extends ObjectOfConstructorsToTypes<D>
> extends Constructor<T> {
  name: string;
  definitions: D;
  (values: T): T;
  new (values: T): T;
  make(values: T): T;
  prototype: T;
}
Data.record = <D extends Record<string, Constructor>, T extends ObjectOfConstructorsToTypes<D>>(
  definitions: D = {} as D,
): RecordConstructor<D, T> => {
  const properties = Object.keys(definitions) as (keyof T)[];
  const _Class = function (this: unknown, values: T) {
    if (!(this instanceof _Class)) {
      return new _Class(values);
    }
    for (const key of Object.keys(values)) {
      if (properties.includes(key)) {
        (this as any)[key] = values[key];
      }
    }
  } as RecordConstructor<D, T>;
  _Class.definitions = definitions;
  _Class.make = function (values: T) {
    return new this(values);
  };
  _Class.guard = function (subject: unknown): subject is T {
    if (subject === null || typeof subject !== 'object') {
      return false;
    }
    for (const key of Object.keys(properties)) {
      if (!(key in subject)) {
        return false;
      }
      if (!definitions[key].guard((subject as T)[key])) {
        return false;
      }
    }
    return true;
  };
  return _Class;
};

export type UnionConstructor<
  D extends Constructor[],
  T extends ConstructorToType<D[number]>
> = Constructor<T> & {
  name: 'UnionConstructor';
  definitions: D;
  make(values: T): T;
};
Data.union = <D extends Constructor[], T extends ConstructorToType<D[number]>>(
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
});
