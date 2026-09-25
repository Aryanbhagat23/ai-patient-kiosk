import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, RefreshCw, ShieldCheck, UserSearch } from 'lucide-react';
import { api } from '../api';
import { Button, CameraView, Card, DobInput, Field, Notice, TextInput, dobError, useCamera } from '../ui';
import { Flash, useKiosk } from './Kiosk';
import { addressError, collect, emailError, nameError, phoneError, requiredError } from './validation';

const STEPS = 3;

export default function Register({ capturedFace, onRegistered }) {
  const { t, lang, cfg, go, handleError } = useKiosk();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    first_name: '', last_name: '', dob: '', phone: '', email: '', address: '',
    self_pay: false, provider: '', policy: '', group: '',
  });
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState(capturedFace || null);
  const [retaking, setRetaking] = useState(!capturedFace);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  };
  const err = (f) => errors[f] && t(errors[f]);

  const validate = () => {
    const errs = step === 1
      ? collect({
          first_name: nameError(form.first_name), last_name: nameError(form.last_name), dob: dobError(form.dob),
          phone: phoneError(form.phone), email: emailError(form.email), address: addressError(form.address),
        })
      : step === 2 && !form.self_pay
        ? collect({ provider: requiredError(form.provider), policy: requiredError(form.policy) })
        : {};
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const next = () => { if (validate()) setStep((s) => s + 1); };
  const back = () => (step === 1 ? go('method') : setStep((s) => s - 1));

  const submit = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await api('/api/v1/kiosk/register', {
        method: 'POST',
        timeout: 45000,
        body: {
          first_name: form.first_name.trim(), last_name: form.last_name.trim(), dob: form.dob,
          phone: form.phone, email: form.email.trim(), address: form.address.trim(),
          insurance: form.self_pay ? {} : { provider: form.provider.trim(), policy: form.policy.trim(), group: form.group.trim() },
          face_consent: consent && !!photo,
          face_image: consent && photo ? photo : null,
        },
      });
      await onRegistered(res);
    } catch (e) {
      if (e.code === 'already_registered') setNotice('already');
      else if (e.status === 422) { setStep(1); setNotice('invalid'); }
      else handleError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Flash />
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-4xl font-bold">{t('registerTitle')}</h1>
        <span className="text-lg text-slate-500">{t('stepOf', { a: step, b: STEPS })}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 mb-8 overflow-hidden">
        <div className="h-full bg-teal-600 transition-all" style={{ width: `${(step / STEPS) * 100}%` }} />
      </div>

      {step === 1 && (
        <Card className="p-8 space-y-6">
          <h2 className="text-2xl font-semibold">{t('yourDetails')}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label={t('firstName')} error={err('first_name')}>
              <TextInput autoComplete="off" value={form.first_name} error={errors.first_name} onChange={(e) => set('first_name', e.target.value)} />
            </Field>
            <Field label={t('lastName')} error={err('last_name')}>
              <TextInput autoComplete="off" value={form.last_name} error={errors.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </Field>
          </div>
          <Field label={t('dob')} error={err('dob')}>
            <DobInput value={form.dob} onChange={(v) => set('dob', v)} lang={lang} t={t} error={errors.dob} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label={t('phone')} error={err('phone')}>
              <TextInput type="tel" inputMode="tel" autoComplete="off" value={form.phone} error={errors.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label={t('email')} error={err('email')}>
              <TextInput type="email" inputMode="email" autoComplete="off" value={form.email} error={errors.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
          </div>
          <Field label={t('address')} error={err('address')}>
            <TextInput autoComplete="off" value={form.address} error={errors.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-8 space-y-6">
          <h2 className="text-2xl font-semibold">{t('insuranceTitle')}</h2>
          <label className="flex items-center gap-4 text-xl cursor-pointer">
            <input type="checkbox" className="w-7 h-7 accent-teal-700" checked={form.self_pay} onChange={(e) => set('self_pay', e.target.checked)} />
            {t('selfPay')}
          </label>
          {!form.self_pay && (
            <>
              <Field label={t('insuranceProvider')} error={err('provider')}>
                <TextInput autoComplete="off" value={form.provider} error={errors.provider} onChange={(e) => set('provider', e.target.value)} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-6">
                <Field label={t('policyNumber')} error={err('policy')}>
                  <TextInput autoComplete="off" value={form.policy} error={errors.policy} onChange={(e) => set('policy', e.target.value)} />
                </Field>
                <Field label={t('groupNumber')}>
                  <TextInput autoComplete="off" value={form.group} onChange={(e) => set('group', e.target.value)} />
                </Field>
              </div>
            </>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card className="p-8 space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-3"><ShieldCheck className="w-8 h-8 text-teal-700" />{t('faceTitle')}</h2>
          <p className="text-lg text-slate-600">{t('faceExplain')}</p>
          <label className="flex items-start gap-4 text-xl cursor-pointer rounded-2xl border-2 border-slate-200 p-4 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50">
            <input type="checkbox" className="w-7 h-7 mt-0.5 accent-teal-700 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            {t('faceConsent', { clinic: cfg.clinic_name })}
          </label>
          {consent && (retaking
            ? <PhotoCapture onPhoto={(img) => { setPhoto(img); setRetaking(false); }} />
            : (
              <div className="flex items-center gap-6">
                <img src={photo} alt="" className="w-36 h-36 rounded-3xl object-cover -scale-x-100 border-4 border-teal-600" />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xl text-emerald-700 font-medium"><CheckCircle2 className="w-6 h-6" />{t('photoReady')}</div>
                  <Button variant="secondary" size="md" icon={RefreshCw} onClick={() => setRetaking(true)}>{t('retake')}</Button>
                </div>
              </div>
            ))}
        </Card>
      )}

      {notice === 'already' && (
        <Notice tone="warning" className="mt-6">
          <p className="mb-3">{t('alreadyRegistered')}</p>
          <Button size="md" icon={UserSearch} onClick={() => go('lookup')}>{t('methodDetails')}</Button>
        </Notice>
      )}
      {notice === 'invalid' && <Notice tone="error" className="mt-6">{t('genericError')}</Notice>}

      <div className="mt-8 grid grid-cols-[auto_1fr] gap-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={back} disabled={busy}>{t('back')}</Button>
        {step < STEPS
          ? <Button icon={ArrowRight} onClick={next}>{t('next')}</Button>
          : <Button icon={CheckCircle2} loading={busy} disabled={consent && (!photo || retaking)} onClick={submit}>{t('completeRegistration')}</Button>}
      </div>
    </div>
  );
}

function PhotoCapture({ onPhoto }) {
  const { t } = useKiosk();
  const { videoRef, ready, error, capture } = useCamera(true);
  if (error) return <Notice tone="warning">{t(error)}</Notice>;
  return (
    <div className="space-y-4">
      <CameraView videoRef={videoRef} />
      <Button className="w-full" icon={Camera} disabled={!ready} onClick={() => { const img = capture(); if (img) onPhoto(img); }}>
        {t('takePhoto')}
      </Button>
    </div>
  );
}
