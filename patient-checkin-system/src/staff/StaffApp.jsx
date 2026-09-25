import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Clock, FileText, KeyRound, Loader2, LogOut,
  RefreshCw, Search, ShieldCheck, Trash2, User, UserCheck, Users, X,
} from 'lucide-react';
import { api, fetchImage } from '../api';
import { formatDate, formatTime } from '../i18n';
import { Button, Field, Modal, Notice, TextInput } from '../ui';

const IDLE_LOGOUT_MS = 15 * 60 * 1000;
const STATUS_STYLE = {
  scheduled: 'bg-sky-100 text-sky-900',
  arrived: 'bg-amber-100 text-amber-900',
  completed: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-slate-200 text-slate-600',
  no_show: 'bg-red-100 text-red-800',
};
const STATUS_LABEL = { scheduled: 'Scheduled', arrived: 'Waiting', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' };
const ERRORS = {
  invalid_credentials: 'Incorrect username or password.',
  wrong_password: 'Your current password is incorrect.',
  weak_password: 'Choose a new password that is different from the default.',
  offline: "Can't reach the server. Is the backend running?",
  slot_taken: 'That time slot is now taken by another appointment.',
};
const errorText = (e) => (e?.code?.startsWith('locked:') ? `Too many failed attempts. Try again in ${Math.ceil(Number(e.code.split(':')[1]) / 60)} min.` : ERRORS[e?.code] || 'Something went wrong. Please try again.');
const fmtPhone = (p) => (/^\d{10}$/.test(p || '') ? `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}` : p);
const fmtStamp = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export default function StaffApp({ onExit }) {
  const [auth, setAuth] = useState(null); // { token, username, must_change_password }
  const logout = useCallback(() => { setAuth(null); onExit(); }, [onExit]);

  if (!auth) return <Login onBack={onExit} onLogin={setAuth} />;
  if (auth.must_change_password) {
    return <ChangePassword auth={auth} onDone={() => setAuth({ ...auth, must_change_password: false })} onCancel={logout} />;
  }
  return <Dashboard auth={auth} onLogout={logout} />;
}

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-6"><ShieldCheck className="w-9 h-9" /></div>
        <h1 className="text-3xl font-bold mb-1">{title}</h1>
        <p className="text-slate-500 mb-8">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

function Login({ onLogin, onBack }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onLogin(await api('/api/v1/staff/login', { method: 'POST', body: form }));
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };
  return (
    <AuthShell title="Staff sign in" subtitle="Authorized clinic staff only. All access is logged.">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Username"><TextInput autoFocus autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
        <Field label="Password"><TextInput type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" size="md" className="w-full" icon={KeyRound} loading={busy} disabled={!form.username || !form.password}>Sign in</Button>
        <Button size="md" variant="ghost" className="w-full" icon={ArrowLeft} onClick={onBack}>Back to kiosk</Button>
      </form>
    </AuthShell>
  );
}

function ChangePassword({ auth, onDone, onCancel }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const problem = form.next && form.next.length < 8 ? 'At least 8 characters.' : form.confirm && form.next !== form.confirm ? "Passwords don't match." : null;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/api/v1/staff/change-password', { method: 'POST', token: auth.token, body: { current_password: form.current, new_password: form.next } });
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };
  return (
    <AuthShell title="Set a new password" subtitle="You're using the default password. Choose a new one to protect patient data.">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Current password"><TextInput type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></Field>
        <Field label="New password" hint="At least 8 characters."><TextInput type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} /></Field>
        <Field label="Confirm new password" error={problem}><TextInput type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></Field>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" size="md" className="w-full" loading={busy} disabled={!form.current || !form.next || form.next !== form.confirm || !!problem}>Save password</Button>
        <Button size="md" variant="ghost" className="w-full" onClick={onCancel}>Cancel</Button>
      </form>
    </AuthShell>
  );
}

