export type Definitions<T> = {
  [key in keyof T]: Definition<T[key]>;
};

export class Definition<C = never> {
  constructor(public type: string) {}
}

interface TypeClass<T> {
  properties: (keyof T)[];
  children: Definitions<T>;
  (values: T): T;
  new (values: T): T;
}

const Type = <T extends Record<string, unknown>>(definitions: Definitions<T>): TypeClass<T> => {
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
  } as TypeClass<T>;
  _Class.properties = properties;
  _Class.children = definitions;
  return _Class;
};

class UnionDefinition<T> extends Definition<'union'> {
  constructor(readonly definitions: Definitions<T>) {
    super('union');
  }
}

class RecordDefinition<T> extends Definition<'record'> {
  constructor(readonly definitions: Definitions<T>) {
    super('record');
  }
}

Type.string = () => new Definition<string>('string');
Type.number = () => new Definition<number>('number');
Type.boolean = () => new Definition<boolean>('boolean');
Type.null = () => new Definition<null>('null');
Type.unknown = () => new Definition<unknown>('unknown');
Type.union = <T>(definitions: Definitions<T>) => new UnionDefinition(definitions);
Type.record = <T = Record<string, never>>(definitions: Definitions<T> = {} as any) =>
  new RecordDefinition(definitions);

export const MyClass = Type({
  foo: Type.string(),
  bar: Type.number(),
  baz: Type.unknown(),
});

export const MyUnion = Type.union({
  BMW: Type.record(),
  Ford: Type.record(),
  Honda: Type.record(),
});

export class MyClass2 extends Type({
  foo: Type.string(),
  bar: Type.number(),
  baz: Type.unknown(),
}) {}

const f1 = new MyClass({ foo: '123', bar: 123, baz: [] });
const f2 = MyClass({ foo: '123', bar: 123, baz: 1 });
const f21 = new MyClass2({ foo: '123', bar: 123, baz: true });

console.log(f1, f2, f21);
console.log(JSON.stringify({ f1, f2, f21 }));
console.log(MyClass.properties);
console.log(MyClass.children);
