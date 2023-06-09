import { test } from 'uvu';
import assert from 'uvu/assert';
import { Data } from '../src';

test('Data.string().make()', () => {
  const type = Data.string();

  assert.is(type.make('hi'), 'hi');

  // @ts-expect-error "Invalid make type"
  type.make(1234);
});

test('Data.string().guard()', () => {
  const type = Data.string();

  assert.is(type.guard('hi'), true);

  assert.is(type.guard(1234), false);
});

test('Data.number().make()', () => {
  const type = Data.number();

  assert.is(type.make(1234), 1234);

  // @ts-expect-error "Invalid make type"
  type.make('hi');
});

test('Data.number().guard()', () => {
  const type = Data.number();

  assert.is(type.guard(1234), true);

  assert.is(type.guard('hi'), false);
});

test('Data.boolean().make()', () => {
  const type = Data.boolean();

  assert.is(type.make(true), true);
  assert.is(type.make(false), false);

  // @ts-expect-error "Invalid make type"
  type.make('hi');
});

test('Data.boolean().guard()', () => {
  const type = Data.boolean();

  assert.is(type.guard(true), true);
  assert.is(type.guard(false), true);

  assert.is(type.guard('hi'), false);
});

test('Data.null().make()', () => {
  const type = Data.null();

  assert.is(type.make(null), null);

  // @ts-expect-error "Invalid make type"
  type.make('hi');
});

test('Data.null().guard()', () => {
  const type = Data.null();

  assert.is(type.guard(null), true);

  assert.is(type.guard('hi'), false);
});

test('Data.literal("hi").make()', () => {
  const type = Data.literal('hi');

  assert.is(type.make('hi'), 'hi');

  // @ts-expect-error "Invalid make type"
  type.make('hello');
});

test('Data.literal("hi").guard()', () => {
  const type = Data.literal('hi');

  assert.is(type.guard('hi'), true);

  assert.is(type.guard('hello'), false);
  assert.is(type.guard(1234), false);
});

test('Data.literal(NaN).make()', () => {
  const type = Data.literal(NaN);

  assert.equal(type.make(NaN), NaN);

  // @ts-expect-error "Invalid make type"
  type.make('NaN');
});

test('Data.literal(NaN).guard()', () => {
  const type = Data.literal(NaN);

  assert.is(type.guard(NaN), true);

  assert.is(type.guard('hello'), false);
  assert.is(type.guard(1234), false);
});

test('Data.literal([1, true, "three"]).make()', () => {
  const type = Data.enum([1, true, 'three']);

  assert.equal(type.make(1), 1);
  assert.equal(type.make(true), true);
  assert.equal(type.make('three'), 'three');

  // @ts-expect-error "Invalid make type"
  type.make('foo');
  // @ts-expect-error "Invalid make type"
  type.make(2);
  // @ts-expect-error "Invalid make type"
  type.make(false);
});

test('Data.literal([1, true, "three"]).guard()', () => {
  const type = Data.enum([1, true, 'three']);

  assert.is(type.guard(1), true);
  assert.is(type.guard(true), true);
  assert.is(type.guard('three'), true);

  assert.is(type.guard('foo'), false);
  assert.is(type.guard(2), false);
  assert.is(type.guard(false), false);
});

test('Data.unknown().make()', () => {
  const type = Data.unknown();

  assert.is(type.make(1234), 1234);
  assert.is(type.make('hi'), 'hi');
  assert.is(type.make(true), true);
  assert.is(type.make(null), null);
  assert.equal(type.make({ property: [1234] }), { property: [1234] });
});

test('Data.unknown().guard()', () => {
  const type = Data.unknown();

  assert.is(type.guard(1234), true);
  assert.is(type.guard('hi'), true);
  assert.is(type.guard(true), true);
  assert.is(type.guard(null), true);
  assert.is(type.guard({ property: [1234] }), true);
});

test('Data.array(Data.string()).make()', () => {
  const type = Data.array(Data.string());

  assert.equal(type.make([]), []);
  assert.equal(type.make(['hi']), ['hi']);
  assert.equal(type.make(['hi', 'hello', 'good day']), ['hi', 'hello', 'good day']);

  // @ts-expect-error "Invalid make type"
  type.make([123]);
});

test('Data.array(Data.string()).guard()', () => {
  const type = Data.array(Data.string());

  assert.is(type.guard('hi'), false);
  assert.is(type.guard([]), true);
  assert.is(type.guard(['hi']), true);
  assert.is(type.guard(['hi', 'hello', 'good day']), true);
  assert.is(type.guard(['hi', 'hello', 'good day']), true);
});

test('Data.record({ prop: Data.number() }).make()', () => {
  const type = Data.record({ prop: Data.number() });

  assert.is(type.make({ prop: 1234 }).prop, 1234);
  assert.instance(type.make({ prop: 1234 }), type);

  // @ts-expect-error "Invalid make type"
  type.make({ prop: '1234' });
  // @ts-expect-error "Invalid make type"
  type.make({ prop2: 1234 });
});

