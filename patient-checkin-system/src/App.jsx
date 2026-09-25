import React, { useCallback, useState } from 'react';
import Kiosk from './kiosk/Kiosk';
import StaffApp from './staff/StaffApp';

export default function App() {
  const [mode, setMode] = useState('kiosk');
  const toKiosk = useCallback(() => setMode('kiosk'), []);
  return mode === 'kiosk' ? <Kiosk onStaff={() => setMode('staff')} /> : <StaffApp onExit={toKiosk} />;
}
