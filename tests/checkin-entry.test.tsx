// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Address, Hash } from 'viem';
import { CheckInDialog } from '../src/components/CheckInDialog';
import { useWallet } from '../src/web3/useWallet';
import { clearPending, confirmCheckIn, prepareCheckIn, sendCheckIn } from '../src/web3/transactions';
import type { WalletProvider } from '../src/web3/provider';

vi.mock('../src/web3/transactions', async importOriginal => ({
  ...await importOriginal<typeof import('../src/web3/transactions')>(),
  prepareCheckIn: vi.fn(), sendCheckIn: vi.fn(), confirmCheckIn: vi.fn(),
}));
const address = '0x3333333333333333333333333333333333333333' as Address;
const hash = `0x${'cd'.repeat(32)}` as Hash;
function Entry() { return <CheckInDialog open onClose={() => {}} wallet={useWallet()} />; }
function inject(provider: WalletProvider) {
  Object.defineProperty(window, 'ethereum', { value: provider, configurable: true });
  window.dispatchEvent(new Event('ethereum#initialized'));
}
const makeProvider = () => ({ request: vi.fn(async ({ method }: { method: string }) => method === 'eth_chainId' ? '0xcc' : [address]) });
beforeEach(() => {
  vi.resetAllMocks(); localStorage.clear(); clearPending(address);
  Reflect.deleteProperty(window, 'ethereum');
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute('open'); } });
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.mocked(prepareCheckIn).mockResolvedValue({ request: {} } as never);
  vi.mocked(sendCheckIn).mockResolvedValue(hash);
  vi.mocked(confirmCheckIn).mockResolvedValue({ hash, blockNumber: 1n });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); Reflect.deleteProperty(window, 'ethereum'); });

describe('DApp check-in entry', () => {
  it('shows the check-in action and an explanation below it without wallet-opening links', () => {
    render(<Entry />);
    const button = screen.getByRole('button', { name: 'Check in now' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    const hint = screen.getByText(/No wallet detected/);
    expect(button.getAttribute('aria-describedby')?.split(' ')).toContain(hint.id);
    expect(button.getAttribute('aria-describedby')?.split(' ')).toContain('checkin-fees');
    expect(button.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText(/Open in MetaMask/)).toBeNull();
    expect(screen.queryByText(/Open in Trust Wallet/)).toBeNull();
    expect(sendCheckIn).not.toHaveBeenCalled();
  });
  it('detects a late-injected mobile wallet without prompting, then connects and signs from one click', async () => {
    render(<Entry />);
    const provider = makeProvider();
    act(() => inject(provider));
    const button = screen.getByRole('button', { name: 'Check in now' }) as HTMLButtonElement;
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(screen.queryByText(/No wallet detected/)).toBeNull();
    expect(provider.request).not.toHaveBeenCalled();
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Check-in complete' })).toBeDefined());
    expect(provider.request.mock.calls.filter(([args]) => args.method === 'eth_requestAccounts')).toHaveLength(1);
    expect(sendCheckIn).toHaveBeenCalledTimes(1);
  });
  it('does not submit a check-in when wallet connection is rejected', async () => {
    const provider = makeProvider();
    provider.request.mockRejectedValue({ code: 4001 });
    inject(provider);
    render(<Entry />);
    fireEvent.click(screen.getByRole('button', { name: 'Check in now' }));
    await screen.findByText('Wallet request cancelled. You can try again.');
    expect(sendCheckIn).not.toHaveBeenCalled();
    expect(confirmCheckIn).not.toHaveBeenCalled();
  });
  it('uses the chosen injected wallet when several wallets are available', async () => {
    const first = makeProvider(), second = makeProvider();
    render(<Entry />);
    act(() => {
      for (const [id, provider] of [['one', first], ['two', second]] as const) {
        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: { info: { uuid: id, rdns: id, name: `Wallet ${id}` }, provider } }));
      }
    });
    fireEvent.change(screen.getByLabelText('Wallet for check-in'), { target: { value: 'eip6963:two' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check in now' }));
    await waitFor(() => expect(sendCheckIn).toHaveBeenCalledTimes(1));
    expect(first.request).not.toHaveBeenCalled();
    expect(second.request.mock.calls.some(([args]) => args.method === 'eth_requestAccounts')).toBe(true);
  });
});

describe('dialog dismissal', () => {
  function DismissibleEntry({ onClose }: { onClose: () => void }) {
    const [open, setOpen] = useState(false);
    const wallet = useWallet();
    return <><button onClick={() => setOpen(true)}>Show check-in</button>
      <CheckInDialog open={open} onClose={() => { setOpen(false); onClose(); }} wallet={wallet} /></>;
  }
  function startDismissal() {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const view = render(<DismissibleEntry onClose={onClose} />);
    const opener = screen.getByRole('button', { name: 'Show check-in' });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    dialog.style.transitionDuration = '0.28s';
    dialog.style.transitionDelay = '0s';
    fireEvent.click(screen.getByRole('button', { name: 'Close check-in dialog' }));
    return { ...view, onClose, opener, dialog };
  }
  it('keeps the modal and scroll lock until its own exit completes, then restores focus and reopens', () => {
    const { onClose, opener, dialog } = startDismissal();
    expect(dialog.open).toBe(true);
    expect(document.documentElement.classList.contains('dialog-open')).toBe(true);
    fireEvent.transitionEnd(dialog.querySelector('.dialog-action')!, { propertyName: 'opacity' });
    fireEvent.transitionEnd(dialog, { propertyName: 'transform' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.transitionEnd(dialog, { propertyName: 'opacity' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(false);
    expect(document.documentElement.classList.contains('dialog-open')).toBe(false);
    expect(document.activeElement).toBe(opener);
    act(() => vi.runOnlyPendingTimers());
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(opener);
    expect(dialog.open).toBe(true);
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    act(() => vi.advanceTimersByTime(330));
    expect(dialog.open).toBe(false);
  });
  it('finishes without a transition event and repeated close requests do not delay dismissal', () => {
    const { onClose, dialog } = startDismissal();
    act(() => vi.advanceTimersByTime(200));
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    act(() => vi.advanceTimersByTime(130));
    expect(dialog.open).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('cancels an unfinished dismissal on unmount', () => {
    const { onClose, unmount } = startDismissal();
    unmount();
    act(() => vi.runOnlyPendingTimers());
    expect(onClose).not.toHaveBeenCalled();
    expect(document.documentElement.classList.contains('dialog-open')).toBe(false);
  });
});
