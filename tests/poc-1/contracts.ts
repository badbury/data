type AnyFunction = (...args: any[]) => unknown;

const ContractResolver = {
  contracts: [] as Contract[],
};

interface Contract<T extends AnyFunction = AnyFunction> {
  (...args: Parameters<T>): ReturnType<T>;
  handler: T;
  isContract: true;
  isBound: boolean;
}

const emptyHandler = (() => {
  throw new Error('Handler not set');
}) as unknown;

export function contract<T extends AnyFunction>(): T {
  const stub = function (this: Contract<T>, ...args: Parameters<T>): ReturnType<T> {
    return stub.handler(...args) as ReturnType<T>;
  } as Contract<T>;
  stub.isContract = true;
  stub.isBound = false;
  stub.handler = emptyHandler as T;
  ContractResolver.contracts.push(stub);
  return (stub as unknown) as T;
}

type ContractModule = Record<string, AnyFunction>;
type Identity<T> = T;
type Flatten<T extends object> = Identity<{ [k in keyof T]: T[k] }>;

type BindRules<T extends ContractModule> = {
  contract: () => Promise<T> | T;
  to: () => Promise<Flatten<T>> | Flatten<T>;
};

export async function bind<T extends ContractModule>(rules: BindRules<T>) {
  const contracts = await rules.contract();
  const concrete = await rules.to();
  for (const contractName in contracts) {
    const contract = (contracts[contractName] as unknown) as Contract;
    if (contract.isContract) {
      contract.handler = concrete[contractName];
      contract.isBound = true;
    }
  }
}

export function resetAllContracts<T extends ContractModule>() {
  for (const contract of ContractResolver.contracts) {
    contract.handler = emptyHandler as typeof contract;
    contract.isBound = false;
  }
}

export function assertContractsAreBound() {
  for (const contract of ContractResolver.contracts) {
    if (!contract.isBound) {
      throw new Error('An imported contract is not bound');
    }
  }
}
