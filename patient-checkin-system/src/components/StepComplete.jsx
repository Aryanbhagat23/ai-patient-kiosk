import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function StepComplete({ t, patient, appointment, isRegSuccess, onNext, onReset }) {
  if (isRegSuccess) {
      return (
        <div className="text-center">
          <CheckCircle className="w-24 h-24 mx-auto text-green-500 mb-4"/>
          <h2 className="text-3xl font-bold mb-2">{t.registrationSuccess}</h2>
          <p className="text-xl mb-6">{t.yourPatientId}: <strong>{patient.id}</strong></p>
          <button onClick={onNext} className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold">{t.next}</button>
        </div>
      );
  }
  return (
    <div className="text-center">
      <CheckCircle className="w-24 h-24 mx-auto text-blue-600 mb-4"/>
      <h2 className="text-3xl font-bold mb-2">{t.checkInComplete}</h2>
      <p className="text-gray-600 mb-8">{t.thankYou}, {patient.name}!</p>
      {appointment && appointment.date && (
          <div className="bg-gray-50 p-6 rounded-lg max-w-md mx-auto mb-8 text-left">
              <h3 className="font-bold mb-2">{t.appointmentDetails}</h3>
              <p>{appointment.date} at {appointment.time}</p>
              <p>{appointment.physician} - {appointment.department}</p>
          </div>
      )}
      <button onClick={onReset} className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold">{t.finish}</button>
    </div>
  );
}