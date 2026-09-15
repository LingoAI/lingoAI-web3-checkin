import { describe, expect, it, vi } from 'vitest';
import { ensureOpBNB, type WalletProvider } from '../src/web3/provider';

describe('opBNB network guard', () => {
  it('does not prompt if already on opBNB', async () => {
    const provider = { request: vi.fn().mockResolvedValue('0xcc') };
    await ensureOpBNB(provider);
    expect(provider.request.mock.calls.map(([arg]) => arg.method)).toEqual(['eth_chainId']);
  });
  it('adds an unknown network then explicitly switches and verifies', async () => {
    let chain = '0x1'; let known = false;
    const calls: string[] = [];
    const provider: WalletProvider = { request: vi.fn(async ({ method, params }) => {
      calls.push(method);
      if (method === 'eth_chainId') return chain;
      if (method === 'wallet_switchEthereumChain') {
        if (!known) throw { code: -32603, data: { originalError: { code: 4902 } } };
        chain = '0xcc'; return null;
      }
      if (method === 'wallet_addEthereumChain') {
        expect(params).toMatchObject([{ chainId: '0xcc', nativeCurrency: { symbol: 'BNB', decimals: 18 } }]);
        known = true; return null;
      }
    }) };
    await ensureOpBNB(provider);
    expect(calls).toEqual(['eth_chainId','wallet_switchEthereumChain','wallet_addEthereumChain','wallet_switchEthereumChain','eth_chainId']);
  });
  it('does not add a network after the user rejects switching', async () => {
    const request = vi.fn().mockResolvedValueOnce('0x1').mockRejectedValueOnce({ code: 4001 });
    await expect(ensureOpBNB({ request })).rejects.toMatchObject({ code: 4001 });
    expect(request).toHaveBeenCalledTimes(2);
  });
  it('refuses to continue if a wallet reports success without changing chain', async () => {
    const request = vi.fn().mockResolvedValueOnce('0x1').mockResolvedValueOnce(null).mockResolvedValueOnce('0x1');
    await expect(ensureOpBNB({ request })).rejects.toThrow('has not switched');
  });
});
