import { useCallback, useEffect, useRef, useState } from 'react';
import { getAddress, isAddress, type Address, type Hash } from 'viem';
import { CHAIN_ID, RPC_URL } from './config';
import { discoverWallets, ensureOpBNB, errorMessage, type WalletOption, type WalletProvider } from './provider';
import { clearPending, confirmCheckIn, loadPending, prepareCheckIn, ReplacedCheckIn, RevertedCheckIn, savePending, sendCheckIn, type PendingCheckIn } from './transactions';

export type Phase = 'idle' | 'connecting' | 'switching' | 'checking' | 'ready' | 'signing' | 'pending' | 'success' | 'error';
export interface WalletState { address?: Address; chainId?: number; name?: string; phase: Phase; message: string; hash?: Hash }
const initial: WalletState = { phase: 'idle', message: 'Support Holon on opBNB.' };
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim();

export function useWallet() {
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [state, setState] = useState<WalletState>(initial);
  const selected = useRef<{ provider: WalletProvider; address?: Address; name: string } | null>(null);
  const generation = useRef(0);
  const locked = useRef(false);
  const unlisten = useRef<() => void>(() => {});
  const mounted = useRef(true);
  const connecting = useRef(false);
  const watches = useRef(new Map<string, Promise<void>>());
  const wc = useRef<WalletProvider | null>(null);
  const wcInit = useRef<Promise<WalletProvider & { enable(): Promise<string[]> }> | null>(null);
  const accountIsCurrent = (address: Address) => mounted.current && selected.current?.address?.toLowerCase() === address.toLowerCase();
  const update = (address: Address, patch: Partial<WalletState>) => { if (accountIsCurrent(address)) setState(s => ({ ...s, ...patch })); };

  const watch = useCallback((record: PendingCheckIn): Promise<void> => {
    const key = record.address.toLowerCase();
    if (watches.current.has(key)) return watches.current.get(key)!;
    update(record.address, { phase: 'pending', hash: record.hash, message: 'Transaction submitted. Waiting for confirmation on opBNB.' });
    const promise = confirmCheckIn(record, replacement => update(record.address, { hash: replacement.hash }))
      .then(result => {
        // Retain the hash for receipt re-verification after reload. Never trust a cached success flag.
        savePending({ address: record.address, hash: result.hash });
        update(record.address, { phase: 'success', hash: result.hash, message: 'Check-in complete. Thank you for your support!' });
      })
      .catch(error => {
        if (error instanceof RevertedCheckIn || error instanceof ReplacedCheckIn) {
          clearPending(record.address);
          update(record.address, { phase: 'error', message: error.message });
        } else {
          update(record.address, { phase: 'pending', message: 'Confirmation is not available yet. Your transaction may still be pending. Refresh its status instead of submitting again.' });
        }
      }).finally(() => watches.current.delete(key));
    watches.current.set(key, promise);
    return promise;
  }, []);

  const refresh = useCallback(async () => {
    const current = selected.current;
    if (!current?.address || locked.current || connecting.current) return;
    const { address, provider } = current;
    const revision = generation.current;
    const saved = loadPending(address);
    update(address, { phase: 'checking', message: 'Checking your check-in status on opBNB.' });
    try {
      const chainId = Number(await provider.request({ method: 'eth_chainId' }));
      if (revision !== generation.current) return;
      update(address, { chainId });
      if (saved) { await watch(saved); return; }
      if (chainId !== CHAIN_ID) { update(address, { phase: 'idle', message: 'Switch to opBNB mainnet to check in.' }); return; }
      await prepareCheckIn(address);
      if (revision === generation.current && !locked.current && !loadPending(address)) update(address, { phase: 'ready', message: 'Connected to opBNB. You are ready to check in.', hash: undefined });
    } catch (error) {
      if (revision === generation.current && !locked.current && !loadPending(address)) update(address, { phase: 'error', message: errorMessage(error) });
    }
  }, [watch]);

  const attach = useCallback(async (provider: WalletProvider, name: string, requestAccounts: boolean) => {
    const revision = ++generation.current;
    unlisten.current();
    const accounts = await provider.request({ method: requestAccounts ? 'eth_requestAccounts' : 'eth_accounts' }) as string[];
    if (!mounted.current || revision !== generation.current) return;
    if (!accounts[0] || !isAddress(accounts[0])) throw new Error('Your wallet has not authorized an account.');
    const address = getAddress(accounts[0]);
    const chainId = Number(await provider.request({ method: 'eth_chainId' }));
    if (revision !== generation.current) return;
    selected.current = { provider, address, name };
    setState({ address, name, chainId, phase: 'idle', message: 'Wallet connected.' });
    const accountsChanged = (accounts: string[]) => {
      generation.current++;
      const next = accounts[0] && isAddress(accounts[0]) ? getAddress(accounts[0]) : undefined;
      if (selected.current?.provider !== provider) return;
      selected.current.address = next;
      setState({ ...initial, address: next, name, chainId: undefined });
      if (next) void refresh();
    };
    const chainChanged = (value: string | number) => {
      generation.current++;
      if (selected.current?.provider !== provider) return;
      setState(s => ({ ...s, chainId: Number(value), ...(locked.current ? {} : { phase: 'idle' as Phase, message: Number(value) === CHAIN_ID ? 'Switched to opBNB.' : 'Switch to opBNB mainnet to check in.' }) }));
      if (!locked.current) void refresh();
    };
    const disconnected = () => {
      if (selected.current?.provider !== provider) return;
      generation.current++; selected.current = null; setState(initial);
    };
    provider.on?.('accountsChanged', accountsChanged);
    provider.on?.('chainChanged', chainChanged);
    provider.on?.('disconnect', disconnected);
    unlisten.current = () => {
      provider.removeListener?.('accountsChanged', accountsChanged);
      provider.removeListener?.('chainChanged', chainChanged);
      provider.removeListener?.('disconnect', disconnected);
    };
  }, [refresh]);

  const connect = useCallback(async (wallet: WalletOption) => {
    if (connecting.current || locked.current) return;
    connecting.current = true;
    setState(s => ({ ...s, phase: 'connecting', message: 'Confirm the connection in your wallet.' }));
    try {
      await attach(wallet.provider, wallet.name, true);
      if (selected.current?.provider !== wallet.provider) return;
      setState(s => ({ ...s, phase: 'switching', message: 'Confirm switching to or adding opBNB in your wallet.' }));
      await ensureOpBNB(wallet.provider);
      try { localStorage.setItem('lingoholon:wallet', wallet.id); } catch { /* Optional preference. */ }
    } catch (error) { if (mounted.current) setState(s => ({ ...s, phase: 'error', message: errorMessage(error) })); return; }
    finally { connecting.current = false; }
    if (selected.current?.address) await refresh();
    return selected.current?.provider === wallet.provider && Boolean(selected.current.address);
  }, [attach, refresh]);

  const getWalletConnect = useCallback(async () => {
    if (!projectId) throw new Error('A WalletConnect project ID has not been configured.');
    if (!wcInit.current) {
      wcInit.current = import('@walletconnect/ethereum-provider').then(async ({ EthereumProvider }) => {
        const provider = await EthereumProvider.init({
          projectId, optionalChains: [CHAIN_ID], showQrModal: true,
          rpcMap: { [CHAIN_ID]: RPC_URL },
          metadata: { name: 'Holon', description: 'Check in to support Holon on opBNB', url: location.origin, icons: [`${location.origin}/assets/holon-logo.svg`] },
        });
        wc.current = provider as unknown as WalletProvider;
        return provider as unknown as WalletProvider & { enable(): Promise<string[]> };
      }).catch(error => { wcInit.current = null; throw error; });
    }
    return wcInit.current;
  }, []);

  const connectWalletConnect = useCallback(async () => {
    if (!projectId || connecting.current || locked.current) return;
    connecting.current = true;
    setState(s => ({ ...s, phase: 'connecting', message: 'Choose your mobile wallet and confirm the connection.' }));
    try {
      const provider = await getWalletConnect();
      await provider.enable();
      await attach(provider, 'WalletConnect', false);
      await ensureOpBNB(provider);
      try { localStorage.setItem('lingoholon:wallet', 'walletconnect'); } catch { /* Optional preference. */ }
    } catch (error) { if (mounted.current) setState(s => ({ ...s, phase: 'error', message: errorMessage(error) })); return; }
    finally { connecting.current = false; }
    if (selected.current?.address) await refresh();
  }, [getWalletConnect, attach, refresh]);

  const switchNetwork = useCallback(async () => {
    if (!selected.current || connecting.current || locked.current) return;
    connecting.current = true;
    setState(s => ({ ...s, phase: 'switching', message: 'Switch to or add opBNB in your wallet.' }));
    try { await ensureOpBNB(selected.current.provider); }
    catch (error) { setState(s => ({ ...s, phase: 'error', message: errorMessage(error) })); return; }
    finally { connecting.current = false; }
    await refresh();
  }, [refresh]);

  const checkIn = useCallback(async (wallet?: WalletOption) => {
    if (locked.current || connecting.current) return;
    if (!selected.current?.address) {
      if (!wallet || !await connect(wallet)) return;
      // Connection refresh already recovered a saved transaction, if present.
      if (selected.current?.address && loadPending(selected.current.address)) return;
    }
    const current = selected.current;
    if (!current?.address || locked.current || connecting.current) return;
    const { address, provider } = current;
    const existing = loadPending(address);
    if (existing) { await watch(existing); return; }
    locked.current = true;
    update(address, { phase: 'checking', message: 'Checking your transaction before submission.', hash: undefined });
    try {
      const hash = await sendCheckIn(provider, address, () => update(address, { phase: 'signing', message: 'Review and confirm the check-in transaction and network fee in your wallet.' }));
      const record = { address, hash };
      savePending(record);
      locked.current = false;
      await watch(record);
    } catch (error) { update(address, { phase: 'error', message: errorMessage(error) }); }
    finally {
      locked.current = false;
      if (selected.current?.address && !accountIsCurrent(address)) void refresh();
    }
  }, [watch, refresh, connect]);

  const disconnect = useCallback(() => {
    generation.current++; unlisten.current(); selected.current = null;
    try { localStorage.removeItem('lingoholon:wallet'); } catch { /* Optional preference. */ }
    if (wc.current) void wc.current.disconnect?.().catch(() => {});
    setState(initial);
  }, []);

  // Eligibility and timing belong to the contract, not the device clock.
  const newCheckIn = useCallback(async () => {
    const current = selected.current;
    if (!current?.address || state.phase !== 'success' || locked.current || connecting.current) return;
    const { address, provider } = current;
    const revision = generation.current;
    locked.current = true;
    update(address, { phase: 'checking', message: 'Checking whether you are eligible to check in again.' });
    try {
      await ensureOpBNB(provider);
      await prepareCheckIn(address);
      if (revision !== generation.current) return;
      clearPending(address);
      update(address, { phase: 'ready', message: 'You are eligible to check in again.', hash: undefined });
    } catch (error) {
      if (revision === generation.current) update(address, { phase: 'success', message: `Your previous check-in is confirmed. ${errorMessage(error)}` });
    } finally {
      locked.current = false;
      if (revision !== generation.current) void refresh();
    }
  }, [state.phase, refresh]);

  useEffect(() => {
    mounted.current = true;
    const stop = discoverWallets(wallet => setWallets(current => current.some(w => w.provider === wallet.provider) ? current : [...current, wallet]));
    return () => { mounted.current = false; generation.current++; stop(); unlisten.current(); };
  }, []);
  useEffect(() => {
    if (selected.current || connecting.current) return;
    let saved: string | null = null;
    try { saved = localStorage.getItem('lingoholon:wallet'); } catch { return; }
    if (saved === 'walletconnect' && projectId) {
      connecting.current = true;
      void getWalletConnect().then(provider => attach(provider, 'WalletConnect', false))
        .catch(() => {}).finally(() => { connecting.current = false; void refresh(); });
      return;
    }
    const wallet = wallets.find(w => w.id === saved);
    if (!wallet) return;
    connecting.current = true;
    void attach(wallet.provider, wallet.name, false).catch(() => {}).finally(() => { connecting.current = false; void refresh(); });
  }, [wallets, attach, refresh, getWalletConnect]);

  return { state, wallets, connect, connectWalletConnect, walletConnectEnabled: Boolean(projectId), switchNetwork, checkIn, refresh, newCheckIn, disconnect };
}