// ---------------------------------------------------------------------------------------------
function Dashboard({ auth, onLogout }) {
  const [tab, setTab] = useState('today');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const lastActivity = useRef(Date.now());

  const call = useCallback(async (path, opts = {}) => {
    try {
      return await api(path, { ...opts, token: auth.token });
    } catch (e) {
      if (e.status === 401) onLogout();
      throw e;
    }
  }, [auth.token, onLogout]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await call('/api/v1/staff/summary'));
      setError(null);
    } catch (e) {
      setError(errorText(e));
    }
  }, [call]);

  useEffect(() => {
    loadSummary();
    const i = setInterval(loadSummary, 15000);
    return () => clearInterval(i);
  }, [loadSummary, refreshKey]);

  useEffect(() => {
    const touch = () => { lastActivity.current = Date.now(); };
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    const i = setInterval(() => Date.now() - lastActivity.current > IDLE_LOGOUT_MS && onLogout(), 30000);
    return () => { window.removeEventListener('pointerdown', touch); window.removeEventListener('keydown', touch); clearInterval(i); };
  }, [onLogout]);

  const refresh = () => setRefreshKey((k) => k + 1);
  const tabs = [
    ['today', 'Today', Activity], ['appointments', 'Appointments', CalendarDays],
    ['patients', 'Patients', Users], ['audit', 'Audit log', FileText],
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <ShieldCheck className="w-8 h-8 text-teal-300" />
          <div className="flex-1">
            <div className="text-xl font-bold">Staff dashboard</div>
            <div className="text-sm text-slate-300">Signed in as {auth.username} · auto sign-out after 15 minutes of inactivity</div>
          </div>
          {summary && <FaceStatus face={summary.face} />}
          <button onClick={refresh} className="p-2 rounded-lg hover:bg-white/10" title="Refresh"><RefreshCw className="w-5 h-5" /></button>
          <button onClick={() => setResetOpen(true)} className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-red-200" title="Delete all demo data">Reset demo data</button>
          <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"><LogOut className="w-5 h-5" /> Sign out</button>
        </div>
        <nav className="max-w-7xl mx-auto px-6 flex gap-1">
          {tabs.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-sm font-medium ${tab === id ? 'bg-slate-100 text-slate-900' : 'text-slate-300 hover:text-white'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        {error && <Notice tone="error" className="mb-6">{error}</Notice>}
        {tab === 'today' && <TodayTab summary={summary} call={call} onChange={loadSummary} key={`t${refreshKey}`} />}
        {tab === 'appointments' && <AppointmentsTab call={call} onChange={loadSummary} key={`a${refreshKey}`} />}
        {tab === 'patients' && <PatientsTab call={call} token={auth.token} onChange={loadSummary} key={`p${refreshKey}`} />}
        {tab === 'audit' && <AuditTab call={call} key={`l${refreshKey}`} />}
      </main>
      {resetOpen && <ResetDialog call={call} onClose={(done) => { setResetOpen(false); if (done) refresh(); }} />}
    </div>
  );
}

function FaceStatus({ face }) {
  const ok = face.status === 'ready';
  return (
    <span title={face.message} className={`hidden md:inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full ${ok ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} /> Face recognition {ok ? 'ready' : face.status}
    </span>
  );
}

function Stat({ label, value, icon: Icon, tone }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tone}`}><Icon className="w-6 h-6" /></div>
      <div><div className="text-3xl font-bold">{value ?? '—'}</div><div className="text-sm text-slate-500">{label}</div></div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLE[status] || 'bg-slate-100'}`}>{STATUS_LABEL[status] || status}</span>;
}

function StatusActions({ appt, call, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = async (status) => {
    setBusy(true);
    setError(null);
    try {
      await call(`/api/v1/staff/appointments/${appt.id}`, { method: 'PATCH', body: { status } });
      await onChange();
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  };
  const actions = {
    scheduled: [['arrived', 'Check in'], ['no_show', 'No-show'], ['cancelled', 'Cancel']],
    arrived: [['completed', 'Complete visit'], ['scheduled', 'Undo check-in']],
    completed: [['arrived', 'Reopen']],
    cancelled: [['scheduled', 'Restore']],
    no_show: [['scheduled', 'Restore']],
  }[appt.status] || [];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {actions.map(([s, label], i) => (
        <button key={s} disabled={busy} onClick={() => set(s)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border disabled:opacity-50 ${i === 0 ? 'bg-teal-700 text-white border-teal-700 hover:bg-teal-800' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
          {label}
        </button>
      ))}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}

function AppointmentTable({ rows, call, onChange, showDate }) {
  if (!rows.length) return <div className="p-10 text-center text-slate-500">No appointments.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-sm text-slate-500">
          <tr>
            <th className="p-4">{showDate ? 'Date / time' : 'Time'}</th><th className="p-4">Patient</th><th className="p-4">Doctor</th>
            <th className="p-4">Room</th><th className="p-4">Status</th><th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((a) => (
            <tr key={a.id} className={['cancelled', 'no_show', 'completed'].includes(a.status) ? 'text-slate-500' : ''}>
              <td className="p-4 whitespace-nowrap">
                {showDate && <div className="text-sm">{formatDate(a.date, 'en', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                <div className="font-semibold">{formatTime(a.time, 'en')}</div>
              </td>
              <td className="p-4"><div className="font-medium">{a.patient_name}</div><div className="text-xs font-mono text-slate-500">{a.patient_id}</div>
                {a.reason && <div className="text-sm text-slate-500">{a.reason}</div>}</td>
              <td className="p-4"><div>{a.physician}</div><div className="text-sm text-slate-500">{a.department}</div></td>
              <td className="p-4">{a.room}</td>
              <td className="p-4">
                <StatusBadge status={a.status} />
                {a.status === 'arrived' && a.waiting_minutes != null && <div className="text-sm text-amber-800 mt-1">waiting {a.waiting_minutes} min</div>}
              </td>
              <td className="p-4"><StatusActions appt={a} call={call} onChange={onChange} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2>{action}</div>
      {children}
    </section>
  );
}

function TodayTab({ summary, call, onChange }) {
  const [rows, setRows] = useState(null);
  const load = useCallback(async () => { setRows(await call('/api/v1/staff/appointments').catch(() => [])); }, [call]);
  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, [load]);
  const changed = async () => { await Promise.all([load(), onChange()]); };
  if (!summary) return <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-400" /></div>;
  const c = summary.counts;
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Stat label="Scheduled today" value={c.scheduled} icon={CalendarDays} tone="bg-sky-100 text-sky-800" />
        <Stat label="In waiting room" value={c.arrived} icon={Clock} tone="bg-amber-100 text-amber-800" />
        <Stat label="Completed" value={c.completed} icon={CheckCircle2} tone="bg-emerald-100 text-emerald-800" />
        <Stat label="No-shows" value={c.no_show} icon={AlertTriangle} tone="bg-red-100 text-red-800" />
        <Stat label="Avg. visit (min)" value={summary.avg_visit_minutes} icon={Activity} tone="bg-slate-100 text-slate-700" />
      </div>
      <Panel title={`Waiting room (${summary.waiting.length})`}>
        {summary.waiting.length === 0 ? <div className="p-8 text-center text-slate-500">Nobody is waiting.</div> : (
          <ul className="divide-y divide-slate-100">
            {summary.waiting.map((w) => (
              <li key={w.id} className="p-4 flex flex-wrap items-center gap-4">
                <UserCheck className="w-6 h-6 text-amber-700" />
                <div className="flex-1 min-w-[12rem]"><div className="font-medium">{w.patient_name}</div><div className="text-sm text-slate-500">{w.physician} · Room {w.room} · {formatTime(w.time, 'en')}</div></div>
                <span className={`text-sm font-medium ${w.waiting_minutes > 20 ? 'text-red-700' : 'text-slate-600'}`}>waiting {w.waiting_minutes} min</span>
                <StatusActions appt={w} call={call} onChange={changed} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title={`Today's schedule · ${formatDate(summary.date, 'en')}`}>
        {rows ? <AppointmentTable rows={rows} call={call} onChange={changed} /> : <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}
      </Panel>
      <div className="text-sm text-slate-500">{summary.patients_total} registered patients · {summary.faces_enrolled} enrolled for face check-in</div>
    </>
  );
}

