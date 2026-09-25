import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../api';
import { formatDate, formatTime } from '../i18n';
import { Button, Card, Notice, TextInput } from '../ui';
import { Flash, useKiosk } from './Kiosk';

const STEPS = ['department', 'physician', 'date', 'time', 'reason', 'review'];
const DAYS_PER_PAGE = 10;
const REASONS = ['reasonCheckup', 'reasonFollowup', 'reasonSymptom', 'reasonRefill'];

/** Open days from today through the booking window. Python weekday: Monday = 0. */
function openDays(cfg) {
  const [y, m, d] = cfg.today.split('-').map(Number);
  const days = [];
  for (let i = 0; i <= cfg.booking_window_days; i++) {
    const dt = new Date(y, m - 1, d + i);
    if (cfg.open_weekdays.includes((dt.getDay() + 6) % 7)) {
      days.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`);
    }
  }
  return days;
}

function Choice({ selected, children, ...props }) {
  return (
    <button
      type="button"
      className={`min-h-[4rem] px-5 py-3 rounded-2xl border-2 text-xl font-medium text-left transition disabled:opacity-40 disabled:line-through disabled:cursor-not-allowed ${
        selected ? 'bg-teal-700 border-teal-700 text-white' : 'bg-white border-slate-300 hover:border-teal-600 hover:bg-teal-50'
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function Booking({ onBooked }) {
  const { t, lang, cfg, session, go, handleError } = useKiosk();
  const [step, setStep] = useState(0);
  const [appt, setAppt] = useState({ department: '', physician: '', date: '', time: '', reason: '' });
  const [page, setPage] = useState(0);
  const [slots, setSlots] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const days = useMemo(() => openDays(cfg), [cfg]);
  const dept = cfg.departments.find((d) => d.name === appt.department);
  const name = STEPS[step];

  const choose = (field, value) => {
    const cleared = { physician: ['physician', 'date', 'time'], department: ['physician', 'date', 'time'], date: ['time'] }[field] || [];
    setAppt((a) => ({ ...a, ...Object.fromEntries(cleared.map((f) => [f, ''])), [field]: value }));
    setNotice(null);
    setStep((s) => s + 1);
  };

  useEffect(() => {
    if (name !== 'time') return undefined;
    let cancelled = false;
    setSlots(null);
    api(`/api/v1/kiosk/availability?${new URLSearchParams({ department: appt.department, physician: appt.physician, date: appt.date })}`,
      { token: session.token })
      .then((res) => !cancelled && setSlots(res.slots))
      .catch((e) => !cancelled && (setSlots([]), handleError(e)));
    return () => { cancelled = true; };
  }, [name, appt.department, appt.physician, appt.date, session.token, handleError]);

  const confirm = async () => {
    setBusy(true);
    try {
      const res = await api('/api/v1/kiosk/appointments', { method: 'POST', token: session.token, body: { ...appt, reason: appt.reason.trim() } });
      await onBooked(res.appointment);
    } catch (e) {
      setBusy(false);
      if (e.code === 'slot_taken' || e.code === 'slot_unavailable') {
        setNotice(t('slotTaken'));
        setStep(STEPS.indexOf('time'));
      } else if (e.code === 'patient_busy') {
        setNotice(t('patientBusy'));
        setStep(STEPS.indexOf('time'));
      } else handleError(e);
    }
  };

  const back = () => (step === 0 ? go('home') : (setNotice(null), setStep(step - 1)));
  const openSlots = slots ? slots.filter((s) => s.state === 'open') : [];
  const pageDays = days.slice(page * DAYS_PER_PAGE, (page + 1) * DAYS_PER_PAGE);

  return (
    <div className="max-w-3xl mx-auto">
      <Flash />
      <h1 className="text-4xl font-bold mb-2">{t('bookTitle')}</h1>
      <div className="flex gap-2 mb-8" aria-hidden>
        {STEPS.map((s, i) => <div key={s} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-teal-600' : 'bg-slate-200'}`} />)}
      </div>
      {notice && <Notice tone="warning" className="mb-6">{notice}</Notice>}

      {name === 'department' && (
        <>
          <h2 className="text-2xl font-semibold mb-4">{t('chooseDept')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {cfg.departments.map((d) => (
              <Choice key={d.name} selected={appt.department === d.name} onClick={() => choose('department', d.name)}>{d.name}</Choice>
            ))}
          </div>
        </>
      )}

      {name === 'physician' && (
        <>
          <h2 className="text-2xl font-semibold mb-4">{t('choosePhysician')} · <span className="text-slate-500">{appt.department}</span></h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {dept.physicians.map((p) => (
              <Choice key={p} selected={appt.physician === p} onClick={() => choose('physician', p)}>{p}</Choice>
            ))}
          </div>
        </>
      )}

      {name === 'date' && (
        <>
          <h2 className="text-2xl font-semibold mb-4">{t('chooseDate')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {pageDays.map((d) => (
              <Choice key={d} selected={appt.date === d} onClick={() => choose('date', d)}>{formatDate(d, lang)}</Choice>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="ghost" size="md" icon={ChevronLeft} disabled={page === 0} onClick={() => setPage(page - 1)}>{t('earlierDays')}</Button>
            <Button variant="ghost" size="md" disabled={(page + 1) * DAYS_PER_PAGE >= days.length} onClick={() => setPage(page + 1)}>
              {t('moreDays')} <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </>
      )}

      {name === 'time' && (
        <>
          <h2 className="text-2xl font-semibold mb-4">{t('chooseTime')} · <span className="text-slate-500">{formatDate(appt.date, lang)}</span></h2>
          {!slots && <div className="py-10 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-teal-700" /></div>}
          {slots && openSlots.length === 0 && <Notice tone="info">{t('noSlots')}</Notice>}
          {slots && openSlots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {slots.map((s) => (
                <Choice key={s.time} selected={appt.time === s.time} disabled={s.state !== 'open'} onClick={() => choose('time', s.time)}>
                  <span className="block text-center">{formatTime(s.time, lang)}</span>
                </Choice>
              ))}
            </div>
          )}
        </>
      )}

      {name === 'reason' && (
        <>
          <h2 className="text-2xl font-semibold mb-4">{t('reasonTitle')}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {REASONS.map((r) => (
              <Choice key={r} selected={appt.reason === t(r)} onClick={() => setAppt((a) => ({ ...a, reason: t(r) }))}>{t(r)}</Choice>
            ))}
          </div>
          <TextInput maxLength={200} placeholder={t('reasonPlaceholder')} value={appt.reason}
            onChange={(e) => setAppt((a) => ({ ...a, reason: e.target.value }))} />
        </>
      )}

      {name === 'review' && (
        <>
          <h2 className="text-2xl font-semibold mb-4">{t('reviewTitle')}</h2>
          <Card className="p-8">
            <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 text-xl">
              <dt className="text-slate-500">{t('department')}</dt><dd>{appt.department}</dd>
              <dt className="text-slate-500">{t('doctor')}</dt><dd>{appt.physician}</dd>
              <dt className="text-slate-500">{t('date')}</dt><dd>{formatDate(appt.date, lang)}</dd>
              <dt className="text-slate-500">{t('time')}</dt><dd>{formatTime(appt.time, lang)}</dd>
              <dt className="text-slate-500">{t('reason')}</dt><dd>{appt.reason}</dd>
            </dl>
          </Card>
        </>
      )}

      <div className="mt-8 grid grid-cols-[auto_1fr] gap-4">
        <Button variant="ghost" icon={ArrowLeft} onClick={back} disabled={busy}>{t('back')}</Button>
        {name === 'reason' && (
          <Button icon={ArrowRight} disabled={appt.reason.trim().length < 2} onClick={() => setStep(step + 1)}>{t('next')}</Button>
        )}
        {name === 'review' && <Button icon={CheckCircle2} loading={busy} onClick={confirm}>{t('confirmAppointment')}</Button>}
      </div>
    </div>
  );
}
