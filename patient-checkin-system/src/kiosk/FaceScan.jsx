import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, ScanFace, UserSearch } from 'lucide-react';
import { api } from '../api';
import { Button, CameraView, Notice, useCamera } from '../ui';
import { Flash, useKiosk } from './Kiosk';

const COUNTDOWN = 3;
const MAX_AUTO_RETRIES = 2;

export default function FaceScan({ onCaptured, onMatch, onNoMatch }) {
  const { t, go, handleError } = useKiosk();
  const { videoRef, ready, error: cameraError, capture } = useCamera(true);
  const [phase, setPhase] = useState('waiting'); // waiting | countdown | scanning | retry | unavailable
  const [count, setCount] = useState(COUNTDOWN);
  const [message, setMessage] = useState(null);
  const retries = useRef(0);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const scan = useCallback(async () => {
    const image = capture();
    if (!image) return;
    onCaptured(image);
    setPhase('scanning');
    setMessage(null);
    try {
      const res = await api('/api/v1/kiosk/identify', { method: 'POST', body: { image }, timeout: 45000 });
      if (!mounted.current) return;
      if (res.status === 'match') return onMatch(res);
      if (res.status === 'no_match') return onNoMatch();
      // no_face / spoof: explain and try again automatically a couple of times
      setMessage(t(res.status === 'spoof' ? 'spoof' : 'noFace'));
      if (retries.current < MAX_AUTO_RETRIES) {
        retries.current += 1;
        setCount(COUNTDOWN);
        setPhase('countdown');
      } else {
        setPhase('retry');
      }
    } catch (e) {
      if (!mounted.current) return;
      if (e.code === 'face_unavailable') {
        setPhase('unavailable');
      } else {
        setPhase('retry');
        handleError(e);
      }
    }
  }, [capture, onCaptured, onMatch, onNoMatch, t, handleError]);

  // Start the countdown as soon as the camera shows a picture.
  useEffect(() => {
    if (ready && phase === 'waiting') setPhase('countdown');
  }, [ready, phase]);

  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    if (count <= 0) {
      scan();
      return undefined;
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, count, scan]);

  const retry = () => {
    retries.current = 0;
    setMessage(null);
    setCount(COUNTDOWN);
    setPhase('countdown');
  };

  if (cameraError || phase === 'unavailable') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">{t('scanTitle')}</h1>
        <Notice tone="warning" className="mb-8 text-left">{cameraError ? t(cameraError) : t('faceUnavailable')}</Notice>
        <div className="grid gap-4">
          <Button icon={UserSearch} onClick={() => go('lookup')}>{t('methodDetails')}</Button>
          <Button variant="secondary" onClick={() => go('register')}>{t('methodNew')}</Button>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => go('method')}>{t('back')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto text-center">
      <Flash />
      <h1 className="text-4xl font-bold mb-2">{t('scanTitle')}</h1>
      <p className="text-xl text-slate-600 mb-6">{t('scanHint')}</p>
      <CameraView videoRef={videoRef}>
        <div className="absolute inset-x-0 bottom-0 p-5 flex justify-center">
          {!ready && <Loader2 className="w-10 h-10 text-white animate-spin" />}
          {phase === 'countdown' && ready && (
            <span className="rounded-full bg-white/90 px-6 py-2 text-2xl font-semibold text-slate-900">
              {t('scanCountdown', { n: count })}
            </span>
          )}
          {phase === 'scanning' && (
            <span className="rounded-full bg-white/90 px-6 py-2 text-2xl font-semibold text-slate-900 inline-flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" /> {t('scanning')}
            </span>
          )}
        </div>
      </CameraView>
      {message && <Notice tone="warning" className="mt-6 text-left">{message}</Notice>}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => go('method')}>{t('back')}</Button>
        <Button icon={ScanFace} disabled={!ready || phase === 'scanning'} onClick={phase === 'retry' ? retry : scan}>
          {phase === 'retry' ? t('tryAgain') : t('scanNow')}
        </Button>
        <Button variant="secondary" icon={UserSearch} onClick={() => go('lookup')} disabled={phase === 'scanning'}>
          {t('methodDetails')}
        </Button>
      </div>
    </div>
  );
}
