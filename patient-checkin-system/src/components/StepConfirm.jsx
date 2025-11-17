// import React from 'react';
// import { Check, Calendar, User, Clock, MapPin } from 'lucide-react';

// export default function StepConfirm({ t, patient, appointment, onNext }) {
  
//   console.log("🟦 StepConfirm received patient:", patient);
//   console.log("🟩 StepConfirm received appointment:", appointment);
//   console.log("🟥 StepConfirm rendering...");

//   return (
//     <div>
//       <h2 className="text-2xl font-bold mb-6">
//         {t.verificationSuccess}, {patient.first_name || patient.name}!
//       </h2>

//       {/* Patient Info */}
//       <div className="bg-blue-50 p-6 rounded-lg mb-4">
//         <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
//           <User className="w-5 h-5" /> {t.personalInfo}
//         </h3>
//         <p><strong>{t.patientId}:</strong> {patient.id}</p>
//         <p><strong>{t.dob}:</strong> {patient.dob}</p>
//         {patient.address && (
//           <p><strong>{t.address}:</strong> {patient.address}</p>
//         )}
//       </div>

//       {/* Appointment Information */}
//       {appointment && appointment.date && (
//         <div className="bg-green-50 p-6 rounded-lg mb-6">
//           <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
//             <Calendar className="w-5 h-5 text-green-600" />
//             {t.appointmentDetails}
//           </h3>

//           <p><strong>{t.date}:</strong> {appointment.date}</p>
//           <p><strong>{t.time}:</strong> {appointment.time}</p>
//           <p><strong>{t.physician}:</strong> {appointment.physician}</p>
//           <p><strong>{t.department}:</strong> {appointment.department}</p>
//         </div>
//       )}

//       {/* NEXT BUTTON */}
//       <button
//         onClick={onNext}
//         className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold flex justify-center gap-2"
//       >
//         <Check /> {t.next}
//       </button>
//     </div>
//   );
// }
import React from 'react';
import { Check, Calendar, User } from 'lucide-react';

export default function StepConfirm({
  t,
  patient,
  appointment,
  onCheckInToday,
  onBookNewAppointment,
}) {
  console.log("🟦 StepConfirm received patient:", patient);
  console.log("🟩 StepConfirm received appointment:", appointment);

  // ---- Determine appointment status (today / future / none) ----
  const hasAppointment = appointment && appointment.date;

  let isToday = false;
  // let isFuture = false;
  // isFuture = true;

  let appointmentLabel = '';

  if (hasAppointment) {
    // const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const todayStr = new Date().toLocaleDateString("en-CA"); 
    const apptDateStr = appointment.date;

    if (apptDateStr === todayStr) {
      isToday = true;
      appointmentLabel = t.todayAppointmentLabel ?? 'Today Appointment Detail';
    } else if (apptDateStr > todayStr) {
      // isFuture = true;
      appointmentLabel = t.upcomingAppointmentLabel ?? 'Upcoming Appointment';
    } else {
      // Past date or invalid; treat as generic appointment
      appointmentLabel = t.appointmentDetails ?? 'Appointment Details';
    }
  }

  const noAppointmentText =
    t.noAppointmentInfo ?? 'No appointment information.';

  const checkInTodayLabel =
    t.checkInToday ?? 'Check in for today';

  const bookNewApptLabel =
    t.bookNewAppointment ?? 'Book New Appointment';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Greeting */}
      <h2 className="text-2xl font-bold mb-6">
        {t.verificationSuccess}, {patient.first_name || patient.name || ''}!
      </h2>

      {/* Patient Info */}
      <div className="bg-blue-50 p-6 rounded-lg mb-4">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <User className="w-5 h-5" /> {t.personalInfo}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <p>
            <strong>{t.patientId}:</strong> {patient.id}
          </p>
          <p>
            <strong>{t.dob}:</strong> {patient.dob}
          </p>
          {patient.address && (
            <p className="sm:col-span-2">
              <strong>{t.address}:</strong> {patient.address}
            </p>
          )}
        </div>
      </div>

      {/* Appointment Section */}
      {hasAppointment ? (
        <>
          <div className="bg-green-50 p-6 rounded-lg mb-4">
            <h3 className="font-semibold text-lg mb-2">
              {appointmentLabel}
            </h3>

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
                <strong>{t.room || "Room"}:</strong> {appointment.room_number}
              </p>
            )}
          </div>

          {/* Buttons depending on today / future */}
          {isToday ? (
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={onCheckInToday}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold flex justify-center items-center gap-2 hover:bg-green-700 transition"
              >
                <Check className="w-4 h-4" />
                {checkInTodayLabel}
              </button>

              <button
                onClick={onBookNewAppointment}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold flex justify-center items-center gap-2 hover:bg-blue-700 transition"
              >
                <Calendar className="w-4 h-4" />
                {bookNewApptLabel}
              </button>
            </div>
          ) : (
            // Future appointment only → just show "Book New Appointment"
            <div className="mt-4">
              <button
                onClick={onBookNewAppointment}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold flex justify-center items-center gap-2 hover:bg-blue-700 transition"
              >
                <Calendar className="w-4 h-4" />
                {bookNewApptLabel}
              </button>
            </div>
          )}
        </>
      ) : (
        // No appointment at all
        <div className="mt-4">
          <p className="text-gray-600 mb-4">{noAppointmentText}</p>
          <button
            onClick={onBookNewAppointment}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold flex justify-center items-center gap-2 hover:bg-blue-700 transition"
          >
            <Calendar className="w-4 h-4" />
            {bookNewApptLabel}
          </button>
        </div>
      )}
    </div>
  );
}
