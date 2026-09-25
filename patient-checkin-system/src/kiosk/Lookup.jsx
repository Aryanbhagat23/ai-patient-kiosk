import React, { useState } from 'react';
import { ArrowLeft, Search, UserPlus } from 'lucide-react';
import { api } from '../api';
import { Button, Card, DobInput, Field, Notice, TextInput, dobError } from '../ui';
import { Flash, useKiosk } from './Kiosk';
import { collect, last4Error, nameError } from './validation';

export default function Lookup({ onFound }) {
  const { t, lang, go, handleError } = useKiosk();
  const [form, setForm] = useState({ last_name: '', dob: '', phone_last4: '' });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = collect({ last_name: nameError(form.last_name), dob: dobError(form.dob), phone_last4: last4Error(form.phone_last4) });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await api('/api/v1/kiosk/lookup', { method: 'POST', body: { ...form, last_name: form.last_name.trim() } });
      await onFound(res);
    } catch (err) {
      if (err.code === 'not_found') setNotice(t('notFound'));
      else if (err.code === 'too_many_attempts') setNotice(t('tooManyAttempts'));
      else handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl mx-auto" noValidate>
      <Flash />
      <h1 className="text-4xl font-bold mb-2">{t('lookupTitle')}</h1>
      <p className="text-xl text-slate-600 mb-8">{t('lookupText')}</p>
      <Card className="p-8 space-y-6">
        <Field label={t('lastName')} error={errors.last_name && t(errors.last_name)}>
          <TextInput autoComplete="off" value={form.last_name} error={errors.last_name} onChange={(e) => set('last_name', e.target.value)} />
        </Field>
        <Field label={t('dob')} error={errors.dob && t(errors.dob)}>
          <DobInput value={form.dob} onChange={(v) => set('dob', v)} lang={lang} t={t} error={errors.dob} />
        </Field>
        <Field label={t('phoneLast4')} error={errors.phone_last4 && t(errors.phone_last4)}>
          <TextInput inputMode="numeric" maxLength={4} autoComplete="off" value={form.phone_last4} error={errors.phone_last4}
            onChange={(e) => set('phone_last4', e.target.value.replace(/\D/g, ''))} className="max-w-[12rem]" />
        </Field>
      </Card>
      {notice && <Notice tone="error" className="mt-6">{notice}</Notice>}
      <div className="mt-8 grid sm:grid-cols-[auto_1fr] gap-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={() => go('method')}>{t('back')}</Button>
        <Button type="submit" icon={Search} loading={busy}>{t('findMe')}</Button>
      </div>
      <div className="mt-4 text-center">
        <Button variant="ghost" size="md" icon={UserPlus} onClick={() => go('register')}>{t('methodNew')}</Button>
      </div>
    </form>
  );
}
