import React from 'react';
import { Check, Calendar, User, Clock, MapPin } from 'lucide-react';

export default function StepConfirm({ t, patient, appointment, onNext }) {
  
  console.log("🟦 StepConfirm received patient:", patient);
  console.log("🟩 StepConfirm received appointment:", appointment);
  console.log("🟥 StepConfirm rendering...");

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        {t.verificationSuccess}, {patient.first_name || patient.name}!
      </h2>

      {/* Patient Info */}
      <div className="bg-blue-50 p-6 rounded-lg mb-4">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <User className="w-5 h-5" /> {t.personalInfo}
        </h3>
        <p><strong>{t.patientId}:</strong> {patient.id}</p>
        <p><strong>{t.dob}:</strong> {patient.dob}</p>
        {patient.address && (
          <p><strong>{t.address}:</strong> {patient.address}</p>
        )}
      </div>

      {/* Appointment Information */}
      {appointment && appointment.date && (
        <div className="bg-green-50 p-6 rounded-lg mb-6">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            {t.appointmentDetails}
          </h3>

          <p><strong>{t.date}:</strong> {appointment.date}</p>
          <p><strong>{t.time}:</strong> {appointment.time}</p>
          <p><strong>{t.physician}:</strong> {appointment.physician}</p>
          <p><strong>{t.department}:</strong> {appointment.department}</p>
        </div>
      )}

      {/* NEXT BUTTON */}
      <button
        onClick={onNext}
        className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold flex justify-center gap-2"
      >
        <Check /> {t.next}
      </button>
    </div>
  );
}
