import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

export default function StaffLogin({ onLoginSuccess, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch("http://localhost:8000/api/v1/staff/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        onLoginSuccess();
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Cannot reach security server");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-blue-900 p-6 text-white flex items-center justify-between">
           <h2 className="text-xl font-bold flex items-center gap-2"><Shield/> Staff Portal</h2>
           <button onClick={onBack} className="text-blue-200 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft size={16}/> Kiosk</button>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600"/>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Authorized Access Only</h1>
            <p className="text-gray-500 mt-2">Please enter your credentials</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm"><AlertCircle size={16}/> {error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="e.g. admin" required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg transition duration-200 disabled:bg-gray-400">
            {loading ? 'Verifying...' : 'Secure Login'}
          </button>

          <p className="text-center text-gray-500 text-xs mt-6">
            Access is monitored and logged for HIPAA compliance.
          </p>
        </form>
      </div>
    </div>
  );
}