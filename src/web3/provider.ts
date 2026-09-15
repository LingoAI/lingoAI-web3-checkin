import { CHAIN_HEX, CHAIN_ID, networkParameters } from './config';

export interface WalletProvider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, listener: (...args: any[]) => void): void;
  removeListener?(event: string, listener: (...args: any[]) => void): void;
  disconnect?(): Promise<void>;
}
export interface WalletOption {
  id: string;
  name: string;
  provider: WalletProvider;
}

export function errorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return;
  const value = error as { code?: number; cause?: unknown; data?: { originalError?: unknown } };
  return errorCode(value.cause) ?? errorCode(value.data?.originalError) ?? value.code;
}

export function errorMessage(error: unknown): string {
  const code = errorCode(error);
  if (code === 4001 || code === 5000) return 'Wallet request cancelled. You can try again.';
  if (code === -32002) return 'A request is already pending in your wallet. Open your wallet to complete it first.';
  const text = error instanceof Error ? error.message : String(error);
  if (/insufficient funds|exceeds the balance/i.test(text)) return 'Not enough BNB on opBNB to pay the network fee. Add BNB and try again.';
  if (/revert/i.test(text)) return 'The contract rejected this check-in. You may have already checked in or may not be eligible yet. No successful check-in was recorded.';
  if (/fetch|network|timeout|timed out|http request/i.test(text)) return 'The network is not responding. Please try again shortly.';
  if (/chain|network/i.test(text)) return 'Switch your wallet to opBNB mainnet to continue.';
  return text.length < 160 ? text : 'The wallet request could not be completed. Please try again.';
}

export async function ensureOpBNB(provider: WalletProvider) {
  const current = await provider.request({ method: 'eth_chainId' });
  if (Number(current) === CHAIN_ID) return;
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_HEX }] });
  } catch (error) {
    if (errorCode(error) !== 4902) throw error;
    await provider.request({ method: 'wallet_addEthereumChain', params: [networkParameters] });
    // Adding a network does not imply switching to it.
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_HEX }] });
  }
  if (Number(await provider.request({ method: 'eth_chainId' })) !== CHAIN_ID) {
    throw new Error('Your wallet has not switched to opBNB mainnet.');
  }
}

export function discoverWallets(onWallet: (wallet: WalletOption) => void) {
  const seen = new Set<WalletProvider>();
  const add = (wallet: WalletOption) => {
    if (typeof wallet.provider?.request === 'function' && !seen.has(wallet.provider)) {
      seen.add(wallet.provider);
      onWallet(wallet);
    }
  };
  const announce = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail?.info?.uuid && detail?.info?.name) {
      add({ id: `eip6963:${detail.info.rdns || detail.info.name}`, name: String(detail.info.name).slice(0, 60), provider: detail.provider });
    }
  };
  window.addEventListener('eip6963:announceProvider', announce);
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  const detectInjected = () => {
    const legacy = (window as Window & { ethereum?: WalletProvider & { providers?: WalletProvider[]; isMetaMask?: boolean } }).ethereum;
    (legacy?.providers ?? (legacy ? [legacy] : [])).forEach((provider, index) => add({
      id: `injected-${index}`, name: (provider as typeof legacy)?.isMetaMask ? 'MetaMask' : 'Browser wallet', provider,
    }));
  };
  // Mobile wallets may inject after React mounts. Detection never requests accounts.
  window.addEventListener('ethereum#initialized', detectInjected);
  window.addEventListener('focus', detectInjected);
  detectInjected();
  return () => {
    window.removeEventListener('eip6963:announceProvider', announce);
    window.removeEventListener('ethereum#initialized', detectInjected);
    window.removeEventListener('focus', detectInjected);
  };
}
