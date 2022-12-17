import { isReady, Mina, shutdown } from 'snarkyjs';
import { Add } from '../contracts/Add';

/**
 * Sets up Mina local blockchain.
 * @returns fee payer account
 */
export async function setup(proofsEnabled: boolean) {
  const LABEL = 'Loading SnarkyJS';
  console.time(LABEL);
  await isReady;
  console.timeEnd(LABEL);

  if (proofsEnabled) Add.compile();

  const localBC = Mina.LocalBlockchain({ proofsEnabled });
  Mina.setActiveInstance(localBC);
  return localBC.testAccounts[0].privateKey;
}
