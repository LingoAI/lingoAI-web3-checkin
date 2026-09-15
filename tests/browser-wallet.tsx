// Local-only integration fixture. Vite does not include this entry in dist.
import { createRoot } from 'react-dom/client';
import { App } from '../src/App';
import { CHECK_IN_DATA } from '../src/web3/transactions';
import { CONTRACT, publicClient } from '../src/web3/config';
import '../styles.css';

if (location.hostname !== '127.0.0.1' && location.hostname !== 'localhost') throw new Error('Local test fixture only');
const address = '0x000000000000000000000000000000000000f00d' as const;
const hash = `0x${'dd'.repeat(32)}` as const;
let network = '0x1', added = false, sends = 0;
const listeners = new Map<string, (...args: any[]) => void>();
Object.defineProperty(window, 'ethereum', { value: {
  isMetaMask: false,
  on: (event: string, callback: (...args: any[]) => void) => listeners.set(event, callback),
  removeListener: (event: string) => listeners.delete(event),
  request: async ({ method, params }: { method: string; params: any[] }) => {
    document.documentElement.dataset.lastWalletMethod = method;
    if (method === 'eth_chainId') return network;
    if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [address];
    if (method === 'wallet_addEthereumChain') { added = true; document.documentElement.dataset.addedChain = params[0].chainId; return null; }
    if (method === 'wallet_switchEthereumChain') { if (!added) throw { code: 4902 }; network = params[0].chainId; listeners.get('chainChanged')?.(network); return null; }
    if (method === 'eth_sendTransaction') {
      const tx = params[0];
      if (network !== '0xcc' || tx.to.toLowerCase() !== CONTRACT || tx.data !== CHECK_IN_DATA || tx.from.toLowerCase() !== address) throw new Error('Unexpected test transaction');
      document.documentElement.dataset.mockTransactions = String(++sends);
      return hash;
    }
    throw new Error(`Unexpected mock method: ${method}`);
  },
}, configurable: true });
publicClient.getChainId = async () => 204;
publicClient.getCode = async () => '0x1234';
publicClient.simulateContract = (async args => ({ request: args, result: undefined })) as typeof publicClient.simulateContract;
publicClient.waitForTransactionReceipt = (async () => {
  await new Promise(resolve => setTimeout(resolve, 7000));
  return { status: 'success', transactionHash: hash, blockNumber: 12n };
}) as unknown as typeof publicClient.waitForTransactionReceipt;
publicClient.getTransaction = (async () => ({ hash, from: address, to: CONTRACT, input: CHECK_IN_DATA, value: 0n })) as unknown as typeof publicClient.getTransaction;
createRoot(document.getElementById('root')!).render(<App />);
