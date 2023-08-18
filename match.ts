import { unknown } from "./constructors.ts";
import { Constructor } from "./interfaces.ts";

interface CompleteMatch<Return> {
  run(): Return;
}

interface IncompleteMatch<Subject, Return> {
  with<Handle extends Subject, NewReturn>(
    target: Constructor<Handle>,
    handler: (value: Handle) => NewReturn,
  ): WithReturn<Subject, Handle, Return | NewReturn>;

  default<NewReturn>(
    handler: (value: Subject) => NewReturn,
  ): CompleteMatch<Return | NewReturn>;
}

type WithReturn<Subject, Handle, Return> = Exclude<Subject, Handle> extends
  never ? CompleteMatch<Return>
  : IncompleteMatch<Exclude<Subject, Handle>, Return>;

type MatchMap<Subject, Return> = Map<
  Constructor<Subject>,
  (value: unknown) => Return
>;

class MatchBuilder<Subject, Return>
  implements IncompleteMatch<Subject, Return>, CompleteMatch<Return> {
  constructor(
    private value: Subject,
    private map: MatchMap<Subject, Return> = new Map(),
  ) {}

  with<Handle extends Subject, NewReturn>(
    target: Constructor<Handle>,
    handler: (value: Handle) => NewReturn,
  ) {
    const map = new Map(this.map) as MatchMap<Subject, Return | NewReturn>;
    map.set(target, handler as (value: unknown) => Return | NewReturn);
    return new MatchBuilder(
      this.value as Exclude<Subject, Handle>,
      map as MatchMap<Exclude<Subject, Handle>, Return | NewReturn>,
    );
  }

  default<NewReturn>(handler: (value: Subject) => NewReturn) {
    const map = new Map(this.map) as MatchMap<Subject, Return | NewReturn>;
    map.set(
      unknown() as Constructor<Subject>,
      handler as (value: unknown) => Return | NewReturn,
    );
    return new MatchBuilder(this.value as never, map);
  }

  run() {
    for (const [constructor, handler] of this.map.entries()) {
      if (constructor.guard(this.value)) {
        return handler(this.value);
      }
    }
    throw new Error("Unexpected incomplete match");
  }
}

export function match<T>(value: T): IncompleteMatch<T, never> {
  return new MatchBuilder<T, never>(value);
}
