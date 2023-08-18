import { Data, match } from "./mod.ts";
import { assertEquals } from "https://deno.land/std@0.198.0/assert/mod.ts";

Deno.test("match(Data.union([RecordOne, RecordTwo]))", () => {
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
  const instanceOne = type.make({ propOne: "hi" });
  const instanceTwo = type.make({ propTwo: 1234 });
  const instanceThree = type.make({ propThree: ["a", "b", "c"] });
  const instanceFour = type.make(false);

  function getString(
    instance:
      | RecordOne
      | RecordTwo
      | ReturnType<typeof RecordThree["make"]>
      | ReturnType<typeof Bool["make"]>,
  ) {
    return match(instance)
      .with(RecordOne, (value) => value.propOne)
      .with(RecordTwo, (value) => String(value.propTwo))
      .with(RecordThree, (value) => value.propThree.join(","))
      .with(Bool, (value) => (value ? "true" : "false"))
      .run();
  }

  assertEquals(getString(instanceOne), "hi");
  assertEquals(getString(instanceTwo), "1234");
  assertEquals(getString(instanceThree), "a,b,c");
  assertEquals(getString(instanceFour), "false");

  assertEquals(getString({ propOne: "hi" }), "hi");
  assertEquals(getString({ propTwo: 1234 }), "1234");
  assertEquals(getString({ propThree: ["a", "b", "c"] }), "a,b,c");
  assertEquals(getString(false), "false");
});

Deno.test("match with default", () => {
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
  const instanceOne = type.make({ propOne: "hi" });
  const instanceTwo = type.make({ propTwo: 1234 });
  const instanceThree = type.make({ propThree: ["a", "b", "c"] });
  const instanceFour = type.make(false);

  const getString = (
    instance:
      | RecordOne
      | RecordTwo
      | ReturnType<typeof RecordThree["make"]>
      | ReturnType<typeof Bool["make"]>,
  ) =>
    match(instance)
      .with(RecordOne, (value) => value.propOne)
      .with(RecordTwo, (value) => String(value.propTwo))
      .default((value) => JSON.stringify(value))
      .run();

  assertEquals(getString(instanceOne), "hi");
  assertEquals(getString(instanceTwo), "1234");
  assertEquals(getString(instanceThree), '{"propThree":["a","b","c"]}');
  assertEquals(getString(instanceFour), "false");

  assertEquals(getString({ propOne: "hi" }), "hi");
  assertEquals(getString({ propTwo: 1234 }), "1234");
  assertEquals(
    getString({ propThree: ["a", "b", "c"] }),
    '{"propThree":["a","b","c"]}',
  );
  assertEquals(getString(false), "false");
});
