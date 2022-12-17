import { IncrementSecret } from './IncrementSecret';
import { Field, PrivateKey, Poseidon, shutdown } from 'snarkyjs';
import { setup } from '../common/snarky';

let proofsEnabled = false;

describe.skip('IncrementSecret', () => {
  let owner: PrivateKey;
  let zkAppPrivateKey: PrivateKey;
  let zkApp: IncrementSecret;

  // contract specific
  let salt: Field;
  let secret: Field;

  beforeAll(async () => {
    // setup snarkyjs & obtain account
    owner = await setup(proofsEnabled);

    // deploy contract
    // salt = Field.random();
    // secret = Field(1337);
    // [zkApp, zkAppPrivateKey] = await IncrementSecret.deployTx(owner, salt, secret);
  });

  beforeEach(async () => {
    // deploy contract
    salt = Field.random();
    secret = Field(1337);
    [zkApp, zkAppPrivateKey] = await IncrementSecret.deployTx(owner, salt, secret);
  });

  it('should have correct secret on deployment', async () => {
    expect(zkApp.x.get()).toEqual(Poseidon.hash([salt, secret]));
  });

  it('should correctly update secret', async () => {
    await zkApp.incrementTx(owner, zkAppPrivateKey, salt, secret);

    secret = secret.add(1); // should be incremented
    expect(zkApp.x.get()).toEqual(Poseidon.hash([salt, secret]));
  });

  it('should not update secret with wrong salt', async () => {
    await zkApp.incrementTx(owner, zkAppPrivateKey, Field(999), secret);
  });

  it('should not update secret with wrong secret', async () => {
    await zkApp.incrementTx(owner, zkAppPrivateKey, salt, Field(999));
  });

  afterAll(async () => {
    // `shutdown()` internally calls `process.exit()` which will exit the running Jest process early.
    // Specifying a timeout of 0 is a workaround to defer `shutdown()` until Jest is done running all tests.
    // This should be fixed with https://github.com/MinaProtocol/mina/issues/10943
    setTimeout(shutdown, 0);
  });
});
