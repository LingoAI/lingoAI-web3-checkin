import { createWalletClient, custom, encodeFunctionData, isAddress, isHash, type Address, type EIP1193Provider, type Hash } from 'viem';
import { chain, CHAIN_ID, CONTRACT, checkInAbi, publicClient } from './config';
import { ensureOpBNB, type WalletProvider } from './provider';

export const CHECK_IN_DATA = encodeFunctionData({ abi: checkInAbi, functionName: 'checkIn' });
export class RevertedCheckIn extends Error {}
export class ReplacedCheckIn extends Error {}
export interface PendingCheckIn { address: Address; hash: Hash }
export const pendingKey = (address: Address) => `lingoholon:checkin:${CHAIN_ID}:${CONTRACT}:${address.toLowerCase()}`;
const memoryRecords = new Map<string, PendingCheckIn>();

export function loadPending(address: Address): PendingCheckIn | undefined {
  const memory = memoryRecords.get(pendingKey(address));
  if (memory) return memory;
  try {
    const saved = JSON.parse(localStorage.getItem(pendingKey(address)) ?? 'null');
    if (saved && isAddress(saved.address) && saved.address.toLowerCase() === address.toLowerCase() && isHash(saved.hash)) return saved;
  } catch { /* Storage can be unavailable in private browsing. */ }
}
export function savePending(record: PendingCheckIn) {
  memoryRecords.set(pendingKey(record.address), record);
  try { localStorage.setItem(pendingKey(record.address), JSON.stringify(record)); } catch { /* The in-memory receipt watcher still runs. */ }
}
export function clearPending(address: Address) {
  memoryRecords.delete(pendingKey(address));
  try { localStorage.removeItem(pendingKey(address)); } catch { /* Storage is optional. */ }
}

export async function prepareCheckIn(address: Address) {
  if (await publicClient.getChainId() !== CHAIN_ID) throw new Error('The RPC is not on opBNB mainnet. Transaction stopped.');
  const code = await publicClient.getCode({ address: CONTRACT });
  if (!code || code === '0x') throw new Error('The check-in contract was not found on opBNB. Transaction stopped.');
  // No value or token approvals are requested. The contract decides eligibility.
  return publicClient.simulateContract({ address: CONTRACT, abi: checkInAbi, functionName: 'checkIn', account: address });
}

export async function sendCheckIn(provider: WalletProvider, address: Address, onWalletPrompt: () => void): Promise<Hash> {
  await ensureOpBNB(provider);
  const { request } = await prepareCheckIn(address);
  const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
  if (accounts[0]?.toLowerCase() !== address.toLowerCase()) throw new Error('Your wallet account changed. Please try again with the current account.');
  if (Number(await provider.request({ method: 'eth_chainId' })) !== CHAIN_ID) throw new Error('Your wallet is no longer on opBNB. Switch back and try again.');
  onWalletPrompt();
  const wallet = createWalletClient({ chain, transport: custom(provider as EIP1193Provider) });
  return wallet.writeContract({ ...request, account: address, chain });
}

export function isExpectedTransaction(tx: { from: string; to: string | null; input: string; value: bigint }, address: Address) {
  return tx.from.toLowerCase() === address.toLowerCase()
    && tx.to?.toLowerCase() === CONTRACT.toLowerCase()
    && tx.input.toLowerCase() === CHECK_IN_DATA.toLowerCase()
    && tx.value === 0n;
}

export async function confirmCheckIn(record: PendingCheckIn, onReplacement: (record: PendingCheckIn) => void) {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: record.hash, confirmations: 1, timeout: 120_000,
    onReplaced: ({ transaction }) => {
      // A speed-up keeps the intent; a cancellation or a different call does not.
      if (isExpectedTransaction(transaction, record.address)) {
        record = { ...record, hash: transaction.hash };
        savePending(record); onReplacement(record);
      }
    },
  });
  const tx = await publicClient.getTransaction({ hash: receipt.transactionHash });
  if (!isExpectedTransaction(tx, record.address)) throw new ReplacedCheckIn('The transaction was cancelled or replaced. No successful check-in was recorded.');
  if (receipt.status !== 'success') throw new RevertedCheckIn('The transaction reverted. This check-in was not completed.');
  return { hash: receipt.transactionHash, blockNumber: receipt.blockNumber };
}
