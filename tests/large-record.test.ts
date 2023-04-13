import { test } from 'uvu';
import assert from 'uvu/assert';
import {
  array,
  boolean,
  literal,
  nil,
  number,
  record,
  string,
  union,
  unknown,
  enums,
} from '../src';

export class MyClass extends record({
  string: string(),
  number: number(),
  unknown: unknown(),
  boolean: boolean(),
  null: nil(),
  literal: literal('steve'),
  enum: enums([1, true, 'three']),
  array: array(string()),
  union: union([record({ prop1: string() }), record({ prop2: number() }), boolean()]),
  arrayOfUnion: array(union([string(), boolean()])),
  object: record({
    prop: string(),
    nestedObject: record({
      nestedProp: number(),
    }),
  }),
}) {}

test('Use MyClass as a constructor', () => {
  const myData = new MyClass({
    string: '123',
    number: 123,
    unknown: true,
    boolean: false,
    null: null,
    literal: 'steve',
    enum: 'three',
    array: ['1', '1', '1'],
    union: { prop1: 'hello' },
    arrayOfUnion: ['1', true, false, '2'],
    object: {
      prop: '13',
      nestedObject: { nestedProp: 2 },
    },
  });

  assert.equal(myData.union, { prop1: 'hello' });
  assert.equal(myData.object.nestedObject.nestedProp, 2);
  assert.equal(myData.null, null);
});

test('Use MyClass as a type argument', () => {
  const pojoInstance = {
    string: '123',
    number: 123,
    unknown: true,
    boolean: false,
    null: null,
    literal: 'steve' as const,
    enum: true as const,
    array: ['1'],
    union: { prop2: 1234 },
    arrayOfUnion: ['1', true],
    object: {
      prop: '13',
      nestedObject: { nestedProp: 2 },
    },
  };
  const classInstance = new MyClass(pojoInstance);

  function getNestedProp(foo: MyClass) {
    return foo.object.nestedObject.nestedProp;
  }

  assert.is(getNestedProp(pojoInstance), 2);
  assert.is(getNestedProp(classInstance), 2);
});

test.run();
