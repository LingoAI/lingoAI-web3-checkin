import { useEffect, useRef, useState } from 'react';
import { CONTRACT, EXPLORER, shortAddress, transactionUrl } from '../web3/config';
import type { useWallet } from '../web3/useWallet';

type Wallet = ReturnType<typeof useWallet>;
export function CheckInDialog({ open, onClose, wallet }: { open: boolean; onClose: () => void; wallet: Wallet }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelExit = useRef<(() => void) | null>(null);
  const exiting = useRef(false);
  const [closing, setClosing] = useState(false);
  const { state } = wallet;
  const [walletId, setWalletId] = useState('');
  const detectedWallet = wallet.wallets.find(option => option.id === walletId) ?? wallet.wallets[0];
  const needsDappBrowser = !state.address && !detectedWallet;
  const busy = ['connecting', 'switching', 'checking', 'signing'].includes(state.phase);
  useEffect(() => {
    const dialog = dialogRef.current!;
    if (!open) return;
    exiting.current = false;
    setClosing(false);
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal(); document.documentElement.classList.add('dialog-open');
    dialog.querySelector<HTMLButtonElement>('.dialog-close')?.focus();
    // Commit the hidden pose so the first frame can transition into view.
    void dialog.offsetHeight;
    const raf = requestAnimationFrame(() => { if (!exiting.current) dialog.classList.add('is-visible'); });
    return () => {
      cancelExit.current?.();
      cancelAnimationFrame(raf); dialog.classList.remove('is-visible'); dialog.close();
      document.documentElement.classList.remove('dialog-open'); opener?.focus({ preventScroll: true });
    };
  }, [open]);
  const requestClose = () => {
    const dialog = dialogRef.current;
    if (!dialog?.open || exiting.current) return;
    exiting.current = true;
    setClosing(true);
    dialog.classList.remove('is-visible');
    const finish = () => { cancelExit.current?.(); onClose(); };
    const onEnd = (event: TransitionEvent) => {
      if (event.target === dialog && event.propertyName === 'opacity' && !event.pseudoElement) finish();
    };
    // A fallback also handles an immediate close before entry, or disabled transitions.
    const style = getComputedStyle(dialog);
    const toMs = (value: string) => (parseFloat(value) || 0) * (value.trim().endsWith('ms') ? 1 : 1000);
    const delays = style.transitionDelay.split(',').map(toMs);
    const duration = Math.max(0, ...style.transitionDuration.split(',').map((value, index) => toMs(value) + delays[index % delays.length]));
    const timer = window.setTimeout(finish, duration + 50);
    dialog.addEventListener('transitionend', onEnd);
    cancelExit.current = () => {
      window.clearTimeout(timer);
      dialog.removeEventListener('transitionend', onEnd);
      cancelExit.current = null;
    };
  };
  const action = () => state.phase === 'pending' ? wallet.refresh() : wallet.checkIn(detectedWallet);
  const actionLabel = state.phase === 'connecting' ? 'Confirm connection…'
    : state.phase === 'switching' ? 'Switching to opBNB…'
    : state.phase === 'checking' ? 'Checking…'
    : state.phase === 'signing' ? 'Confirm in your wallet…'
    : state.phase === 'pending' ? 'Refresh transaction status'
    : state.phase === 'success' ? 'Check-in complete'
    : 'Check in now';
  const backdrop = useRef(false);
  return <dialog ref={dialogRef} className="checkin-dialog" aria-labelledby="checkin-title" aria-describedby="checkin-description"
    onCancel={event => { event.preventDefault(); requestClose(); }}
    onPointerDown={event => { backdrop.current = event.target === event.currentTarget; }}
    onClick={event => { if (backdrop.current && event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) requestClose(); } backdrop.current = false; }}>
    <div className="dialog-header">
      <p className={`dialog-status status-${state.phase}`} role="status" aria-live="polite">{state.message}</p>
      <button className="dialog-close" onClick={requestClose} aria-label="Close check-in dialog">×</button>
    </div>
    <div className="dialog-content" tabIndex={0} role="region" aria-label="Check-in details">
      <h2 id="checkin-title">Check in.<br />Support Holon.</h2>
      <p id="checkin-description">Check in onchain to help the Holon community stay active and support its growth.</p>
      {state.address && <div className="connected-wallet"><span title={state.address}>{state.name} · {shortAddress(state.address)}</span><button disabled={busy || closing} onClick={wallet.disconnect}>Disconnect</button></div>}
      {!state.address && wallet.wallets.length > 1 && <label className="wallet-selector">Wallet for check-in
        <select value={detectedWallet.id} disabled={busy || closing} onChange={event => setWalletId(event.target.value)}>
          {wallet.wallets.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      </label>}
      <p className="fee-note">Review and confirm the transaction in your wallet. Connecting alone does not submit a transaction.</p>
      <a className="contract-link" href={`${EXPLORER}/address/${CONTRACT}#code`} target="_blank" rel="noopener noreferrer">View check-in contract ↗</a>
      {state.hash && <a className="transaction-link" href={transactionUrl(state.hash)} target="_blank" rel="noopener noreferrer">{state.phase === 'success' ? 'View confirmed transaction' : 'View transaction'} · {shortAddress(state.hash)} ↗</a>}
      <div className="dialog-reward"><h3>Giving back to supporters</h3><p>Active supporters may receive occasional rewards. Details and eligibility are announced with each event.</p></div>
    </div>
    <div className="dialog-footer">
      <div id="checkin-fees" className="checkin-fees"><span className="dialog-network"><span translate="no">opBNB</span> Mainnet</span><p>A small amount of BNB is required for network fees.</p></div>
      <button className="button checkin-button dialog-action" disabled={busy || closing || needsDappBrowser || state.phase === 'success'} aria-describedby={`checkin-fees${needsDappBrowser ? ' dapp-browser-hint' : ''}`} onClick={() => void action()}><span>{actionLabel}</span></button>
      {needsDappBrowser && <p id="dapp-browser-hint" className="wallet-hint" role="status">No wallet detected. Open this page in an opBNB-compatible wallet’s DApp browser to check in.</p>}
      {state.phase === 'success' && <button className="check-again" disabled={closing} onClick={() => void wallet.newCheckIn()}>Check eligibility again</button>}
    </div>
  </dialog>;
}
