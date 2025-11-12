import React, { useState } from 'react';
import { Lock } from 'lucide-react';

// IMPORT ALL COMPONENTS WITH EXPLICIT .jsx EXTENSIONS
import PatientCheckInKiosk from './PatientCheckInKiosk.jsx';
import AdminPortal from './AdminPortal.jsx';
import StaffLogin from './StaffLogin.jsx'; 

function App() {
  const [currentView, setCurrentView] = useState('kiosk');

  return (
    <div className="relative">
      {/* 1. KIOSK VIEW */}
      {currentView === 'kiosk' && (
        <>
          <PatientCheckInKiosk />
          <button 
            onClick={() => setCurrentView('login')}
            className="fixed bottom-5 right-5 z-50 p-4 bg-red-600 text-white rounded-full shadow-2xl hover:bg-red-700 transition-all"
            title="Staff Login"
          >
            <Lock size={24} />
          </button>
        </>
      )}

      {/* 2. LOGIN VIEW */}
      {currentView === 'login' && (
        <StaffLogin 
          onLoginSuccess={() => setCurrentView('admin')} 
          onBack={() => setCurrentView('kiosk')} 
        />
      )}

      {/* 3. ADMIN VIEW */}
      {currentView === 'admin' && (
        <AdminPortal onLogout={() => setCurrentView('kiosk')} />
      )}
    </div>
  );
}

export default App;