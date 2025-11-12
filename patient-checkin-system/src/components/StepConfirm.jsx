import React from 'react';
import { Check } from 'lucide-react';
export default function StepConfirm({ t, patient, onNext }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.verificationSuccess}, {patient.name}!</h2>
      <div className="bg-blue-50 p-6 rounded-lg mb-4">
        <h3 className="font-semibold text-lg mb-2">{t.personalInfo}</h3>
        <p><strong>{t.patientId}:</strong> {patient.id}</p>
        <p><strong>{t.dob}:</strong> {patient.dob}</p>
      </div>
      <button onClick={onNext} className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold flex justify-center gap-2">
        <Check/> {t.next}
      </button>
    </div>
  );
}