import { test } from 'uvu';
import assert from 'uvu/assert';
// import * as Foo from './foo';
import { assertContractsAreBound, bind } from './contracts';

test('Duno', async () => {
  // bindContract(Foo).to();
  // await register();
  await bind({
    contract: () => import('./foo'),
    to: () => ({
      doThing: () => 'mocked boy',
    }),
  });

  const { main } = await import('./thing-using-foo');
  main();
  assertContractsAreBound();
});

test.run();
