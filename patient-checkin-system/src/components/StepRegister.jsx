import React, { useState } from 'react';
import { Loader2, CheckCircle, UserPlus, AlertCircle } from 'lucide-react';

// NEW: Helper function to get today's date in YYYY-MM-DD format
const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
};

function StepRegister({ t, data, setData, onSubmit, isProcessing, faceImage }) {
  const [errors, setErrors] = useState({});
  const [today] = useState(getTodayString()); // Get today's date once

  const validate = () => {
      const newErrors = {};
      if (!data.firstName.trim()) newErrors.firstName = t.errReq;
      if (!data.lastName.trim()) newErrors.lastName = t.errReq;
      if (!data.dob) newErrors.dob = t.errReq;
      if (!data.address.trim()) newErrors.address = t.errReq;
      if (!/^\d{10,15}$/.test(data.phone.replace(/\D/g,''))) newErrors.phone = t.errPhone;
      if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = t.errEmail;
      if (!data.insurance.provider.trim()) newErrors.provider = t.errReq;
      if (!data.insurance.policy.trim()) newErrors.policy = t.errReq;
      if (!data.insurance.group.trim()) newErrors.group = t.errReq;
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSubmit(); };
  const handleChange = (f, v) => { setData(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(p => ({ ...p, [f]: null })); };
  const handleIns = (f, v) => { setData(p => ({ ...p, insurance: { ...p.insurance, [f]: v } })); if (errors[f]) setErrors(p => ({ ...p, [f]: null })); };
  const Err = ({ f }) => errors[f] ? <div className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle size={12}/> {errors[f]}</div> : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6"><UserPlus className="w-16 h-16 mx-auto text-green-600 mb-2"/><h2 className="text-2xl font-bold">{t.registerNewPatient}</h2>{faceImage && <img src={faceImage} alt="Face" className="w-24 h-24 rounded-full mx-auto border-4 border-green-500 mt-4" />}</div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><input className={`p-3 border-2 rounded-lg w-full ${errors.firstName?'border-red-500 bg-red-50':''}`} placeholder={t.firstName} value={data.firstName} onChange={e => handleChange('firstName', e.target.value)} /><Err f="firstName"/></div>
          <div><input className={`p-3 border-2 rounded-lg w-full ${errors.lastName?'border-red-500 bg-red-50':''}`} placeholder={t.lastName} value={data.lastName} onChange={e => handleChange('lastName', e.target.value)} /><Err f="lastName"/></div>
        </div>
        
        {/* UPDATED: Added 'max={today}' to prevent future dates */}
        <div>
            <input 
                type="date" 
                className={`w-full p-3 border-2 rounded-lg ${errors.dob?'border-red-500 bg-red-50':''}`} 
                value={data.dob} 
                onChange={e => handleChange('dob', e.target.value)}
                max={today} 
            />
            <Err f="dob"/>
        </div>

        <div><input className={`w-full p-3 border-2 rounded-lg ${errors.address?'border-red-500 bg-red-50':''}`} placeholder={t.address} value={data.address} onChange={e => handleChange('address', e.target.value)} /><Err f="address"/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><input className={`p-3 border-2 rounded-lg w-full ${errors.phone?'border-red-500 bg-red-50':''}`} placeholder={t.phone} value={data.phone} onChange={e => handleChange('phone', e.target.value)} /><Err f="phone"/></div>
          <div><input className={`p-3 border-2 rounded-lg w-full ${errors.email?'border-red-500 bg-red-50':''}`} placeholder={t.email} value={data.email} onChange={e => handleChange('email', e.target.value)} /><Err f="email"/></div>
        </div>
        <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">{t.insuranceInfo}</h3>
            <div><input className={`w-full p-3 border-2 rounded-lg mb-2 ${errors.provider?'border-red-500 bg-red-50':''}`} placeholder={t.insuranceProvider} value={data.insurance.provider} onChange={e => handleIns('provider', e.target.value)} /><Err f="provider"/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><input className={`w-full p-3 border-2 rounded-lg ${errors.policy?'border-red-500 bg-red-50':''}`} placeholder={t.policyNumber} value={data.insurance.policy} onChange={e => handleIns('policy', e.target.value)} /><Err f="policy"/></div>
              <div><input className={`w-full p-3 border-2 rounded-lg ${errors.group?'border-red-500 bg-red-50':''}`} placeholder={t.groupNumber} value={data.insurance.group} onChange={e => handleIns('group', e.target.value)} /><Err f="group"/></div>
            </div>
        </div>
        <button onClick={handleSubmit} disabled={isProcessing} className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-300 flex justify-center gap-2">{isProcessing ? <Loader2 className="animate-spin"/> : <CheckCircle/>} {t.registerAndSave}</button>
      </div>
    </div>
  );
}