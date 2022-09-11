import { unknown } from './constructors';
import { Constructor } from './interfaces';

interface CompleteMatch<R> {
  run(): R;
}

interface IncompleteMatch<T, L, R> {
  with<I extends T, K>(target: Constructor<I>, handler: (value: I) => K): WithReturn<T, L, I, R, K>;

  default<K>(handler: (value: Exclude<T, L>) => K): CompleteMatch<R | K>;
}

type WithReturn<T, L, I, R, K> = Exclude<T, L | I> extends never
  ? CompleteMatch<R | K>
  : IncompleteMatch<T, L | I, R | K>;

class MatchBuilder<T, L, R> implements IncompleteMatch<T, L, R>, CompleteMatch<R> {
  constructor(private value: T, private map: Map<Constructor<T>, (value: T) => R> = new Map()) {}
  with<I extends T, K>(target: Constructor<I>, handler: (value: I) => K) {
    const map: Map<Constructor<T>, (value: T) => R | K> = new Map(this.map);
    map.set(target, handler as (value: T) => R | K);
    return new MatchBuilder<T, L | I, R | K>(this.value, map);
  }
  default<K>(handler: (value: Exclude<T, L>) => K) {
    const map: Map<Constructor<T>, (value: T) => R | K> = new Map(this.map);
    map.set(unknown() as Constructor<T>, handler as (value: T) => R | K);
    return new MatchBuilder(this.value, map);
  }
  run() {
    for (const [constructor, handler] of this.map.entries()) {
      if (constructor.guard(this.value)) {
        return handler(this.value);
      }
    }
    throw new Error('Unexpected incomplete match');
  }
}

export function match<T>(value: T): IncompleteMatch<T, never, never> {
  return new MatchBuilder<T, never, never>(value);
}
