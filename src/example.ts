import { Data } from '.';

export class MyClass extends Data.record({
  string: Data.string(),
  number: Data.number(),
  unknown: Data.unknown(),
  boolean: Data.boolean(),
  null: Data.null(),
  array: Data.array(Data.string()),
  union: Data.union([
    Data.record({ prop1: Data.string() }),
    Data.record({ prop2: Data.number() }),
    Data.boolean(),
  ]),
  arrayOfUnion: Data.array(Data.union([Data.string(), Data.boolean()])),
  object: Data.record({
    prop: Data.string(),
    nestedObject: Data.record({
      nestedProp: Data.number(),
    }),
  }),
}) {}

const myData = new MyClass({
  string: '123',
  number: 123,
  unknown: true,
  boolean: false,
  null: null,
  array: ['1', '1', '1'],
  union: { prop1: 'hello' },
  arrayOfUnion: ['1', true, false, '2'],
  object: {
    prop: '13',
    nestedObject: { nestedProp: 2 },
  },
});

console.log(myData);
console.log(JSON.stringify(myData));
console.log(MyClass.definitions);

function takeRecord(foo: MyClass) {
  console.log(foo);
  console.log(JSON.stringify(foo));
}

myData.union;
myData.object.nestedObject;
myData.null;

takeRecord(myData);
takeRecord({
  string: '123',
  number: 123,
  unknown: true,
  boolean: false,
  null: null,
  array: ['1'],
  union: { prop1: '1234' },
  arrayOfUnion: ['1', true],
  object: {
    prop: '13',
    nestedObject: { nestedProp: 2 },
  },
});
