type Identity<T> = T;
type Flatten<T extends object> = Identity<{ [k in keyof T]: T[k] }>;

export type Constructor<T = unknown> = {
  make(t: T): T;
  guard(subject: unknown): subject is T;
  parse(subject: unknown): T;
  name: string;
};

export type ObjectOfConstructorsToTypes<T extends { [key: string]: Constructor }> = Flatten<
  {
    [key in keyof T]: ReturnType<T[key]['make']>;
  }
>;

export type ConstructorToType<T extends Constructor> = ReturnType<T['make']>;
