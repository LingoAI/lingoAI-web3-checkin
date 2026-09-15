import { useEffect, useRef, useState } from 'react';
import { Landing } from './components/Landing';
import { CheckInDialog } from './components/CheckInDialog';
import { mountVisuals } from './visual/mountVisuals';
import { useWallet } from './web3/useWallet';

export function App() {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [systemReduced, setSystemReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const reduced = motionOverride ?? systemReduced;
  const settings = useRef({ paused: false, reduced });
  settings.current = { paused: open, reduced };
  const visuals = useRef<ReturnType<typeof mountVisuals> | null>(null);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { setSystemReduced(preference.matches); setMotionOverride(null); };
    preference.addEventListener('change', change);
    visuals.current = mountVisuals(() => settings.current);
    return () => { preference.removeEventListener('change', change); visuals.current?.destroy(); };
  }, []);
  useEffect(() => { visuals.current?.update(); }, [open, reduced]);
  return <>
    <Landing onCheckin={() => setOpen(true)}
      onMotion={() => setMotionOverride(!reduced)} motionLabel={reduced ? 'Play animations' : 'Pause animations'} />
    <CheckInDialog open={open} onClose={() => setOpen(false)} wallet={wallet} />
  </>;
}