test('new Data.record({ prop: Data.number() }) > .make()', () => {
  const Type = Data.record({ prop: Data.number() });

  assert.is(new Type({ prop: 1234 }).prop, 1234);
  assert.instance(new Type({ prop: 1234 }), Type);

  // @ts-expect-error "Invalid new type"
  new Type({ prop: '1234' });
  // @ts-expect-error "Invalid new type"
  new Type({ prop2: 1234 });
});

test('new class Type extends Data.record({ prop: Data.number() }) {} > .make()', () => {
  class Type extends Data.record({ prop: Data.number() }) {}

  assert.is(new Type({ prop: 1234 }).prop, 1234);
  assert.instance(new Type({ prop: 1234 }), Type);

  // @ts-expect-error "Invalid new type"
  new Type({ prop: '1234' });
  // @ts-expect-error "Invalid new type"
  new Type({ prop2: 1234 });
});

test('Data.record({ prop: Data.number() }).guard()', () => {
  const type = Data.record({ prop: Data.number() });

  assert.is(type.guard({ prop: 1234 }), true);
  assert.is(type.guard({ prop: 0 }), true);
  assert.is(type.guard({ prop: NaN }), true);
  assert.is(type.guard({ prop: 'hey' }), false);
  assert.is(type.guard({ prop2: 1234 }), false);
  assert.is(type.guard([{ prop: 1234 }]), false);
  assert.is(type.guard({ prop: [1234] }), false);
});

test('new class Type extends Data.record({ prop: Data.number() }) {} > .guard()', () => {
  class Type extends Data.record({ prop: Data.number() }) {}

  assert.is(Type.guard({ prop: 1234 }), true);
  assert.is(Type.guard({ prop: 0 }), true);
  assert.is(Type.guard({ prop: NaN }), true);
  assert.is(Type.guard({ prop: 'hey' }), false);
  assert.is(Type.guard({ prop2: 1234 }), false);
  assert.is(Type.guard([{ prop: 1234 }]), false);
  assert.is(Type.guard({ prop: [1234] }), false);
});

test('Data.union([Data.number(), Data.string()]).make()', () => {
  const type = Data.union([Data.number(), Data.string()]);

  assert.is(type.make(1234), 1234);
  assert.is(type.make('hi'), 'hi');
  // @ts-expect-error "Invalid make type"
  type.make(true);
  // @ts-expect-error "Invalid make type"
  type.make([1234]);
});

test('Data.union([Data.number(), Data.string()]).guard()', () => {
  const type = Data.union([Data.number(), Data.string()]);

  assert.is(type.guard(1234), true);
  assert.is(type.guard('hi'), true);
  assert.is(type.guard(true), false);
  assert.is(type.guard([1234]), false);
});

test('Data.union([RecordOne, RecordTwo]).make()', () => {
  class RecordOne extends Data.record({
    propOne: Data.string(),
  }) {}
  class RecordTwo extends Data.record({
    propTwo: Data.number(),
  }) {}
  const type = Data.union([RecordOne, RecordTwo]);

  assert.is((type.make({ propOne: 'hi' }) as RecordOne).propOne, 'hi');
  assert.instance(type.make({ propOne: 'hi' }), RecordOne);
  assert.is((type.make({ propTwo: 1234 }) as RecordTwo).propTwo, 1234);
  assert.instance(type.make({ propTwo: 1234 }), RecordTwo);

  // @ts-expect-error "Invalid make type"
  type.make({ propOne: 1234 });
  // @ts-expect-error "Invalid make type"
  type.make({ propTwo: 'hi' });
  // @ts-expect-error "Invalid make type"
  type.make(true);
  // @ts-expect-error "Invalid make type"
  type.make({});
});

test('Data.union([RecordOne, RecordTwo]).guard()', () => {
  class RecordOne extends Data.record({
    propOne: Data.string(),
  }) {}
  class RecordTwo extends Data.record({
    propTwo: Data.number(),
  }) {}
  const type = Data.union([RecordOne, RecordTwo]);

  assert.is(type.guard({ propOne: 'hi' }), true);
  assert.is(type.guard({ propTwo: 1234 }), true);

  assert.is(type.guard({ propOne: 1234 }), false);
  assert.is(type.guard({ propTwo: 'hi' }), false);
  assert.is(type.guard(true), false);
  assert.is(type.guard({}), false);
});

test('Data.union([RecordOne, RecordTwo]).parse()', () => {
  class RecordOne extends Data.record({
    propOne: Data.string(),
  }) {}
  class RecordTwo extends Data.record({
    propTwo: Data.number(),
  }) {}
  const type = Data.union([RecordOne, RecordTwo]);
  const instanceOne = type.make({ propOne: 'hi' });
  const instanceTwo = type.make({ propTwo: 1234 });

  assert.instance(instanceOne, RecordOne);
  assert.instance(instanceTwo, RecordTwo);
  assert.instance(RecordOne.parse(instanceOne), RecordOne);
  assert.instance(RecordTwo.parse(instanceTwo), RecordTwo);
  assert.throws(() => RecordOne.parse(instanceTwo), /Can not parse .* into a RecordOne/);
  assert.throws(() => RecordTwo.parse(instanceOne), /Can not parse .* into a RecordTwo/);
});

test.run();
