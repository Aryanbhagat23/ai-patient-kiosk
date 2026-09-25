import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck, CheckCircle2, Clock, DoorOpen, KeyRound, MapPin, ScanFace, Stethoscope, UserPlus, Users, UserSearch } from 'lucide-react';
import { LANGUAGES, formatDate, formatTime } from '../i18n';
import { Button, Card } from '../ui';
import { Flash, useKiosk } from './Kiosk';

export function WelcomeScreen({ onStart, setLang }) {
  const { t, lang, cfg } = useKiosk();
  return (
    <div className="text-center py-10">
      <Flash />
      <div className="mx-auto w-24 h-24 rounded-3xl bg-teal-700 text-white flex items-center justify-center mb-8 shadow-lg">
        <Stethoscope className="w-14 h-14" />
      </div>
      <h1 className="text-5xl font-bold mb-4">{t('welcomeTitle')}</h1>
      <p className="text-2xl text-slate-600 max-w-2xl mx-auto mb-10">{t('welcomeSubtitle')}</p>
      <div className="flex flex-wrap justify-center gap-3 mb-12" role="group" aria-label={t('language')}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`min-h-[3.5rem] px-6 rounded-full text-xl font-medium border-2 transition ${
              lang === l.code ? 'bg-teal-700 text-white border-teal-700' : 'bg-white border-slate-300 hover:border-teal-600'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <Button onClick={onStart} className="px-16 min-h-[5rem] text-2xl shadow-lg" icon={ArrowRight}>{t('tapToStart')}</Button>
      <p className="sr-only">{cfg?.clinic_name}</p>
    </div>
  );
}

function OptionCard({ icon: Icon, title, desc, onClick, disabled, note }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left flex items-center gap-6 p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm hover:border-teal-600 hover:shadow-md transition disabled:opacity-60 disabled:hover:border-slate-200 disabled:cursor-not-allowed"
    >
      <div className="w-20 h-20 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
        <Icon className="w-11 h-11" />
      </div>
      <div className="flex-1">
        <div className="text-2xl font-semibold">{title}</div>
        <div className="text-lg text-slate-500">{note || desc}</div>
      </div>
      <ArrowRight className="w-8 h-8 text-slate-400" />
    </button>
  );
}

export function MethodScreen() {
  const { t, go, health } = useKiosk();
  const faceStatus = health?.face?.status;
  const faceNote = faceStatus === 'ready' ? null : faceStatus === 'unavailable' ? t('faceUnavailable') : t('faceStarting');
  return (
    <div className="max-w-3xl mx-auto">
      <Flash />
      <h1 className="text-4xl font-bold mb-8 text-center">{t('methodTitle')}</h1>
      <div className="space-y-5">
        <OptionCard icon={ScanFace} title={t('methodFace')} desc={t('methodFaceDesc')} note={faceNote}
          disabled={faceStatus !== 'ready'} onClick={() => go('scan')} />
        <OptionCard icon={UserSearch} title={t('methodDetails')} desc={t('methodDetailsDesc')} onClick={() => go('lookup')} />
        <OptionCard icon={UserPlus} title={t('methodNew')} desc={t('methodNewDesc')} onClick={() => go('register')} />
      </div>
    </div>
  );
}

export function ConfirmScreen({ patient, onYes, onNo }) {
  const { t } = useKiosk();
  const [busy, setBusy] = useState(false);
  if (!patient) return null;
  return (
    <div className="max-w-xl mx-auto text-center py-8">
      <Flash />
      <h1 className="text-4xl font-bold mb-8">{t('confirmTitle')}</h1>
      <Card className="p-10 mb-10">
        <div className="mx-auto w-24 h-24 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-4xl font-bold mb-4">
          {patient.first_name?.[0]}{patient.last_initial}
        </div>
        <div className="text-4xl font-semibold">{patient.first_name} {patient.last_initial}.</div>
      </Card>
      <div className="grid gap-4">
        <Button loading={busy} icon={CheckCircle2} onClick={async () => { setBusy(true); await onYes(); setBusy(false); }}>{t('confirmYes')}</Button>
        <Button variant="secondary" onClick={onNo} disabled={busy}>{t('confirmNo')}</Button>
      </div>
    </div>
  );
}

export function NoMatchScreen() {
  const { t, go } = useKiosk();
  return (
    <div className="max-w-3xl mx-auto">
      <Flash />
      <h1 className="text-4xl font-bold mb-3 text-center">{t('noMatchTitle')}</h1>
      <p className="text-xl text-slate-600 mb-8 text-center">{t('noMatchText')}</p>
      <div className="space-y-5">
        <OptionCard icon={ScanFace} title={t('tryAgain')} desc={t('methodFaceDesc')} onClick={() => go('scan')} />
        <OptionCard icon={UserSearch} title={t('methodDetails')} desc={t('methodDetailsDesc')} onClick={() => go('lookup')} />
        <OptionCard icon={UserPlus} title={t('methodNew')} desc={t('methodNewDesc')} onClick={() => go('register')} />
      </div>
    </div>
  );
}

/** Counts down and returns to the welcome screen. */
export function AutoReturn({ seconds }) {
  const { t, reset } = useKiosk();
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) {
      reset();
      return undefined;
    }
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left, reset]);
  return <p className="text-lg text-slate-500 mt-6">{t('returningIn', { n: left })}</p>;
}

export function AppointmentLines({ appt }) {
  const { t, lang } = useKiosk();
  return (
    <div className="space-y-1 text-xl">
      <div className="flex items-center gap-3"><CalendarCheck className="w-6 h-6 text-teal-700" />{formatDate(appt.date, lang)} · {formatTime(appt.time, lang)}</div>
      <div className="flex items-center gap-3"><Stethoscope className="w-6 h-6 text-teal-700" />{appt.physician} · {appt.department}</div>
      {appt.room && <div className="flex items-center gap-3"><DoorOpen className="w-6 h-6 text-teal-700" />{t('roomLabel', { room: appt.room })}</div>}
    </div>
  );
}

export function CheckedInScreen({ routing }) {
  const { t, lang, go } = useKiosk();
  if (!routing) return null;
  const ahead = routing.patients_ahead;
  return (
    <div className="max-w-2xl mx-auto text-center">
      <CheckCircle2 className="w-24 h-24 text-emerald-600 mx-auto mb-4" />
      <h1 className="text-5xl font-bold mb-8">{t('checkedInTitle')}</h1>
      <Card className="p-10 mb-8">
        <div className="text-2xl text-slate-600 mb-2">{t('proceedTo')}</div>
        <div className="flex items-center justify-center gap-4 text-6xl font-bold text-teal-800 mb-6">
          <MapPin className="w-14 h-14" /> {t('roomLabel', { room: routing.room })}
        </div>
        <div className="text-2xl">{routing.physician} · {routing.department}</div>
        <div className="text-xl text-slate-600 flex items-center justify-center gap-2 mt-2">
          <Clock className="w-6 h-6" /> {formatTime(routing.time, lang)}
        </div>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-teal-50 text-teal-900 px-6 py-3 text-xl font-medium">
          <Users className="w-6 h-6" />
          {ahead === 0 ? t('youAreNext') : ahead === 1 ? t('onePatientAhead') : t('patientsAhead', { n: ahead })}
        </div>
        {ahead > 0 && <div className="text-lg text-slate-500 mt-3">{t('estWait', { n: routing.estimated_wait_minutes })}</div>}
      </Card>
      <Button onClick={() => go('done')}>{t('finish')}</Button>
      <AutoReturn seconds={45} />
    </div>
  );
}

export function BookedScreen({ appointment, onCheckin }) {
  const { t, cfg, go } = useKiosk();
  if (!appointment) return null;
  const isToday = appointment.date === cfg.today;
  return (
    <div className="max-w-2xl mx-auto text-center">
      <CheckCircle2 className="w-24 h-24 text-emerald-600 mx-auto mb-4" />
      <h1 className="text-5xl font-bold mb-2">{t('bookedTitle')}</h1>
      <p className="text-2xl text-slate-600 mb-8">{t('bookedText')}</p>
      <Card className="p-8 mb-8 text-left"><AppointmentLines appt={appointment} /></Card>
      <div className="grid gap-4">
        {isToday && <Button icon={KeyRound} onClick={onCheckin}>{t('checkInForThis')}</Button>}
        <Button variant={isToday ? 'secondary' : 'primary'} onClick={() => go('done')}>{t('finish')}</Button>
        <Button variant="ghost" onClick={() => go('home')}>{t('back')}</Button>
      </div>
      <AutoReturn seconds={60} />
    </div>
  );
}

export function DoneScreen() {
  const { t, reset } = useKiosk();
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <CheckCircle2 className="w-28 h-28 text-emerald-600 mx-auto mb-6" />
      <h1 className="text-5xl font-bold mb-4">{t('doneTitle')}</h1>
      <p className="text-2xl text-slate-600 mb-10">{t('doneText')}</p>
      <Button onClick={() => reset()}>{t('finish')}</Button>
      <AutoReturn seconds={8} />
    </div>
  );
}

