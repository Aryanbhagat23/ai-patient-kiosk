import React, { useEffect, useState } from 'react';
import { Users, Calendar, RefreshCw, Trash2, LogOut, Shield, FileText, Activity, X, User } from 'lucide-react';

export default function AdminPortal({ onLogout }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  const [ehrData, setEhrData] = useState(null);

  const fetchData = async () => {
    // (Loading set to false immediately to avoid flicker on auto-refresh)
    try {
      const [pRes, aRes, lRes] = await Promise.all([
          fetch("http://localhost:8000/api/v1/patients"),
          fetch("http://localhost:8000/api/v1/appointments"),
          fetch("http://localhost:8000/api/v1/audit_logs")
      ]);
      if (pRes.ok && aRes.ok && lRes.ok) {
          setPatients(await pRes.json() || []);
          setAppointments(await aRes.json() || []);
          setAuditLogs(await lRes.json() || []);
      }
    } catch (error) { console.error("API Error"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 3000); return () => clearInterval(i); }, []);

  const handleReset = async () => {
      if(window.confirm("⚠️ DELETE ALL DATA?")) {
          await fetch("http://localhost:8000/api/v1/reset_db", {method:'DELETE'});
          fetchData();
      }
  };

  const handleViewEHR = async (pid) => {
      try {
          const res = await fetch(`http://localhost:8000/api/v1/integration/ehr/${pid}`);
          if(res.ok) setEhrData(await res.json());
      } catch (e) { alert("EHR Connection Failed"); }
  };

  // Helper to get image URL from backend
  const getImgUrl = (path) => path ? `http://localhost:8000/${path}` : null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><Shield className="w-8 h-8 text-blue-600"/> Staff Dashboard</h1><p className="text-green-600 flex items-center gap-1 text-sm"><LockIcon className="w-4 h-4"/> Secure Session</p></div>
          <div className="flex gap-3">
             <button onClick={()=>fetchData()} className="flex items-center gap-2 px-4 py-2 bg-white border rounded hover:bg-gray-50"><RefreshCw size={16} className={loading?'animate-spin':''}/> Refresh</button>
             <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 border border-red-200 rounded hover:bg-red-200"><Trash2 size={16}/> Reset DB</button>
             <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"><LogOut size={16}/> Exit</button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between"><div><p className="text-gray-500">Patients</p><h2 className="text-3xl font-bold">{patients.length}</h2></div><Users className="w-10 h-10 text-blue-100"/></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex justify-between"><div><p className="text-gray-500">Appointments</p><h2 className="text-3xl font-bold">{appointments.length}</h2></div><Calendar className="w-10 h-10 text-green-100"/></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500 flex justify-between"><div><p className="text-gray-500">Audit Events</p><h2 className="text-3xl font-bold">{auditLogs.length}</h2></div><FileText className="w-10 h-10 text-orange-100"/></div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-4 border-b bg-white p-2 rounded-t-xl">
            {['appointments', 'patients', 'audit'].map(tab => (
                <button key={tab} className={`px-4 py-2 font-medium capitalize rounded-lg transition-colors ${activeTab === tab ? 'bg-blue-100 text-blue-800' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setActiveTab(tab)}>{tab === 'audit' ? 'HIPAA Audit Log' : tab}</button>
            ))}
        </div>

        {/* TABLES */}
        <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                {activeTab === 'appointments' && <><th className="p-4">Time</th><th className="p-4">Patient</th><th className="p-4">Details</th><th className="p-4">Status</th></>}
                {activeTab === 'patients' && <><th className="p-4">Profile</th><th className="p-4">ID / Name</th><th className="p-4">Contact</th><th className="p-4">Actions</th></>}
                {activeTab === 'audit' && <><th className="p-4 w-1/6">Timestamp</th><th className="p-4 w-1/6">Action</th><th className="p-4">Details</th></>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeTab === 'appointments' && appointments.map((a,i) => (
                <tr key={i} className="hover:bg-gray-50"><td className="p-4">{a.date}<br/><span className="text-sm text-gray-500">{a.time}</span></td><td className="p-4 font-medium">{a.patient_name}</td><td className="p-4 text-sm">{a.physician}<br/>{a.department}</td><td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${a.status==='arrived'?'bg-green-100 text-green-800':'bg-blue-100 text-blue-800'}`}>{a.status.toUpperCase()}</span></td></tr>
              ))}
              {activeTab === 'patients' && patients.map((p,i) => (
                <tr key={i} className="hover:bg-gray-50">
                    <td className="p-4">
                        {p.image_path ? 
                            <img src={getImgUrl(p.image_path)} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"/> : 
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center"><User className="text-gray-400"/></div>
                        }
                    </td>
                    <td className="p-4"><div className="font-bold">{p.first_name} {p.last_name}</div><div className="font-mono text-xs text-blue-600">{p.id}</div></td>
                    <td className="p-4 text-sm">{p.email}<br/>{p.phone}</td>
                    <td className="p-4"><button onClick={() => handleViewEHR(p.id)} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium hover:bg-indigo-100 transition"><Activity size={14}/> View EHR</button></td>
                </tr>
              ))}
              {activeTab === 'audit' && auditLogs.map((log,i) => (
                <tr key={i} className="hover:bg-gray-50 font-mono text-sm"><td className="p-4 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td><td className="p-4 font-bold"><span className={`px-2 py-1 rounded ${log.action.includes('LOGIN')?'bg-yellow-100 text-yellow-800': log.action==='REGISTER'?'bg-green-100 text-green-800': log.action.includes('EHR')?'bg-purple-100 text-purple-800':'bg-gray-100'}`}>{log.action}</span></td><td className="p-4">{log.details}</td></tr>
              ))}
            </tbody>
          </table>
          {(activeTab==='appointments'?appointments:activeTab==='patients'?patients:auditLogs).length === 0 && <div className="p-8 text-center text-gray-500">No records found.</div>}
        </div>
      </div>

      {/* EHR MODAL */}
      {ehrData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Activity/> External EHR Record</h2>
                    <button onClick={() => setEhrData(null)} className="text-white/80 hover:text-white"><X/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between text-sm text-gray-500"><span>Source: {ehrData.source}</span><span>ID: {ehrData.data.patient_id}</span></div>
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-xs text-indigo-500 font-semibold uppercase">Full Name</p><p className="font-medium">{ehrData.data.full_name}</p></div>
                            <div><p className="text-xs text-indigo-500 font-semibold uppercase">Blood Type</p><p className="font-medium">{ehrData.data.blood_type}</p></div>
                            <div><p className="text-xs text-indigo-500 font-semibold uppercase">Last Visit</p><p className="font-medium">{ehrData.data.last_visit}</p></div>
                        </div>
                        <div className="pt-3 border-t border-indigo-200"><p className="text-xs text-indigo-500 font-semibold uppercase">Allergies</p><p className="font-medium text-red-600">{ehrData.data.allergies}</p></div>
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-4">CONFIDENTIAL - AUTHORIZED PERSONNEL ONLY</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
const LockIcon=(p)=><svg{...p}xmlns="http://www.w3.org/2000/svg"width="24"height="24"viewBox="0 0 24 24"fill="none"stroke="currentColor"strokeWidth="2"strokeLinecap="round"strokeLinejoin="round"><rect width="18"height="11"x="3"y="11"rx="2"ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;