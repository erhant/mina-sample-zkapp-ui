import {
  Field,
  SmartContract,
  state,
  State,
  method,
  DeployArgs,
  Poseidon,
  Permissions,
  AccountUpdate,
  Mina,
  PrivateKey,
} from 'snarkyjs';

export class IncrementSecret extends SmartContract {
  @state(Field) x = State<Field>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  @method initState(salt: Field, firstSecret: Field) {
    this.x.set(Poseidon.hash([salt, firstSecret]));
  }

  @method incrementSecret(salt: Field, secret: Field) {
    const x = this.x.get();
    this.x.assertEquals(x);

    Poseidon.hash([salt, secret]).assertEquals(x);
    this.x.set(Poseidon.hash([salt, secret.add(1)]));
  }

  /**
   * Makes an update transaction
   * @param account message sender
   * @param zkAppPrivateKey private key of contract
   * @param salt salt
   * @param secret secret
   */
  async incrementTx(account: PrivateKey, zkAppPrivateKey: PrivateKey, salt: Field, secret: Field) {
    const tx = await Mina.transaction(account, () => {
      this.incrementSecret(salt, secret);
      this.requireSignature();
    });
    await tx.prove();
    await tx.sign([zkAppPrivateKey]).send();
  }

  /**
   * Deploys a IncrementSecret contract with a random private key
   * @param owner fee payer & deployer account
   * @param salt a random salt against hash precompute attacks
   * @param firstSecret initial secret
   * @returns the contract instance and its private key
   */
  static async deployTx(owner: PrivateKey, salt: Field, firstSecret: Field): Promise<[IncrementSecret, PrivateKey]> {
    // create a public/private key pair. The public key is our address and where we will deploy to
    const zkAppPrivateKey = PrivateKey.random();
    const zkAppAddress = zkAppPrivateKey.toPublicKey();

    // create an instance of our zkApp and deploy it
    const zkApp = new IncrementSecret(zkAppAddress);
    const tx = await Mina.transaction(owner, () => {
      AccountUpdate.fundNewAccount(owner);
      zkApp.deploy({ zkappKey: zkAppPrivateKey });
      zkApp.initState(salt, firstSecret);
      zkApp.requireSignature();
    });
    await tx.prove();
    await tx.sign([zkAppPrivateKey]).send();
    console.log('zkApp deployed.');

    return [zkApp, zkAppPrivateKey];
  }
}
