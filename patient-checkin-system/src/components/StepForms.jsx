import React, { useState, useRef } from 'react';
import { FileText, X } from 'lucide-react';

export default function StepForms({ t, forms, onComplete }) {
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [hasSignature, setHasSignature] = useState(false);
  const signatureRef = useRef(null);
  const isDrawing = useRef(false);

  const getCoords = (e) => {
    const rect = signatureRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const ctx = signatureRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const ctx = signatureRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clear = () => {
    const ctx = signatureRef.current.getContext('2d');
    ctx.clearRect(0, 0, 600, 150);
    setHasSignature(false);
  };

  const handleSubmit = () => {
    if (currentFormIndex < forms.length - 1) {
      setCurrentFormIndex(prev => prev + 1);
      clear();
    } else {
      onComplete();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{t.pendingForms}</h2>

      <div className="bg-gray-50 p-6 rounded-lg mb-6 border-2">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <FileText className="text-red-500" />
          {forms[currentFormIndex]} ({currentFormIndex + 1}/{forms.length})
        </h3>

        <div className="bg-white p-4 border h-48 overflow-y-auto mb-4 text-sm text-gray-600">
          [Placeholder legal text for {forms[currentFormIndex]}...]
        </div>

        <label className="block font-medium mb-2">{t.signature}</label>
        <p className="text-xs text-gray-500 mb-1">{t.signHere}</p>

        <canvas
          ref={signatureRef}
          width={600}
          height={150}
          className="border rounded w-full bg-white cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        <button
          onClick={clear}
          className="mt-2 text-sm text-red-500 flex items-center gap-1"
        >
          <X className="w-4 h-4" /> {t.clear}
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!hasSignature}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300"
      >
        {currentFormIndex < forms.length - 1 ? t.next : t.submit}
      </button>
    </div>
  );
}

//   // --- RESTORED: THE FORMS STEP ---
//   function StepForms({ t, forms, onComplete }) {
//     const [currentFormIndex, setCurrentFormIndex] = useState(0);
//     const [hasSignature, setHasSignature] = useState(false);
//     const signatureRef = useRef(null);
//     const isDrawing = useRef(false);

//     const getCoords = (e) => {
//       const rect = signatureRef.current.getBoundingClientRect();
//       const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//       const clientY = e.touches ? e.touches[0].clientY : e.clientY;
//       return { x: clientX - rect.left, y: clientY - rect.top };
//     };
//     const startDrawing = (e) => { e.preventDefault(); isDrawing.current = true; const ctx = signatureRef.current.getContext('2d'); const { x, y } = getCoords(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineWidth = 2; };
//     const draw = (e) => { e.preventDefault(); if (!isDrawing.current) return; const ctx = signatureRef.current.getContext('2d'); const { x, y } = getCoords(e); ctx.lineTo(x, y); ctx.stroke(); setHasSignature(true); };
//     const stopDrawing = () => { isDrawing.current = false; };
//     const clear = () => { const ctx = signatureRef.current.getContext('2d'); ctx.clearRect(0, 0, 600, 150); setHasSignature(false); };
//     const handleSubmit = () => { if (currentFormIndex < forms.length - 1) { setCurrentFormIndex(prev => prev + 1); clear(); } else { onComplete(); } };

//     return (
//       <div className="max-w-3xl mx-auto">
//         <h2 className="text-2xl font-bold mb-6">{t.pendingForms}</h2>
//         <div className="bg-gray-50 p-6 rounded-lg mb-6 border-2">
//           <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText className="text-red-500"/>{forms[currentFormIndex]} ({currentFormIndex + 1}/{forms.length})</h3>
//           <div className="bg-white p-4 border h-48 overflow-y-auto mb-4 text-sm text-gray-600">[Placeholder legal text for {forms[currentFormIndex]}...]</div>
//           <label className="block font-medium mb-2">{t.signature}</label>
//           <p className="text-xs text-gray-500 mb-1">{t.signHere}</p>
//           <canvas ref={signatureRef} width={600} height={150} className="border rounded w-full bg-white cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
//           <button onClick={clear} className="mt-2 text-sm text-red-500 flex items-center gap-1"><X className="w-4 h-4" /> {t.clear}</button>
//         </div>
//         <button onClick={handleSubmit} disabled={!hasSignature} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300">{currentFormIndex < forms.length - 1 ? t.next : t.submit}</button>
//       </div>
//     );
//   }