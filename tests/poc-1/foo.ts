import { contract } from './contracts';

export const doThing = contract<(one: string, two: number) => string>();
