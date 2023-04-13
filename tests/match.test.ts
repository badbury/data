import { test } from 'uvu';
import assert from 'uvu/assert';
import { Data, match } from '../src';

test('match(Data.union([RecordOne, RecordTwo]))', () => {
  class RecordOne extends Data.record({
    propOne: Data.string(),
  }) {}
  class RecordTwo extends Data.record({
    propTwo: Data.number(),
  }) {}
  const RecordThree = Data.record({
    propThree: Data.array(Data.string()),
  });
  const Bool = Data.boolean();
  const type = Data.union([RecordOne, RecordTwo, RecordThree, Bool]);
  const instanceOne = type.make({ propOne: 'hi' });
  const instanceTwo = type.make({ propTwo: 1234 });
  const instanceThree = type.make({ propThree: ['a', 'b', 'c'] });
  const instanceFour = type.make(false);

  function getString(
    instance:
      | RecordOne
      | RecordTwo
      | ReturnType<typeof RecordThree['make']>
      | ReturnType<typeof Bool['make']>,
  ) {
    return match(instance)
      .with(RecordOne, (value) => value.propOne)
      .with(RecordTwo, (value) => String(value.propTwo))
      .with(RecordThree, (value) => value.propThree.join(','))
      .with(Bool, (value) => (value ? 'true' : 'false'))
      .run();
  }

  assert.is(getString(instanceOne), 'hi');
  assert.is(getString(instanceTwo), '1234');
  assert.is(getString(instanceThree), 'a,b,c');
  assert.is(getString(instanceFour), 'false');

  assert.is(getString({ propOne: 'hi' }), 'hi');
  assert.is(getString({ propTwo: 1234 }), '1234');
  assert.is(getString({ propThree: ['a', 'b', 'c'] }), 'a,b,c');
  assert.is(getString(false), 'false');
});

test('match with default', () => {
  class RecordOne extends Data.record({
    propOne: Data.string(),
  }) {}
  class RecordTwo extends Data.record({
    propTwo: Data.number(),
  }) {}
  const RecordThree = Data.record({
    propThree: Data.array(Data.string()),
  });
  const Bool = Data.boolean();
  const type = Data.union([RecordOne, RecordTwo, RecordThree, Bool]);
  const instanceOne = type.make({ propOne: 'hi' });
  const instanceTwo = type.make({ propTwo: 1234 });
  const instanceThree = type.make({ propThree: ['a', 'b', 'c'] });
  const instanceFour = type.make(false);

  function getString(
    instance:
      | RecordOne
      | RecordTwo
      | ReturnType<typeof RecordThree['make']>
      | ReturnType<typeof Bool['make']>,
  ) {
    return match(instance)
      .with(RecordOne, (value) => value.propOne)
      .with(RecordTwo, (value) => String(value.propTwo))
      .default((value) => JSON.stringify(value))
      .run();
  }

  assert.is(getString(instanceOne), 'hi');
  assert.is(getString(instanceTwo), '1234');
  assert.is(getString(instanceThree), '{"propThree":["a","b","c"]}');
  assert.is(getString(instanceFour), 'false');

  assert.is(getString({ propOne: 'hi' }), 'hi');
  assert.is(getString({ propTwo: 1234 }), '1234');
  assert.is(getString({ propThree: ['a', 'b', 'c'] }), '{"propThree":["a","b","c"]}');
  assert.is(getString(false), 'false');
});

test.run();
