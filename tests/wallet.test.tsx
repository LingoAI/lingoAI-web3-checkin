// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Address, Hash } from 'viem';
import { useWallet } from '../src/web3/useWallet';
import { clearPending, confirmCheckIn, loadPending, prepareCheckIn, savePending, sendCheckIn } from '../src/web3/transactions';
import type { WalletProvider } from '../src/web3/provider';

vi.mock('../src/web3/transactions', async importOriginal => ({
  ...await importOriginal<typeof import('../src/web3/transactions')>(),
  prepareCheckIn: vi.fn(), sendCheckIn: vi.fn(), confirmCheckIn: vi.fn(),
}));
const address = '0x1111111111111111111111111111111111111111' as Address;
const other = '0x2222222222222222222222222222222222222222' as Address;
const hash = `0x${'ab'.repeat(32)}` as Hash;
function deferred<T>() { let resolve!: (v: T) => void; let reject!: (e: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function mockWallet() {
  const listeners = new Map<string, (...args: any[]) => void>();
  let accounts = [address];
  const provider: WalletProvider = {
    request: vi.fn(async ({ method }) => method === 'eth_chainId' ? '0xcc' : accounts),
    on: (event, fn) => { listeners.set(event, fn); },
    removeListener: event => { listeners.delete(event); },
  };
  return { id: 'test-wallet', name: 'Test Wallet', provider, changeAccount(next: Address) { accounts = [next]; listeners.get('accountsChanged')?.(accounts); } };
}
beforeEach(() => { vi.resetAllMocks(); localStorage.clear(); clearPending(address); clearPending(other); vi.mocked(prepareCheckIn).mockResolvedValue({ request: {} } as never); });
afterEach(cleanup);

describe('wallet check-in lifecycle', () => {
  it('deduplicates clicks, keeps pending after hash, then confirms success', async () => {
    const signed = deferred<Hash>(); const mined = deferred<{ hash: Hash; blockNumber: bigint }>();
    vi.mocked(sendCheckIn).mockReturnValue(signed.promise);
    vi.mocked(confirmCheckIn).mockReturnValue(mined.promise);
    const { result } = renderHook(useWallet);
    await act(() => result.current.connect(mockWallet()));
    expect(result.current.state.phase).toBe('ready');
    let completion!: Promise<void>;
    act(() => { completion = result.current.checkIn(); void result.current.checkIn(); });
    expect(sendCheckIn).toHaveBeenCalledTimes(1);
    await act(async () => { signed.resolve(hash); await signed.promise; });
    expect(result.current.state.phase).toBe('pending');
    expect(loadPending(address)?.hash).toBe(hash);
    act(() => { void result.current.checkIn(); });
    expect(sendCheckIn).toHaveBeenCalledTimes(1);
    await act(async () => { mined.resolve({ hash, blockNumber: 1n }); await completion; });
    expect(result.current.state.phase).toBe('success');
  });
  it('restores an existing hash by querying the receipt, without sending another transaction', async () => {
    savePending({ address, hash });
    vi.mocked(confirmCheckIn).mockResolvedValue({ hash, blockNumber: 1n });
    const { result } = renderHook(useWallet);
    await act(() => result.current.connect(mockWallet()));
    expect(result.current.state.phase).toBe('success');
    expect(confirmCheckIn).toHaveBeenCalledWith({ address, hash }, expect.any(Function));
    expect(sendCheckIn).not.toHaveBeenCalled();
  });
  it('keeps an unknown receipt pending and a retry only re-queries the receipt', async () => {
    vi.mocked(sendCheckIn).mockResolvedValue(hash);
    vi.mocked(confirmCheckIn).mockRejectedValue(new Error('Timed out'));
    const { result } = renderHook(useWallet);
    await act(() => result.current.connect(mockWallet()));
    await act(() => result.current.checkIn());
    expect(result.current.state.phase).toBe('pending');
    await act(() => result.current.refresh());
    expect(confirmCheckIn).toHaveBeenCalledTimes(2);
    expect(sendCheckIn).toHaveBeenCalledTimes(1);
    expect(result.current.state.phase).toBe('pending');
  });
  it('does not apply an old account receipt to a newly selected account', async () => {
    const mined = deferred<{ hash: Hash; blockNumber: bigint }>();
    vi.mocked(sendCheckIn).mockResolvedValue(hash);
    vi.mocked(confirmCheckIn).mockReturnValue(mined.promise);
    const wallet = mockWallet(); const { result } = renderHook(useWallet);
    await act(() => result.current.connect(wallet));
    let completion!: Promise<void>;
    act(() => { completion = result.current.checkIn(); });
    await waitFor(() => expect(result.current.state.phase).toBe('pending'));
    await act(async () => { wallet.changeAccount(other); });
    await waitFor(() => expect(result.current.state.phase).toBe('ready'));
    await act(async () => { mined.resolve({ hash, blockNumber: 1n }); await completion; });
    expect(result.current.state.address).toBe(other);
    expect(result.current.state.chainId).toBe(204);
    expect(result.current.state.phase).toBe('ready');
    expect(result.current.state.hash).toBeUndefined();
  });
  it('does not store or confirm a rejected wallet transaction', async () => {
    vi.mocked(sendCheckIn).mockRejectedValue({ code: 4001 });
    const { result } = renderHook(useWallet);
    await act(() => result.current.connect(mockWallet()));
    await act(() => result.current.checkIn());
    expect(result.current.state.phase).toBe('error');
    expect(result.current.state.message).toContain('cancelled');
    expect(loadPending(address)).toBeUndefined();
    expect(confirmCheckIn).not.toHaveBeenCalled();
  });
  it('retains an in-memory record when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('unavailable'); });
    savePending({ address, hash });
    expect(loadPending(address)).toEqual({ address, hash });
    clearPending(address);
    expect(loadPending(address)).toBeUndefined();
    vi.restoreAllMocks();
  });
});
