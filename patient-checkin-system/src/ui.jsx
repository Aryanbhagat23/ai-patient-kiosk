import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { monthNames } from './i18n';

const VARIANTS = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 disabled:bg-slate-300 disabled:text-slate-500',
  secondary: 'bg-white text-slate-800 border-2 border-slate-300 hover:border-teal-600 hover:bg-teal-50 disabled:opacity-50',
  danger: 'bg-white text-red-700 border-2 border-red-200 hover:bg-red-50 disabled:opacity-50',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:opacity-50',
};
const SIZES = {
  lg: 'min-h-[4rem] px-8 text-xl rounded-2xl',
  md: 'min-h-[3rem] px-5 text-lg rounded-xl',
  sm: 'min-h-[2.5rem] px-4 text-base rounded-lg',
};

export function Button({ variant = 'primary', size = 'lg', loading, icon: Icon, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-3 font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : Icon ? <Icon className="w-6 h-6 shrink-0" /> : null}
      {children}
    </button>
  );
}

export function Card({ className = '', children }) {
  return <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm ${className}`}>{children}</div>;
}

export function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-500" role="status">
      <Loader2 className="w-12 h-12 animate-spin text-teal-700" />
      {label && <p className="text-xl">{label}</p>}
    </div>
  );
}

export function Notice({ tone = 'info', children, className = '' }) {
  const styles = {
    info: 'bg-sky-50 text-sky-900 border-sky-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
  }[tone];
  const Icon = tone === 'error' || tone === 'warning' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl border p-4 text-lg ${styles} ${className}`}>
      <Icon className="w-6 h-6 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-lg font-medium text-slate-700 mb-2">{label}</span>
      {children}
      {hint && !error && <span className="block text-base text-slate-500 mt-1">{hint}</span>}
      {error && (
        <span className="flex items-center gap-1 text-base text-red-700 mt-1">
          <AlertCircle className="w-4 h-4" /> {error}
        </span>
      )}
    </label>
  );
}

export const inputClass = (error) =>
  `w-full min-h-[3.5rem] px-4 text-xl rounded-xl border-2 bg-white focus:outline-none focus:ring-4 focus:ring-teal-200 ${
    error ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-teal-600'
  }`;

export function TextInput({ error, className = '', ...props }) {
  return <input className={`${inputClass(error)} ${className}`} {...props} />;
}

/** Date of birth as month / day / year (easier on a touchscreen than a date picker). Value is YYYY-MM-DD or ''. */
export function DobInput({ value, onChange, lang, t, error }) {
  const [y0, m0, d0] = (value || '').split('-');
  const [parts, setParts] = useState({ y: y0 || '', m: m0 ? String(Number(m0)) : '', d: d0 ? String(Number(d0)) : '' });
  const months = monthNames(lang);
  const update = (patch) => {
    const next = { ...parts, ...patch };
    setParts(next);
    const { y, m, d } = next;
    const valid = /^\d{4}$/.test(y) && m && d;
    const iso = valid ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : '';
    const dt = iso && new Date(Number(y), Number(m) - 1, Number(d));
    onChange(dt && dt.getDate() === Number(d) ? iso : valid ? 'invalid' : '');
  };
  return (
    <div className="grid grid-cols-[2fr_1fr_1.3fr] gap-3">
      <select aria-label={t('month')} className={inputClass(error)} value={parts.m} onChange={(e) => update({ m: e.target.value })}>
        <option value="">{t('month')}</option>
        {months.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
      </select>
      <select aria-label={t('day')} className={inputClass(error)} value={parts.d} onChange={(e) => update({ d: e.target.value })}>
        <option value="">{t('day')}</option>
        {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
      </select>
      <input aria-label={t('year')} className={inputClass(error)} inputMode="numeric" maxLength={4} placeholder={t('year')}
        value={parts.y} onChange={(e) => update({ y: e.target.value.replace(/\D/g, '') })} />
    </div>
  );
}

/** Validates a DobInput value; returns an error key or null. */
export function dobError(value) {
  if (!value) return 'required';
  if (value === 'invalid') return 'invalidDob';
  const d = new Date(value + 'T00:00:00');
  return d > new Date() || d.getFullYear() < 1900 ? 'invalidDob' : null;
}

export function Modal({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8">{children}</div>
    </div>
  );
}

/** Finger/mouse signature pad. Calls onChange(dataUrl | null). */
export function SignaturePad({ onChange, label, clearLabel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const inked = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, []);

  useEffect(() => { setup(); }, [setup]);

  const point = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const down = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(...point(e));
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(...point(e));
    ctx.stroke();
    if (!inked.current) {
      inked.current = true;
      setHasInk(true);
    }
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (inked.current) onChange(canvasRef.current.toDataURL('image/png'));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    inked.current = false;
    setHasInk(false);
    onChange(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-medium text-slate-700">{label}</span>
        <Button variant="ghost" size="sm" onClick={clear} disabled={!hasInk}>{clearLabel}</Button>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-44 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 touch-none cursor-crosshair"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        aria-label={label}
      />
    </div>
  );
}

/** Starts the front camera while `active`. Returns the video ref, readiness and an error code. */
export function useCamera(active) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active) return undefined;
    let stream;
    let cancelled = false;
    const video = videoRef.current;
    setReady(false);
    setError(null);
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error(), { name: 'NotFoundError' });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
        if (cancelled) return stream.getTracks().forEach((tr) => tr.stop());
        video.srcObject = stream;
        await video.play().catch(() => {});
        const markReady = () => !cancelled && setReady(true);
        if (video.readyState >= 2) markReady();
        else video.onloadeddata = markReady;
      } catch (e) {
        if (!cancelled) setError(e && e.name === 'NotAllowedError' ? 'cameraPermission' : 'cameraError');
      }
    })();
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((tr) => tr.stop());
      if (video) video.srcObject = null;
    };
  }, [active]);

  /** Grabs the current frame as a JPEG data URL (max 800px wide). */
  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const scale = Math.min(1, 800 / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  return { videoRef, ready, error, capture };
}

/** Mirrored camera preview with an oval face guide. */
export function CameraView({ videoRef, children }) {
  return (
    <div className="relative mx-auto w-full max-w-2xl aspect-[4/3] overflow-hidden rounded-3xl bg-slate-900">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[46%] h-[78%] rounded-[50%] border-4 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
      </div>
      {children}
    </div>
  );
}
