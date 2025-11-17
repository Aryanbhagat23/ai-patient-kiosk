// import React from 'react';
// import { Loader2, Check } from 'lucide-react';
// export default function StepAppointment({ t, data, setData, onSubmit, isProcessing, depts, docs, times }) {
//   const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));
//   const isValid = data.department && data.physician && data.date && data.time;
//   return (
//     <div className="max-w-2xl mx-auto">
//       <h2 className="text-2xl font-bold mb-6">{t.scheduleAppointment}</h2>
//       <div className="space-y-4">
//         <select className="w-full p-3 border-2 rounded-lg" value={data.department} onChange={e => handleChange('department', e.target.value)}><option value="">{t.selectDepartment}</option>{depts.map(d => <option key={d} value={d}>{d}</option>)}</select>
//         {data.department && <select className="w-full p-3 border-2 rounded-lg" value={data.physician} onChange={e => handleChange('physician', e.target.value)}><option value="">{t.selectPhysician}</option>{docs[data.department].map(d => <option key={d} value={d}>{d}</option>)}</select>}
//         <div className="grid grid-cols-2 gap-4">
//             <input type="date" className="p-3 border-2 rounded-lg w-full" value={data.date} onChange={e => handleChange('date', e.target.value)} />
//             <select className="p-3 border-2 rounded-lg w-full" value={data.time} onChange={e => handleChange('time', e.target.value)}><option value="">{t.selectTime}</option>{times.map(time => <option key={time} value={time}>{time}</option>)}</select>
//         </div>
//         <textarea className="w-full p-3 border-2 rounded-lg" rows="3" placeholder={t.reasonForVisit} value={data.reason} onChange={e => handleChange('reason', e.target.value)} />
//         <button onClick={onSubmit} disabled={!isValid || isProcessing} className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 flex justify-center gap-2">{isProcessing ? <Loader2 className="animate-spin"/> : <Check/>} {t.bookAppointment}</button>
//       </div>
//     </div>
//   );
// }

import React from "react";
import {Loader2, Check } from "lucide-react";

export default function StepAppointment({
  t,
  data,
  setData,
  onSubmit,
  isProcessing,
  depts,
  docs,
  times
}) {
  const handleChange = (field, value) =>
    setData(prev => ({ ...prev, [field]: value }));

  const isValid =
    data.department &&
    data.physician &&
    data.date &&
    data.time &&
    data.reason;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-4">{t.bookAppointment}</h2>

      {/* Department */}
      <div>
        <label className="block font-medium mb-1">{t.department}</label>
        <select
          className="w-full p-3 border rounded"
          value={data.department}
          onChange={(e) => handleChange("department", e.target.value)}
        >
          <option value="">{t.selectDepartment}</option>
          {depts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Physician */}
      <div>
        <label className="block font-medium mb-1">{t.physician}</label>
        <select
          className="w-full p-3 border rounded"
          value={data.physician}
          onChange={(e) => handleChange("physician", e.target.value)}
        >
          <option value="">{t.selectPhysician}</option>
          {docs.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block font-medium mb-1">{t.date}</label>
        <input
          type="date"
          className="w-full p-3 border rounded"
          value={data.date}
          onChange={(e) => handleChange("date", e.target.value)}
        />
      </div>

      {/* Time */}
      <div>
        <label className="block font-medium mb-1">{t.time}</label>
        <select
          className="w-full p-3 border rounded"
          value={data.time}
          onChange={(e) => handleChange("time", e.target.value)}
        >
          <option value="">{t.selectTime}</option>
          {times.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Reason */}
      <div>
        <label className="block font-medium mb-1">{t.reason}</label>
        <input
          className="w-full p-3 border rounded"
          placeholder={t.reasonPlaceholder}
          value={data.reason}
          onChange={(e) => handleChange("reason", e.target.value)}
        />
      </div>

      {/* Confirm Button */}
      <button
        onClick={() => onSubmit(data)}
        disabled={!isValid || isProcessing}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 flex justify-center gap-2"
      >
        {isProcessing ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Check className="w-5 h-5" />
        )}
        {t.confirmAppointment}
      </button>
    </div>
  );
}


// function StepAppointment({ t, data, setData, onSubmit, isProcessing, depts, docs, times }) {
//   const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));
//   const isValid = data.department && data.physician && data.date && data.time;
//   return (
//     <div className="max-w-2xl mx-auto">
//       <h2 className="text-2xl font-bold mb-6">{t.scheduleAppointment}</h2>
//       <div className="space-y-4">
//         <select className="w-full p-3 border-2 rounded-lg" value={data.department} onChange={e => handleChange('department', e.target.value)}>
//           <option value="">{t.selectDepartment}</option>{depts.map(d => <option key={d} value={d}>{d}</option>)}
//         </select>
//         {data.department && (
//             <select className="w-full p-3 border-2 rounded-lg" value={data.physician} onChange={e => handleChange('physician', e.target.value)}>
//             <option value="">{t.selectPhysician}</option>{docs[data.department].map(d => <option key={d} value={d}>{d}</option>)}
//             </select>
//         )}
//         <div className="grid grid-cols-2 gap-4">
//             <input type="date" className="p-3 border-2 rounded-lg" value={data.date} onChange={e => handleChange('date', e.target.value)} />
//             <select className="p-3 border-2 rounded-lg" value={data.time} onChange={e => handleChange('time', e.target.value)}>
//                  <option value="">{t.selectTime}</option>{times.map(time => <option key={time} value={time}>{time}</option>)}
//             </select>
//         </div>
//         <button onClick={onSubmit} disabled={!isValid || isProcessing} className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 flex justify-center gap-2">
//             {isProcessing ? <Loader2 className="animate-spin"/> : <Check/>} {t.bookAppointment}
//         </button>
//       </div>
//     </div>
//   );
// }