import React from 'react';
import { UserPlus, Loader2, CheckCircle } from 'lucide-react';

export default function StepRegister({ t, data, setData, onSubmit, isProcessing, faceImage }) {
  const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));
  const handleInsurance = (field, value) => setData(prev => ({ ...prev, insurance: { ...prev.insurance, [field]: value } }));
  const isValid = data.firstName && data.lastName && data.dob;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6"><UserPlus className="w-16 h-16 mx-auto text-green-600 mb-2"/><h2 className="text-2xl font-bold">{t.registerNewPatient}</h2>
      {faceImage && <img src={faceImage} alt="Face" className="w-24 h-24 rounded-full mx-auto border-4 border-green-500 mt-4" />}</div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input className="p-3 border-2 rounded-lg" placeholder={t.firstName} value={data.firstName} onChange={e => handleChange('firstName', e.target.value)} />
          <input className="p-3 border-2 rounded-lg" placeholder={t.lastName} value={data.lastName} onChange={e => handleChange('lastName', e.target.value)} />
        </div>
        <input type="date" className="w-full p-3 border-2 rounded-lg" value={data.dob} onChange={e => handleChange('dob', e.target.value)} />
        <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">{t.insuranceInfo}</h3>
            <input className="w-full p-3 border-2 rounded-lg mb-2" placeholder={t.insuranceProvider} value={data.insurance.provider} onChange={e => handleInsurance('provider', e.target.value)} />
            <input className="w-full p-3 border-2 rounded-lg" placeholder={t.policyNumber} value={data.insurance.policy} onChange={e => handleInsurance('policy', e.target.value)} />
        </div>
        <button onClick={onSubmit} disabled={!isValid || isProcessing} className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-300 flex justify-center gap-2">
           {isProcessing ? <Loader2 className="animate-spin"/> : <CheckCircle/>} {t.registerAndSave}
        </button>
      </div>
    </div>
  );
}