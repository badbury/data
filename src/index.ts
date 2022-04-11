type Types = string | number | unknown | TypesObject;
type TypesObject = { [key: string]: Types };

type Constructors<T extends unknown = unknown> = {
  make(...a: unknown[]): T;
  name: string;
};

type ConstructorsToTypes<T extends { [key: string]: Constructors }> = {
  [key in keyof T]: ConstructorToType<T[key]>;
};

type TypesToConstructors<T extends { [key: string]: Types }> = {
  [key in keyof T]: TypeToConstructor<T[key]>;
};

type ConstructorToType<T extends Constructors> = T extends Constructors<infer N> ? N : never;

type TypeToConstructor<T extends Types> = T extends string
  ? typeof StringConstructor
  : T extends number
  ? typeof NumberConstructor
  : T extends unknown
  ? typeof UnknownConstructor
  : never;

interface ObjectConstructor<T extends { [key: string]: Types }> extends Constructors<T> {
  name: string;
  children: TypesToConstructors<T>;
  (values: T): T;
  new (values: T): T;
  make(values: T): T;
  prototype: T;
}

type UnionValues<T> = T extends Record<string, Constructors<infer P>> ? P : never;

type UnionConstructor<T extends Record<string, Constructors<unknown>>, Z extends UnionValues<T>> = {
  [C in keyof T]: T[C];
  // [C in T as `format${Capitalize<Key & string>}`]: C;
} & {
  name: 'UnionConstructor';
  make(values: Z): Z;
};

class StringConstructor extends String {
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toString();
  }
  static make(value: string): string {
    return value;
  }
}

class NumberConstructor extends Number {
  static make(value: number): number {
    return value;
  }
}

class UnknownConstructor {
  static make(value: unknown): unknown {
    return value;
  }
}

class BooleanConstructor extends Boolean {
  static make(value: boolean): boolean {
    return value;
  }
}

class NullConstructor {
  static make(): null {
    return null;
  }
}

export const Data = function () {};

Data.string = () => StringConstructor;
Data.number = () => NumberConstructor;
Data.boolean = () => BooleanConstructor;
Data.null = () => NullConstructor;
Data.object = <
  T extends ConstructorsToTypes<D>,
  D extends Record<string, Constructors> = Record<string, Constructors>
>(
  definitions: D = {} as D,
): ObjectConstructor<T> => {
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
  } as ObjectConstructor<T>;
  _Class.children = (definitions as unknown) as TypesToConstructors<T>;
  _Class.make = function (values: T) {
    return new this(values);
  };
  return _Class;
};
Data.union = <T extends Record<string, Constructors<unknown>>, Z extends UnionValues<T>>(
  definitions: T,
): UnionConstructor<T, Z> => {
  return {
    name: 'UnionConstructor',
    ...definitions,
    make(value: Z): Z {
      return value;
    },
  };
};
Data.unknown = () => UnknownConstructor;

export const MyString = Data.string();

export const MyUnion = Data.union({
  BMW: Data.object(),
  Ford: Data.object(),
  Honda: Data.object(),
});

console.log(MyUnion.BMW);

export class MyClass extends Data.object({
  string: Data.string(),
  number: Data.number(),
  unknown: Data.unknown(),
  boolean: Data.boolean(),
  null: Data.null(),
  union: Data.union({
    option1: Data.object({ prop1: Data.string() }),
    option2: Data.object({ prop2: Data.number() }),
    option3: Data.boolean(),
  }),
  object: Data.object({
    prop: Data.string(),
    nestedObject: Data.object({
      nestedProp: Data.number(),
    }),
  }),
  otherUnion: MyUnion,
}) {}

const myData = new MyClass({
  string: '123',
  number: 123,
  unknown: true,
  boolean: false,
  null: null,
  union: { prop1: 'hello' },
  object: {
    prop: '13',
    nestedObject: { nestedProp: 2 },
  },
  otherUnion: MyUnion.BMW.make({}),
});

console.log(myData);
console.log(JSON.stringify(myData));
console.log(MyClass.children);

function takeRecord(foo: MyClass) {
  console.log(foo);
  console.log(JSON.stringify(foo));
}

takeRecord(myData);
takeRecord({
  string: '123',
  number: 123,
  unknown: true,
  boolean: false,
  null: null,
  union: { prop1: '1234' },
  object: {
    prop: '13',
    nestedObject: { nestedProp: 2 },
  },
  otherUnion: MyUnion.BMW.make({}),
});