function AppointmentsTab({ call, onChange }) {
  const [day, setDay] = useState('all');
  const [rows, setRows] = useState(null);
  const load = useCallback(async () => {
    setRows(await call(`/api/v1/staff/appointments?day=${encodeURIComponent(day || 'all')}`).catch(() => []));
  }, [call, day]);
  useEffect(() => { setRows(null); load(); }, [load]);
  return (
    <Panel title="Appointments" action={(
      <div className="flex items-center gap-3">
        <input type="date" value={day === 'all' ? '' : day} onChange={(e) => setDay(e.target.value || 'all')} className="border rounded-lg px-3 py-2" />
        <button onClick={() => setDay('all')} className={`px-3 py-2 rounded-lg text-sm ${day === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>All dates</button>
      </div>
    )}>
      {rows ? <AppointmentTable rows={rows} call={call} onChange={async () => { await load(); await onChange(); }} showDate /> : <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>}
    </Panel>
  );
}

function PatientsTab({ call, token, onChange }) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);
  const load = useCallback(async () => {
    setRows(await call(`/api/v1/staff/patients?q=${encodeURIComponent(q)}`).catch(() => []));
  }, [call, q]);
  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [load]);
  return (
    <>
      <Panel title={`Patients${rows ? ` (${rows.length})` : ''}`} action={(
        <label className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, ID or phone" className="outline-none w-64" />
        </label>
      )}>
        {!rows ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : rows.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No patients found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-sm text-slate-500"><tr><th className="p-4">Patient</th><th className="p-4">Date of birth</th><th className="p-4">Contact</th><th className="p-4">Face check-in</th><th className="p-4">Visits</th><th className="p-4" /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setOpen(p)}>
                  <td className="p-4"><div className="font-medium">{p.first_name} {p.last_name}</div><div className="text-xs font-mono text-slate-500">{p.id}</div></td>
                  <td className="p-4">{formatDate(p.dob, 'en', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="p-4 text-sm">{fmtPhone(p.phone)}<br />{p.email}</td>
                  <td className="p-4">{p.has_face ? <span className="text-emerald-700 font-medium">Enrolled</span> : <span className="text-slate-400">Not enrolled</span>}</td>
                  <td className="p-4">{p.appointments}</td>
                  <td className="p-4 text-right text-teal-700 font-medium">Open →</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      {open && <PatientDrawer patient={open} call={call} token={token} onClose={async (changed) => { setOpen(null); if (changed) { await load(); await onChange(); } }} />}
    </>
  );
}

function PatientDrawer({ patient: p, call, token, onClose }) {
  const [photo, setPhoto] = useState(null);
  const [record, setRecord] = useState(null);
  const [confirm, setConfirm] = useState(null); // 'face' | 'patient'
  const [error, setError] = useState(null);

  useEffect(() => {
    let url;
    if (p.has_photo) fetchImage(`/api/v1/staff/patients/${p.id}/photo`, token).then((u) => { url = u; setPhoto(u); }).catch(() => {});
    call(`/api/v1/staff/patients/${p.id}/record`).then(setRecord).catch((e) => setError(errorText(e)));
    return () => url && URL.revokeObjectURL(url);
  }, [p.id, p.has_photo, call, token]);

  const remove = async () => {
    try {
      await call(confirm === 'face' ? `/api/v1/staff/patients/${p.id}/face` : `/api/v1/staff/patients/${p.id}`, { method: 'DELETE' });
      onClose(true);
    } catch (e) {
      setError(errorText(e));
      setConfirm(null);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={() => onClose(false)}>
      <aside className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex items-center gap-4">
          {photo ? <img src={photo} alt="" className="w-20 h-20 rounded-2xl object-cover" /> : <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center"><User className="w-10 h-10 text-slate-400" /></div>}
          <div className="flex-1"><div className="text-2xl font-bold">{p.first_name} {p.last_name}</div><div className="font-mono text-sm text-slate-500">{p.id}</div></div>
          <button onClick={() => onClose(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-6">
          {error && <Notice tone="error">{error}</Notice>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="text-slate-500">Date of birth</dt><dd>{formatDate(p.dob, 'en', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
            <dt className="text-slate-500">Phone</dt><dd>{fmtPhone(p.phone)}</dd>
            <dt className="text-slate-500">Email</dt><dd>{p.email || '—'}</dd>
            <dt className="text-slate-500">Address</dt><dd>{p.address}</dd>
            <dt className="text-slate-500">Insurance</dt><dd>{p.insurance_provider ? `${p.insurance_provider} · ${p.insurance_policy}${p.insurance_group ? ` · grp ${p.insurance_group}` : ''}` : 'Self-pay'}</dd>
            <dt className="text-slate-500">Registered</dt><dd>{fmtStamp(p.registered_date)}</dd>
            <dt className="text-slate-500">Face check-in</dt><dd>{p.has_face ? 'Enrolled (with consent)' : 'Not enrolled'}</dd>
          </dl>
          {!record ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <>
              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
                <div className="text-sm font-semibold text-indigo-800 mb-2">{record.ehr.source}</div>
                <div className="grid grid-cols-2 gap-2"><div>Blood type: <b>{record.ehr.blood_type}</b></div><div>Allergies: <b>{record.ehr.allergies}</b></div></div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Visit history</h3>
                {record.appointments.length === 0 ? <p className="text-slate-500">No appointments.</p> : (
                  <ul className="space-y-2">
                    {record.appointments.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 text-sm bg-slate-50 rounded-lg p-3">
                        <span className="w-28">{formatDate(a.date, 'en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="flex-1">{a.physician} · {a.reason}</span><StatusBadge status={a.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Signed forms</h3>
                {record.forms.length === 0 ? <p className="text-slate-500">None yet.</p> : (
                  <ul className="text-sm space-y-1">{record.forms.map((f, i) => <li key={i}>{f.form_id.toUpperCase()} · {fmtStamp(f.signed_at)}</li>)}</ul>
                )}
              </div>
            </>
          )}
          <div className="border-t pt-6 space-y-3">
            <h3 className="font-semibold">Privacy requests</h3>
            {p.has_face && <Button variant="secondary" size="sm" icon={Trash2} onClick={() => setConfirm('face')}>Delete face data only</Button>}
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirm('patient')}>Delete patient and all records</Button>
          </div>
        </div>
      </aside>
      {confirm && (
        <Modal>
          <div onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-3">{confirm === 'face' ? 'Delete face data?' : 'Delete this patient?'}</h2>
            <p className="text-slate-600 mb-6">
              {confirm === 'face'
                ? `${p.first_name}'s photo and face signature will be permanently deleted. They can still check in with their details.`
                : `${p.first_name} ${p.last_name}, their appointments, signed forms and face data will be permanently deleted. This cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant="danger" size="md" className="flex-1" onClick={remove}>Delete permanently</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AuditTab({ call }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { call('/api/v1/staff/audit?limit=300').then(setRows).catch(() => setRows([])); }, [call]);
  const tone = (a) => (a.includes('FAILED') || a.includes('DELETE') || a.includes('RESET') || a.includes('SPOOF') ? 'bg-red-100 text-red-800'
    : a.includes('LOGIN') || a.includes('PASSWORD') ? 'bg-amber-100 text-amber-800'
      : a.includes('FACE') || a.includes('LOOKUP') ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700');
  return (
    <Panel title="Audit log (most recent first)">
      {!rows ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Time</th><th className="p-3">Action</th><th className="p-3">Details</th><th className="p-3">By</th><th className="p-3">IP</th></tr></thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {rows.map((l) => (
              <tr key={l.id}>
                <td className="p-3 whitespace-nowrap text-slate-500">{fmtStamp(l.timestamp)}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded ${tone(l.action)}`}>{l.action}</span></td>
                <td className="p-3">{l.details}</td><td className="p-3">{l.actor}</td><td className="p-3 text-slate-500">{l.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

function ResetDialog({ call, onClose }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const go = async () => {
    setBusy(true);
    try {
      await call('/api/v1/staff/reset-demo', { method: 'POST', body: { confirm: 'RESET' } });
      onClose(true);
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  };
  return (
    <Modal>
      <h2 className="text-2xl font-bold mb-3 flex items-center gap-2"><AlertTriangle className="text-red-600" /> Reset demo data</h2>
      <p className="text-slate-600 mb-4">This permanently deletes <b>all patients, appointments, signed forms and face photos</b>. Staff accounts and the audit log are kept.</p>
      <Field label='Type "RESET" to confirm'><TextInput value={text} onChange={(e) => setText(e.target.value)} /></Field>
      {error && <Notice tone="error" className="mt-4">{error}</Notice>}
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" size="md" className="flex-1" onClick={() => onClose(false)}>Cancel</Button>
        <Button variant="danger" size="md" className="flex-1" loading={busy} disabled={text !== 'RESET'} onClick={go}>Delete everything</Button>
      </div>
    </Modal>
  );
}
