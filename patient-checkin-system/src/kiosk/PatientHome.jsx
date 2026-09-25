import React, { useState } from 'react';
import { CalendarPlus, CheckCircle2, KeyRound, LogOut, MapPin, Users, X } from 'lucide-react';
import { api } from '../api';
import { formatDate, formatTime } from '../i18n';
import { Button, Card, Modal } from '../ui';
import { Flash, useKiosk } from './Kiosk';
import { AppointmentLines } from './screens';

export default function PatientHome({ onCheckin }) {
  const { t, lang, me, session, go, handleError, refreshMe } = useKiosk();
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(null);
  if (!me) return null;
  const { patient, today, upcoming } = me;

  const checkin = async (id) => {
    setBusy(id);
    await onCheckin(id);
    setBusy(null);
  };

  const confirmCancel = async () => {
    const appt = cancelling;
    setCancelling(null);
    setBusy(appt.id);
    try {
      await api(`/api/v1/kiosk/appointments/${appt.id}/cancel`, { method: 'POST', token: session.token });
      await refreshMe(session.token);
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Flash />
      <h1 className="text-4xl font-bold mb-6">{t('hello', { name: patient.first_name })}</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">{t('todayTitle')}</h2>
        {today.length === 0 && <Card className="p-6 text-xl text-slate-600">{t('noToday')}</Card>}
        <div className="space-y-4">
          {today.map((a) => (
            <Card key={a.id} className={`p-6 ${a.status === 'arrived' ? 'border-emerald-300 bg-emerald-50/50' : 'border-teal-300'}`}>
              <AppointmentLines appt={a} />
              {a.status === 'arrived' ? (
                <div className="mt-5 flex flex-wrap items-center gap-4 text-xl">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-900 px-4 py-2 font-semibold">
                    <CheckCircle2 className="w-6 h-6" /> {t('checkedInBadge')}
                  </span>
                  <span className="inline-flex items-center gap-2"><MapPin className="w-6 h-6" />{t('roomLabel', { room: a.room })}</span>
                  <span className="inline-flex items-center gap-2"><Users className="w-6 h-6" />
                    {a.patients_ahead === 0 ? t('youAreNext') : a.patients_ahead === 1 ? t('onePatientAhead') : t('patientsAhead', { n: a.patients_ahead })}
                  </span>
                </div>
              ) : (
                <Button className="mt-5 w-full" icon={KeyRound} loading={busy === a.id} onClick={() => checkin(a.id)}>{t('checkInNow')}</Button>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">{t('upcomingTitle')}</h2>
        {upcoming.length === 0 && <Card className="p-6 text-xl text-slate-600">{t('noUpcoming')}</Card>}
        <div className="space-y-4">
          {upcoming.map((a) => (
            <Card key={a.id} className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1"><AppointmentLines appt={a} /></div>
              <Button variant="danger" size="md" icon={X} loading={busy === a.id} onClick={() => setCancelling(a)}>{t('cancelAppt')}</Button>
            </Card>
          ))}
        </div>
      </section>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-3">{t('yourInfo')}</h2>
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-lg">
          <div className="flex gap-2"><dt className="text-slate-500">{t('patientId')}:</dt><dd className="font-mono">{patient.id}</dd></div>
          <div className="flex gap-2"><dt className="text-slate-500">{t('dob')}:</dt><dd>{formatDate(patient.dob, lang, { year: 'numeric', month: 'long', day: 'numeric' })}</dd></div>
          <div className="flex gap-2"><dt className="text-slate-500">{t('phone')}:</dt><dd>{patient.phone}</dd></div>
          <div className="flex gap-2"><dt className="text-slate-500">{t('insurance')}:</dt><dd>{patient.insurance_provider || t('noInsurance')}</dd></div>
        </dl>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Button icon={CalendarPlus} onClick={() => go('book')}>{t('bookNew')}</Button>
        <Button variant="secondary" icon={LogOut} onClick={() => go('done')}>{t('finish')}</Button>
      </div>

      {cancelling && (
        <Modal>
          <h2 className="text-2xl font-bold mb-6">
            {t('cancelConfirm', { date: formatDate(cancelling.date, lang), time: formatTime(cancelling.time, lang) })}
          </h2>
          <div className="flex gap-4">
            <Button variant="secondary" className="flex-1" onClick={() => setCancelling(null)}>{t('keepIt')}</Button>
            <Button variant="danger" className="flex-1" onClick={confirmCancel}>{t('yesCancel')}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
