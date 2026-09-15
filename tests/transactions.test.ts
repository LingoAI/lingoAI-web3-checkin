import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Address, Hash } from 'viem';
import { CHAIN_ID, CONTRACT, checkInAbi, publicClient } from '../src/web3/config';
import { CHECK_IN_DATA, confirmCheckIn, isExpectedTransaction, prepareCheckIn, sendCheckIn } from '../src/web3/transactions';

const address = '0x1111111111111111111111111111111111111111' as Address;
const hash = `0x${'ab'.repeat(32)}` as Hash;
const tx = { hash, from: address, to: CONTRACT, input: CHECK_IN_DATA, value: 0n };

describe('check-in contract and confirmation', () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  it('encodes exactly the provided no-argument function', () => {
    expect(CHECK_IN_DATA).toBe('0x183ff085');
    expect(isExpectedTransaction(tx, address)).toBe(true);
    expect(isExpectedTransaction({ ...tx, to: address }, address)).toBe(false);
    expect(isExpectedTransaction({ ...tx, input: '0x' }, address)).toBe(false);
    expect(isExpectedTransaction({ ...tx, value: 1n }, address)).toBe(false);
  });
  it('checks the actual RPC network before simulation', async () => {
    vi.spyOn(publicClient, 'getChainId').mockResolvedValue(56);
    const simulate = vi.spyOn(publicClient, 'simulateContract');
    await expect(prepareCheckIn(address)).rejects.toThrow('The RPC is not on opBNB');
    expect(simulate).not.toHaveBeenCalled();
  });
  it('does not send if the contract is absent', async () => {
    vi.spyOn(publicClient, 'getChainId').mockResolvedValue(CHAIN_ID);
    vi.spyOn(publicClient, 'getCode').mockResolvedValue('0x');
    const provider = { request: vi.fn().mockResolvedValue('0xcc') };
    await expect(sendCheckIn(provider, address, vi.fn())).rejects.toThrow('contract was not found');
    expect(provider.request.mock.calls.map(([arg]) => arg.method)).not.toContain('eth_sendTransaction');
  });
  it('rechecks the address after simulation and before the wallet transaction', async () => {
    vi.spyOn(publicClient, 'getChainId').mockResolvedValue(CHAIN_ID);
    vi.spyOn(publicClient, 'getCode').mockResolvedValue('0x1234');
    vi.spyOn(publicClient, 'simulateContract').mockResolvedValue({ request: {} } as never);
    const request = vi.fn().mockResolvedValueOnce('0xcc').mockResolvedValueOnce(['0x2222222222222222222222222222222222222222']);
    await expect(sendCheckIn({ request }, address, vi.fn())).rejects.toThrow('account changed');
    expect(request.mock.calls.map(([arg]) => arg.method)).not.toContain('eth_sendTransaction');
  });
  it('asks the connected wallet to send exactly checkIn() on chain 204', async () => {
    vi.spyOn(publicClient, 'getChainId').mockResolvedValue(CHAIN_ID);
    vi.spyOn(publicClient, 'getCode').mockResolvedValue('0x1234');
    vi.spyOn(publicClient, 'simulateContract').mockResolvedValue({ request: { address: CONTRACT, abi: checkInAbi, functionName: 'checkIn' } } as never);
    const request = vi.fn(async ({ method }: { method: string; params?: unknown[] | object }) => {
      if (method === 'eth_chainId') return '0xcc';
      if (method === 'eth_accounts') return [address];
      if (method === 'eth_sendTransaction') return hash;
      throw new Error(`Unexpected wallet call: ${method}`);
    });
    await expect(sendCheckIn({ request }, address, vi.fn())).resolves.toBe(hash);
    const sent = request.mock.calls.find(([args]) => args.method === 'eth_sendTransaction')![0];
    expect(sent.params).toEqual([expect.objectContaining({ from: address, to: CONTRACT, data: '0x183ff085' })]);
    const payload = (sent.params as Array<{ value?: string }>)[0];
    expect(payload.value === undefined || payload.value === '0x0').toBe(true);
  });
  it('waits for the success receipt and verifies the transaction intent', async () => {
    vi.spyOn(publicClient, 'waitForTransactionReceipt').mockResolvedValue({ transactionHash: hash, status: 'success', blockNumber: 12n } as never);
    vi.spyOn(publicClient, 'getTransaction').mockResolvedValue(tx as never);
    await expect(confirmCheckIn({ address, hash }, vi.fn())).resolves.toEqual({ hash, blockNumber: 12n });
    expect(publicClient.waitForTransactionReceipt).toHaveBeenCalledWith(expect.objectContaining({ confirmations: 1 }));
  });
  it('never counts a reverted receipt as success', async () => {
    vi.spyOn(publicClient, 'waitForTransactionReceipt').mockResolvedValue({ transactionHash: hash, status: 'reverted' } as never);
    vi.spyOn(publicClient, 'getTransaction').mockResolvedValue(tx as never);
    await expect(confirmCheckIn({ address, hash }, vi.fn())).rejects.toThrow('transaction reverted');
  });
  it('never counts a successful cancellation / unrelated replacement as check-in', async () => {
    vi.spyOn(publicClient, 'waitForTransactionReceipt').mockResolvedValue({ transactionHash: hash, status: 'success' } as never);
    vi.spyOn(publicClient, 'getTransaction').mockResolvedValue({ ...tx, to: address, input: '0x' } as never);
    await expect(confirmCheckIn({ address, hash }, vi.fn())).rejects.toThrow('cancelled or replaced');
  });
  it('propagates unknown confirmation instead of inventing success', async () => {
    vi.spyOn(publicClient, 'waitForTransactionReceipt').mockRejectedValue(new Error('Timed out'));
    await expect(confirmCheckIn({ address, hash }, vi.fn())).rejects.toThrow('Timed out');
  });
});
