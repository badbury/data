type Types = string | number | unknown;
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

type ConstructorToType<T extends Constructors> = ReturnType<T['make']>;

type TypeToConstructor<T extends Types> = T extends string
  ? typeof StringConstructor
  : T extends number
  ? typeof NumberConstructor
  : T extends unknown
  ? typeof UnknownConstructor
  : never;

interface ObjectConstructor<T extends { [key: string]: Types }> {
  type: T;
  properties: (keyof T)[];
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

const Type = function () {};
class StringConstructor extends String {
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toString();
  }
  static make(value: string) {
    return value;
  }
}

class NumberConstructor extends Number {
  static make(value: number) {
    return value;
  }
}

class UnknownConstructor {
  static make(value: unknown) {
    return value;
  }
}

class BooleanConstructor extends Boolean {
  static make(value: boolean) {
    return value;
  }
}

class NullConstructor {
  static make() {
    return null;
  }
}

Type.object = <D extends Record<string, Constructors> = Record<string, never>>(
  definitions: D = {} as D,
): ObjectConstructor<ConstructorsToTypes<D>> => {
  type T = ConstructorsToTypes<D>;
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
  _Class.properties = properties;
  _Class.children = (definitions as unknown) as TypesToConstructors<ConstructorsToTypes<D>>;
  return _Class;
};
Type.string = () => StringConstructor;
Type.number = () => NumberConstructor;
Type.unknown = () => UnknownConstructor;
Type.boolean = () => BooleanConstructor;
Type.null = () => NullConstructor;
Type.union = <T extends Record<string, Constructors<unknown>>, Z extends UnionValues<T>>(
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

export const MyString = Type.string();

export const MyUnion = Type.union({
  BMW: Type.object(),
  Ford: Type.object(),
  Honda: Type.object(),
});

export class MyClass extends Type.object({
  string: Type.string(),
  number: Type.number(),
  unknown: Type.unknown(),
  boolean: Type.boolean(),
  null: Type.null(),
  union: Type.union({
    option1: Type.object({ prop1: Type.string() }),
    option2: Type.object({ prop2: Type.number() }),
    option3: Type.boolean(),
  }),
  otherUnion: MyUnion,
}) {}

const myData = new MyClass({
  string: '123',
  number: 123,
  unknown: true,
  boolean: false,
  null: null,
  union: { prop1: '1234' },
  otherUnion: new MyUnion.BMW({}),
});

console.log(myData);
console.log(JSON.stringify(myData));
console.log(MyClass.properties);
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
    otherUnion: new MyUnion.BMW({}),
});
