import React from 'react';
import { Loader2, Check } from 'lucide-react';

// --- NEW HELPER FUNCTIONS ---

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
};

// Helper to convert time strings ("9:00 AM", "1:00 PM") to a 24-hour number (9, 13)
const parseTimeSlot = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours] = time.split(':');
    hours = parseInt(hours, 10);
    if (modifier === 'PM' && hours !== 12) {
        hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
        hours = 0; // Midnight
    }
    return hours;
};

// --- COMPONENT ---

function StepAppointment({ t, data, setData, onSubmit, isProcessing, depts, docs, times }) {
  const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));
  const isValid = data.department && data.physician && data.date && data.time;

  // --- REAL-TIME LOGIC ---
  const today = getTodayString();
  const isToday = data.date === today;
  const currentHour = new Date().getHours(); // Get current hour (0-23)

  const availableTimeSlots = times.filter(slot => {
      // If the selected date is not today, all slots are available
      if (!isToday) {
          return true;
      }
      // If it is today, parse the slot time
      const slotHour = parseTimeSlot(slot);
      
      // Only show slots that are in the future
      // (e.g., if it's 10:30 AM (currentHour = 10), show 11:00 AM (slotHour = 11))
      return slotHour > currentHour;
  });
  // --- END REAL-TIME LOGIC ---

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{t.scheduleAppointment}</h2>
      <div className="space-y-4">
        <select className="w-full p-3 border-2 rounded-lg" value={data.department} onChange={e => handleChange('department', e.target.value)}>
          <option value="">{t.selectDepartment}</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        {data.department && (
            <select className="w-full p-3 border-2 rounded-lg" value={data.physician} onChange={e => handleChange('physician', e.target.value)}>
                <option value="">{t.selectPhysician}</option>
                {docs[data.department].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
        )}
        
        <div className="grid grid-cols-2 gap-4">
            <input 
                type="date" 
                className="p-3 border-2 rounded-lg w-full" 
                value={data.date} 
                onChange={e => handleChange('date', e.target.value)}
                min={today} // Prevent booking in the past
            />
            
            {/* UPDATED: This select now filters based on the date */}
            <select 
                className="p-3 border-2 rounded-lg w-full" 
                value={data.time} 
                onChange={e => handleChange('time', e.target.value)}
                disabled={!data.date} // Disable if date isn't selected
            >
                <option value="">{t.selectTime}</option>
                {availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map(time => <option key={time} value={time}>{time}</option>)
                ) : (
                    <option value="" disabled>{t.noSlotsToday}</option>
                )}
            </select>
        </div>
        
        <textarea className="w-full p-3 border-2 rounded-lg" rows="3" placeholder={t.reasonForVisit} value={data.reason} onChange={e => handleChange('reason', e.target.value)} />
        
        <button onClick={onSubmit} disabled={!isValid || isProcessing} className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 flex justify-center gap-2">
            {isProcessing ? <Loader2 className="animate-spin"/> : <Check/>} {t.bookAppointment}
        </button>
      </div>
    </div>
  );
}