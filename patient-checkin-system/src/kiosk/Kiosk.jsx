import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Lock, RotateCcw, Stethoscope, WifiOff } from 'lucide-react';
import { api } from '../api';
import { LANGUAGES, localeOf, makeT } from '../i18n';
import { Button, Modal, Notice, Spinner } from '../ui';
import { CheckedInScreen, ConfirmScreen, DoneScreen, MethodScreen, NoMatchScreen, WelcomeScreen, BookedScreen } from './screens';
import FaceScan from './FaceScan';
import Lookup from './Lookup';
import Register from './Register';
import PatientHome from './PatientHome';
import Forms from './Forms';
import Booking from './Booking';

const KioskContext = createContext(null);
export const useKiosk = () => useContext(KioskContext);

const IDLE_SECONDS = 75; // inactivity before the "are you still there?" prompt
const IDLE_COUNTDOWN = 20; // seconds shown in the prompt before the session is cleared
const SELF_TIMED = new Set(['welcome', 'checkedIn', 'booked', 'done']); // screens that return home by themselves

export default function Kiosk({ onStaff }) {
  const [lang, setLang] = useState('en');
  const t = useMemo(() => makeT(lang), [lang]);
  const [cfg, setCfg] = useState(null);
  const [health, setHealth] = useState(null);
  const [offline, setOffline] = useState(false);

  const [step, setStep] = useState('welcome');
  const [session, setSession] = useState(null); // { token, patient }
  const [me, setMe] = useState(null);
  const [capturedFace, setCapturedFace] = useState(null);
  const [flash, setFlash] = useState(null); // { tone, text } shown on the next screen
  const [routing, setRouting] = useState(null);
  const [booked, setBooked] = useState(null);
  const [pendingCheckin, setPendingCheckin] = useState(null);
  const [idleLeft, setIdleLeft] = useState(null);
  const lastActivity = useRef(Date.now());

  // --- Clinic config & health -----------------------------------------------------------
  useEffect(() => {
    let timer;
    const load = async () => {
      try {
        setCfg(await api('/api/v1/kiosk/config'));
      } catch {
        timer = setTimeout(load, 5000);
      }
    };
    load();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        setHealth(await api('/api/v1/health', { timeout: 8000 }));
        setOffline(false);
      } catch {
        setOffline(true);
      }
    };
    poll();
    const i = setInterval(poll, 10000);
    return () => clearInterval(i);
  }, []);

  // --- Session helpers ----------------------------------------------------------------------
  const reset = useCallback((message) => {
    setSession(null);
    setMe(null);
    setCapturedFace(null);
    setRouting(null);
    setBooked(null);
    setPendingCheckin(null);
    setIdleLeft(null);
    setFlash(message ? { tone: 'info', text: message } : null);
    setLang('en');
    setStep('welcome');
  }, []);

  const go = useCallback((next, message = null) => {
    setFlash(message);
    setStep(next);
    window.scrollTo(0, 0);
  }, []);

  /** Shared error handling: session expiry, offline, or a generic message. Returns the message shown. */
  const handleError = useCallback((e) => {
    if (e && e.status === 401) {
      reset(t('sessionExpired'));
      return null;
    }
    const text = e && e.status === 0 ? t('offline') : t('genericError');
    setFlash({ tone: 'error', text });
    return text;
  }, [reset, t]);

  const refreshMe = useCallback(async (token) => {
    const data = await api('/api/v1/kiosk/me', { token });
    setMe(data);
    return data;
  }, []);

  const openSession = useCallback(async (result, message = null) => {
    const s = { token: result.token, patient: result.patient };
    setSession(s);
    try {
      await refreshMe(s.token);
      go('home', message);
    } catch (e) {
      handleError(e);
    }
  }, [refreshMe, go, handleError]);

  const doCheckin = useCallback(async (appointmentId) => {
    try {
      const res = await api('/api/v1/kiosk/checkin', { method: 'POST', token: session.token, body: { appointment_id: appointmentId } });
      setRouting(res.routing);
      setPendingCheckin(null);
      go('checkedIn');
    } catch (e) {
      if (e.code === 'forms_required') {
        setPendingCheckin(appointmentId);
        await refreshMe(session.token).catch(() => {});
        go('forms');
      } else {
        handleError(e);
      }
    }
  }, [session, go, handleError, refreshMe]);

  const startCheckin = useCallback((appointmentId) => {
    if (me && me.pending_forms.length) {
      setPendingCheckin(appointmentId);
      go('forms');
    } else {
      doCheckin(appointmentId);
    }
  }, [me, go, doCheckin]);

  // --- Inactivity timeout (privacy on a shared kiosk) ----------------------------------------
  useEffect(() => {
    const touch = () => { lastActivity.current = Date.now(); };
    const events = ['pointerdown', 'keydown', 'touchstart', 'input'];
    events.forEach((ev) => window.addEventListener(ev, touch, { passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, touch));
  }, []);

  useEffect(() => {
    lastActivity.current = Date.now();
    setIdleLeft(null);
    if (SELF_TIMED.has(step)) return undefined;
    const i = setInterval(() => {
      const idle = (Date.now() - lastActivity.current) / 1000;
      if (idle < IDLE_SECONDS) return setIdleLeft(null);
      const left = Math.ceil(IDLE_SECONDS + IDLE_COUNTDOWN - idle);
      if (left <= 0) reset();
      else setIdleLeft(left);
    }, 1000);
    return () => clearInterval(i);
  }, [step, reset]);

  const ctx = { t, lang, cfg, health, session, me, go, reset, handleError, refreshMe, flash, setFlash };

  // --- Render -----------------------------------------------------------------------------------
  let screen;
  if (!cfg) {
    screen = <Spinner label={offline ? t('offline') : t('loading')} />;
  } else {
    switch (step) {
      case 'welcome': screen = <WelcomeScreen onStart={() => go('method')} setLang={setLang} />; break;
      case 'method': screen = <MethodScreen />; break;
      case 'scan':
        screen = (
          <FaceScan
            onCaptured={setCapturedFace}
            onMatch={(res) => { setSession({ token: res.token, patient: res.patient }); go('confirm'); }}
            onNoMatch={() => go('noMatch')}
          />
        );
        break;
      case 'confirm':
        screen = (
          <ConfirmScreen
            patient={session?.patient}
            onYes={() => openSession(session)}
            onNo={() => { setSession(null); go('noMatch'); }}
          />
        );
        break;
      case 'noMatch': screen = <NoMatchScreen />; break;
      case 'lookup': screen = <Lookup onFound={(res) => openSession(res)} />; break;
      case 'register':
        screen = (
          <Register
            capturedFace={capturedFace}
            onRegistered={(res) => openSession(res, res.face_saved || !res.face_error ? null : { tone: 'warning', text: t('faceNotSaved') })}
          />
        );
        break;
      case 'home': screen = <PatientHome onCheckin={startCheckin} />; break;
      case 'forms':
        screen = (
          <Forms
            onDone={async () => {
              const data = await refreshMe(session.token).catch(() => null);
              if (pendingCheckin && data && !data.pending_forms.length) doCheckin(pendingCheckin);
              else go('home');
            }}
          />
        );
        break;
      case 'book':
        screen = (
          <Booking
            onBooked={async (appt) => {
              setBooked(appt);
              await refreshMe(session.token).catch(() => {});
              go('booked');
            }}
          />
        );
        break;
      case 'booked': screen = <BookedScreen appointment={booked} onCheckin={() => startCheckin(booked.id)} />; break;
      case 'checkedIn': screen = <CheckedInScreen routing={routing} />; break;
      case 'done': screen = <DoneScreen />; break;
      default: screen = null;
    }
  }

  return (
    <KioskContext.Provider value={ctx}>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-teal-50/40 text-slate-900">
        <Header t={t} lang={lang} setLang={setLang} clinic={cfg?.clinic_name} timeZone={cfg?.timezone} showReset={step !== 'welcome'} onReset={() => reset()} />
        {offline && (
          <div className="bg-red-700 text-white text-lg px-6 py-3 flex items-center gap-3" role="alert">
            <WifiOff className="w-6 h-6" /> {t('offline')}
          </div>
        )}
        <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8">{screen}</main>
        <footer className="px-6 py-4 flex items-center justify-between text-slate-500">
          <button onClick={onStaff} className="p-3 rounded-full hover:bg-slate-200" aria-label="Staff sign in" title="Staff sign in">
            <Lock className="w-5 h-5" />
          </button>
          <span className="text-base">{t('privacyNote')}</span>
          <span className="w-11" />
        </footer>
      </div>
      {idleLeft !== null && (
        <Modal>
          <h2 className="text-3xl font-bold mb-3">{t('idleTitle')}</h2>
          <p className="text-xl text-slate-600 mb-8">{t('idleText', { n: idleLeft })}</p>
          <div className="flex gap-4">
            <Button className="flex-1" onClick={() => { lastActivity.current = Date.now(); setIdleLeft(null); }}>{t('stillHere')}</Button>
            <Button variant="secondary" onClick={() => reset()}>{t('startOver')}</Button>
          </div>
        </Modal>
      )}
    </KioskContext.Provider>
  );
}

function Header({ t, lang, setLang, clinic, timeZone, showReset, onReset }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(i);
  }, []);
  return (
    <header className="bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center">
          <Stethoscope className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold leading-tight">{clinic || ' '}</div>
          <div className="text-slate-500 text-base">
            {/* Clinic time zone, so the date shown always matches "today's" appointments */}
            {now.toLocaleDateString(localeOf(lang), { weekday: 'long', month: 'long', day: 'numeric', timeZone })} ·{' '}
            {now.toLocaleTimeString(localeOf(lang), { hour: 'numeric', minute: '2-digit', timeZone })}
          </div>
        </div>
        <select
          aria-label={t('language')}
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="min-h-[3rem] px-3 text-lg rounded-xl border-2 border-slate-300 bg-white"
        >
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        {showReset && (
          <Button variant="ghost" size="md" icon={RotateCcw} onClick={onReset}>{t('startOver')}</Button>
        )}
      </div>
    </header>
  );
}

/** Flash message set by the previous step (errors, warnings). */
export function Flash() {
  const { flash } = useKiosk();
  return flash ? <Notice tone={flash.tone} className="mb-6">{flash.text}</Notice> : null;
}
