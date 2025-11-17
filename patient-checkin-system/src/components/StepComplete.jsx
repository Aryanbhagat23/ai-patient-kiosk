// import React from 'react';
// import { CheckCircle } from 'lucide-react';

// export default function StepComplete({ t, patient, appointment, isRegSuccess, onNext, onReset }) {
//   if (isRegSuccess) {
//       return (
//         <div className="text-center">
//           <CheckCircle className="w-24 h-24 mx-auto text-green-500 mb-4"/>
//           <h2 className="text-3xl font-bold mb-2">{t.registrationSuccess}</h2>
//           <p className="text-xl mb-6">{t.yourPatientId}: <strong>{patient.id}</strong></p>
//           <button onClick={onNext} className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold">{t.next}</button>
//         </div>
//       );
//   }
//   return (
//     <div className="text-center">
//       <CheckCircle className="w-24 h-24 mx-auto text-blue-600 mb-4"/>
//       <h2 className="text-3xl font-bold mb-2">{t.checkInComplete}</h2>
//       <p className="text-gray-600 mb-8">{t.thankYou}, {patient.first_name || patient.name || ""}!</p>
//       {appointment && appointment.date && (
//           <div className="bg-gray-50 p-6 rounded-lg max-w-md mx-auto mb-8 text-left">
//               <h3 className="font-bold mb-2">{t.appointmentDetails}</h3>
//               <p>{appointment.date} at {appointment.time}</p>
//               <p>{appointment.physician} - {appointment.department}</p>
//           </div>
//       )}
//       <button onClick={onReset} className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold">{t.finish}</button>
//     </div>
//   );
// }
import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function StepComplete({
  t,
  patient,
  appointment,
  isRegSuccess,
  onNext,
  onReset,
}) {
  // ----------------------------
  // CASE 1 — Registration complete
  // ----------------------------
  if (isRegSuccess) {
    return (
      <div className="text-center">
        <CheckCircle className="w-24 h-24 mx-auto text-green-500 mb-4" />
        <h2 className="text-3xl font-bold mb-2">{t.registrationSuccess}</h2>
        <p className="text-xl mb-6">
          {t.yourPatientId}: <strong>{patient.id}</strong>
        </p>
        <button
          onClick={onNext}
          className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold"
        >
          {t.next}
        </button>
      </div>
    );
  }

  // ------------------------------------------------------
  // CASE 2 — After forms (either check-in today OR booking)
  // ------------------------------------------------------

  // Determine if appointment exists
  const hasAppointment = appointment && appointment.date;

  // Determine if today or future
  let isToday = false;
  let isFuture = false;

  if (hasAppointment) {
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const apptDate = appointment.date;

    if (apptDate === todayStr) {
      isToday = true;
    } else if (apptDate > todayStr) {
      isFuture = true;
    }
  }

  // ----- Define Label -----
  let appointmentLabel = null;

  if (isToday) {
    appointmentLabel = t.todayAppointmentLabel ?? 'Today Appointment Detail';
  } else if (isFuture) {
    appointmentLabel = t.upcomingAppointmentLabel ?? 'Upcoming Appointment';
  }
  const first =
    patient?.first_name ||
    patient?.firstName ||
    patient?.name ||
    "";

  const last =
    patient?.last_name ||
    patient?.lastName ||
    "";
  return (
    <div className="text-center">
      {/* Complete Icon */}
      <CheckCircle className="w-24 h-24 mx-auto text-blue-600 mb-4" />

      {/* Main Message */}

      <h2 className="text-3xl font-bold mb-2">{t.checkInComplete}</h2>
      <p className="text-gray-600 mb-8">
        {t.thankYou}, {first} {last}!!
      </p>

      {/* Appointment Details (if any) */}
      {hasAppointment && appointmentLabel && (
        <div className="bg-blue-50 p-6 rounded-lg max-w-md mx-auto mb-8 text-left shadow">
          <h3 className="font-bold mb-3 text-lg">{appointmentLabel}</h3>

          <p>
            <strong>{t.date}:</strong> {appointment.date}
          </p>
          <p>
            <strong>{t.time}:</strong> {appointment.time}
          </p>
          <p>
            <strong>{t.physician}:</strong> {appointment.physician}
          </p>
          <p>
            <strong>{t.department}:</strong> {appointment.department}
          </p>

          {appointment.room_number && (
            <p>
              <strong>{t.room}:</strong> {appointment.room_number}
            </p>
          )}
        </div>
      )}

      {/* Finish Button */}
      <button
        onClick={onReset}
        className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
      >
        {t.finish}
      </button>
    </div>
  );
}
