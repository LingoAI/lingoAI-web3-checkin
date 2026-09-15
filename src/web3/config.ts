import { createPublicClient, fallback, http, parseAbi } from 'viem';
import { opBNB } from 'viem/chains';

export const chain = opBNB;
export const CHAIN_ID = 204;
export const CHAIN_HEX = '0xcc';
export const CONTRACT = '0x28f429e960b1ab313db8db36499c4cc24f8a16c1' as const;
export const RPC_URL = 'https://opbnb-mainnet-rpc.bnbchain.org';
export const EXPLORER = 'https://opbnb.bscscan.com';
export const checkInAbi = parseAbi(['function checkIn()']);
export const publicClient = createPublicClient({
  chain,
  transport: fallback([
    http(RPC_URL, { timeout: 12_000, retryCount: 1 }),
    http('https://opbnb.publicnode.com', { timeout: 12_000, retryCount: 1 }),
  ]),
  pollingInterval: 2_000,
});
export const networkParameters = {
  chainId: CHAIN_HEX,
  chainName: 'opBNB Mainnet',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [EXPLORER],
};

export const transactionUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
