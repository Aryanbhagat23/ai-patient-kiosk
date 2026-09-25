import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, FileSignature, FileText } from 'lucide-react';
import { api } from '../api';
import { Button, Card, SignaturePad } from '../ui';
import { Flash, useKiosk } from './Kiosk';

export default function Forms({ onDone }) {
  const { t, cfg, me, session, go, handleError } = useKiosk();
  const forms = cfg.forms.filter((f) => me.pending_forms.includes(f.id));
  const [index, setIndex] = useState(0);
  const [signatures, setSignatures] = useState({});
  const [current, setCurrent] = useState(null);
  const [busy, setBusy] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    if (!forms.length && !finished.current) {
      finished.current = true;
      onDone();
    }
  }, [forms.length, onDone]);

  if (!forms.length) return null;
  const form = forms[index];

  const sign = async () => {
    const all = { ...signatures, [form.id]: current };
    setSignatures(all);
    if (index < forms.length - 1) {
      setIndex(index + 1);
      setCurrent(null);
      return;
    }
    setBusy(true);
    try {
      await api('/api/v1/kiosk/forms', {
        method: 'POST',
        token: session.token,
        body: { signatures: forms.map((f) => ({ form_id: f.id, signature: all[f.id] })) },
      });
      finished.current = true; // the refreshed patient data has no pending forms; don't finish twice
      await onDone();
    } catch (e) {
      handleError(e);
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Flash />
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-4xl font-bold">{t('formsTitle')}</h1>
        <span className="text-lg text-slate-500">{t('formOf', { a: index + 1, b: forms.length })}</span>
      </div>
      <Card className="p-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3"><FileText className="w-7 h-7 text-teal-700" />{form.title}</h2>
        <div className="max-h-64 overflow-y-auto rounded-2xl bg-slate-50 border border-slate-200 p-5 text-lg leading-relaxed text-slate-700 mb-6">
          {form.body}
        </div>
        {/* key resets the pad for each form */}
        <SignaturePad key={form.id} onChange={setCurrent} label={t('signHere')} clearLabel={t('clear')} />
      </Card>
      <div className="mt-8 grid grid-cols-[auto_1fr] gap-4">
        <Button variant="ghost" icon={ArrowLeft} disabled={busy}
          onClick={() => (index === 0 ? go('home') : (setIndex(index - 1), setCurrent(signatures[forms[index - 1].id] || null)))}>
          {t('back')}
        </Button>
        <Button icon={FileSignature} disabled={!current} loading={busy} onClick={sign}>{t('signAndContinue')}</Button>
      </div>
    </div>
  );
}
