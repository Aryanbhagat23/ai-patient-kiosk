// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { Camera, Check, Loader2, Home, User, CheckCircle, UserPlus, Video, Database, FileText, X, MapPin, Clock, UserCheck, AlertCircle } from 'lucide-react';

// // =========================================
// // 1. STATIC DATA & FULL TRANSLATIONS
// // =========================================

// const LANGUAGES = [
//   { code: 'en', name: 'English', flag: '🇺🇸' },
//   { code: 'es', name: 'Español', flag: '🇪🇸' },
//   { code: 'fr', name: 'Français', flag: '🇫🇷' },
//   { code: 'zh', name: '中文', flag: '🇨🇳' }
// ];

// const EN_TRANSLATIONS = {
//     welcome: 'Welcome', selectLanguage: 'Select your language', autoScanning: 'Scanning Face...',
//     lookAtCamera: 'Look at camera', analyzingFace: 'Analyzing...', capturingImage: 'Capturing...',
//     verificationSuccess: 'Welcome Back', newPatient: 'New Patient', registerNewPatient: 'Register New Patient',
//     firstName: 'First Name', lastName: 'Last Name', dateOfBirth: 'Date of Birth', address: 'Address',
//     phone: 'Phone', email: 'Email', insuranceProvider: 'Insurance Provider', policyNumber: 'Policy Number',
//     groupNumber: 'Group Number', registerAndSave: 'Register & Save', savingToDb: 'Saving...',
//     registrationSuccess: 'Registration Successful!', yourPatientId: 'Your Patient ID', faceStored: 'Biometrics secure',
//     scheduleAppointment: 'Schedule Appointment', selectDepartment: 'Select Department', selectPhysician: 'Select Physician',
//     selectDate: 'Select Date', selectTime: 'Select Time', reasonForVisit: 'Reason for Visit',
//     bookAppointment: 'Book Appointment', pendingForms: 'Required Forms', signature: 'Signature',
//     signHere: 'Sign here', clear: 'Clear', submit: 'Submit', next: 'Next',
//     checkInComplete: 'Check-in Complete!', thankYou: 'Thank you', finish: 'Finish',
//     step: 'Step', of: 'of', patientsInDb: 'Patients', appointmentsInDb: 'Appointments',
//     personalInfo: 'Personal Information', insuranceInfo: 'Insurance Information',
//     appointmentDetails: 'Appointment Details', patientId: 'Patient ID', name: 'Name', dob: 'DOB',
//     provider: 'Provider', policy: 'Policy', group: 'Group', date: 'Date', time: 'Time',
//     physician: 'Physician', department: 'Department', cameraUnavailable: 'Camera unavailable. Proceeding with simulation.',
//     checkedIn: 'Checked In!', pleaseProceed: 'Please proceed to:', room: 'Room',
//     errPhone: 'Digits only (10-15)', errEmail: 'Invalid email format', errReq: 'Required field'
// };

// const TRANSLATIONS = {
//   en: EN_TRANSLATIONS,
//   es: { ...EN_TRANSLATIONS, welcome: 'Bienvenido', selectLanguage: 'Seleccione idioma', autoScanning: 'Escaneando...', lookAtCamera: 'Mire a la cámara', analyzingFace: 'Analizando...', newPatient: 'Nuevo Paciente', registerNewPatient: 'Registrar Paciente', firstName: 'Nombre', lastName: 'Apellido', next: 'Siguiente', savingToDb: 'Guardando...', verificationSuccess: '¡Bienvenido de Nuevo!', dateOfBirth: 'Fecha de Nacimiento', address: 'Dirección', phone: 'Teléfono', email: 'Correo', insuranceProvider: 'Seguro', policyNumber: 'Póliza', groupNumber: 'Grupo', registerAndSave: 'Registrar', registrationSuccess: '¡Exito!', yourPatientId: 'Su ID', scheduleAppointment: 'Programar Cita', selectDepartment: 'Departamento', selectPhysician: 'Médico', selectDate: 'Fecha', selectTime: 'Hora', reasonForVisit: 'Motivo', bookAppointment: 'Reservar', pendingForms: 'Formularios', signature: 'Firma', signHere: 'Firme aquí', clear: 'Borrar', submit: 'Enviar', checkInComplete: 'Completo', thankYou: 'Gracias', checkedIn: '¡Registrado!', pleaseProceed: 'Diríjase a:', room: 'Sala', errPhone: 'Solo dígitos.', errEmail: 'Email inválido.', errReq: 'Requerido.' },
//   fr: { ...EN_TRANSLATIONS, welcome: 'Bienvenue', selectLanguage: 'Choisir langue', autoScanning: 'Scan...', lookAtCamera: 'Regardez caméra', analyzingFace: 'Analyse...', newPatient: 'Nouveau', registerNewPatient: 'Inscrire', firstName: 'Prénom', lastName: 'Nom', next: 'Suivant', savingToDb: 'Sauvegarde...', verificationSuccess: 'Bienvenue!', dateOfBirth: 'Naissance', address: 'Adresse', phone: 'Tél', email: 'Email', insuranceProvider: 'Assurance', policyNumber: 'Police', groupNumber: 'Groupe', registerAndSave: 'Enregistrer', registrationSuccess: 'Succès!', yourPatientId: 'Votre ID', scheduleAppointment: 'Rendez-vous', selectDepartment: 'Département', selectPhysician: 'Médecin', selectDate: 'Date', selectTime: 'Heure', reasonForVisit: 'Motif', bookAppointment: 'Réserver', pendingForms: 'Formulaires', signature: 'Signature', signHere: 'Signez ici', clear: 'Effacer', submit: 'Soumettre', checkInComplete: 'Terminé', thankYou: 'Merci', checkedIn: 'Enregistré!', pleaseProceed: 'Allez à:', room: 'Salle', errPhone: 'Chiffres seulement.', errEmail: 'Email invalide.', errReq: 'Requis.' },
//   zh: { ...EN_TRANSLATIONS, welcome: '欢迎', selectLanguage: '选择语言', autoScanning: '扫描中...', lookAtCamera: '看摄像头', analyzingFace: '分析中...', newPatient: '新患者', registerNewPatient: '注册', firstName: '名字', lastName: '姓氏', next: '下一步', savingToDb: '保存中...', verificationSuccess: '欢迎回来!', dateOfBirth: '生日', address: '地址', phone: '电话', email: '邮件', insuranceProvider: '保险', policyNumber: '保单号', groupNumber: '组号', registerAndSave: '保存', registrationSuccess: '成功!', yourPatientId: '您的ID', scheduleAppointment: '预约', selectDepartment: '科室', selectPhysician: '医生', selectDate: '日期', selectTime: '时间', reasonForVisit: '原因', bookAppointment: '预约', pendingForms: '表格', signature: '签名', signHere: '在此签名', clear: '清除', submit: '提交', checkInComplete: '完成', thankYou: '谢谢', checkedIn: '已报到!', pleaseProceed: '请前往:', room: '房间', errPhone: '仅限数字', errEmail: '无效邮件', errReq: '必填' }
// };

// const DEPARTMENTS = ['Internal Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Neurology'];
// const PHYSICIANS = {
//   'Internal Medicine': ['Dr. Michael Chen', 'Dr. Sarah Williams'],
//   'Cardiology': ['Dr. Emily Rodriguez', 'Dr. James Anderson'],
//   'Pediatrics': ['Dr. Lisa Brown', 'Dr. David Martinez'],
//   'Orthopedics': ['Dr. Robert Taylor', 'Dr. Jennifer Lee'],
//   'Dermatology': ['Dr. Maria Garcia', 'Dr. John White'],
//   'Neurology': ['Dr. Amanda Johnson', 'Dr. Christopher Davis']
// };
// const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
// const REQUIRED_FORMS = ['Medical History Questionnaire', 'HIPAA Privacy Consent', 'Treatment Consent Form'];

// // =========================================
// // 2. MAIN COMPONENT
// // =========================================

// export default function PatientCheckInKiosk() {
//   const [currentStep, setCurrentStep] = useState('language');
//   const [language, setLanguage] = useState('en');
//   const [patient, setPatient] = useState(null);
//   const [routing, setRouting] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isCameraReady, setIsCameraReady] = useState(false);
//   const [scanStatus, setScanStatus] = useState('');
//   const [newPatientData, setNewPatientData] = useState({ firstName: '', lastName: '', dob: '', address: '', phone: '', email: '', insurance: { provider: '', policy: '', group: '' } });
//   const [appointment, setAppointment] = useState({ department: '', physician: '', date: '', time: '', reason: '' });
//   const [capturedFaceImage, setCapturedFaceImage] = useState(null);
//   const [dbStats, setDbStats] = useState({ patients: 0, appointments: 0 });

//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const streamRef = useRef(null);
//   const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

//   // STATS POLLER
//   useEffect(() => {
//       const fetchStats = async () => {
//           try {
//               const [p, a] = await Promise.all([
//                   fetch("http://localhost:8000/api/v1/patients").then(r=>r.json()),
//                   fetch("http://localhost:8000/api/v1/appointments").then(r=>r.json())
//               ]);
//               setDbStats({ patients: Array.isArray(p)?p.length:0, appointments: Array.isArray(a)?a.length:0 });
//           } catch(e) {}
//       };
//       fetchStats(); const i = setInterval(fetchStats, 5000); return () => clearInterval(i);
//   }, []);

//   // AI HANDLER
//   const handleAIScan = useCallback(async (faceImageData, forceSimulation = false) => {
//     setIsProcessing(true);
//     setScanStatus(t.analyzingFace);
//     if (faceImageData) setCapturedFaceImage(faceImageData);
//     await new Promise(resolve => setTimeout(resolve, 1500));

//     let matchedPatient = null;
//     try {
//         if (!forceSimulation) {
//             const res = await fetch("http://localhost:8000/api/v1/face/identify", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_data: faceImageData }) });
//             const data = await res.json();
//             if (data.status === 'match' && data.patient_id) {
//                 const all = await (await fetch("http://localhost:8000/api/v1/patients")).json();
//                 matchedPatient = all.find(p => p.id === data.patient_id);
//                 if (data.routing) setRouting(data.routing);
//             }
//         }
//     } catch (error) { console.warn("API unreachable."); }

//     // if (matchedPatient) {
//     //     setPatient(matchedPatient);
//     //     setScanStatus(t.verificationSuccess);
//     //     await new Promise(r => setTimeout(r, 1500));
//     //     setCurrentStep(routing ? 'routing' : 'confirm');
//     // } 
//     if (matchedPatient) {
//     // Normalize patient fields if needed
//     // setPatient(matchedPatient);


//     setPatient({
//     ...matchedPatient,
//     first_name: matchedPatient.first_name || matchedPatient.firstName || matchedPatient.name?.split(" ")[0] || "",
//     last_name: matchedPatient.last_name || matchedPatient.lastName || matchedPatient.name?.split(" ")[1] || "",
//     dob: matchedPatient.dob || matchedPatient.birth_date || matchedPatient.date_of_birth || "",
//     address: matchedPatient.address || matchedPatient.home_address || matchedPatient.address_line1 || ""
//     });


//     // ===============================
//     // 🔥 FETCH NEXT UPCOMING APPOINTMENT
//     // ===============================
//     try {
//         const apptRes = await fetch(
//             `http://localhost:8000/api/v1/appointments/upcoming?patient_id=${matchedPatient.id}`
//         );
//         const apptData = await apptRes.json();

//         console.log("Upcoming appointment:", apptData);

//         if (apptData && apptData.date) {
//             setAppointment(apptData);
//         } else {
//             setAppointment(null);
//         }
//     } catch (e) {
//         console.error("Failed fetching appointment", e);
//         setAppointment(null);
//     }

//     // Continue
//     setScanStatus(t.verificationSuccess);
//     await new Promise(r => setTimeout(r, 1500));
//     setCurrentStep(routing ? 'routing' : 'confirm');
//     }
//     else {
//         setScanStatus(t.newPatient);
//         await new Promise(r => setTimeout(r, 1500));
//         setCurrentStep('register');
//     }
//     setIsProcessing(false);
//   }, [t, routing]);

//   // CAMERA LOGIC
//   const startCamera = useCallback(async () => {
//     try {
//       setScanStatus(t.autoScanning);
//       const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
//       if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; videoRef.current.onloadedmetadata = () => { videoRef.current.play(); setIsCameraReady(true); setScanStatus(t.lookAtCamera); }; }
//     } catch (error) { setScanStatus(t.cameraUnavailable); setTimeout(() => handleAIScan(null, true), 2000); }
//   }, [t, handleAIScan]);

//   const stopCamera = useCallback(() => {
//     if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
//     if (videoRef.current) videoRef.current.srcObject = null;
//     setIsCameraReady(false);
//   }, []);

//   useEffect(() => {
//     if (currentStep === 'facial') startCamera(); else stopCamera();
//     return () => stopCamera();
//   }, [currentStep, startCamera, stopCamera]);

//   // ACTION HANDLERS
//   const handleRegister = async () => {
//     setIsProcessing(true); setScanStatus(t.savingToDb);
//     try {
//         const res = await fetch("http://localhost:8000/api/v1/patient/register", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newPatientData, faceImage: capturedFaceImage }) });
//         const data = await res.json();
//         setPatient({ id: data.patient_id, ...newPatientData });
//         await new Promise(r => setTimeout(r, 1500));
//         setCurrentStep('registrationSuccess');
//     } catch (e) { alert("Registration Failed"); }
//     setIsProcessing(false);
//   };

//   const handleBooking = async () => {
//     setIsProcessing(true);
//     try {
//         await fetch("http://localhost:8000/api/v1/appointment/book", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: patient.id, ...appointment }) });
//     } catch (error) { console.error("Booking Error"); }
//     await new Promise(r => setTimeout(r, 1500));
//     setIsProcessing(false);
//     // RESTORED: Go to forms instead of complete
//     setCurrentStep('forms');
//   };

//   const resetKiosk = () => {
//     setCurrentStep('language'); setPatient(null); setRouting(null);
//     setAppointment({ department: '', physician: '', date: '', time: '', reason: '' });
//     setNewPatientData({ firstName: '', lastName: '', dob: '', address: '', phone: '', email: '', insurance: { provider: '', policy: '', group: '' } });
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
//       <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
//         <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
//           <div className="flex items-center gap-3"><Home className="w-8 h-8" /><div><h1 className="text-2xl font-bold">Springfield Medical</h1><p className="text-sm flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/> AI Face Recognition</p></div></div>
//           <div className="text-right text-sm flex flex-col gap-1"><div className="flex items-center gap-2 justify-end"><Database className="w-4 h-4" /> {dbStats.patients} {t.patientsInDb}</div><div className="flex items-center gap-2 justify-end"><FileText className="w-4 h-4" /> {dbStats.appointments} {t.appointmentsInDb}</div></div>
//         </div>
//         <div className="p-8 min-h-[500px]">
//           {currentStep === 'language' && <StepLanguage t={t} setLanguage={setLanguage} setCurrentStep={setCurrentStep} LANGUAGES={LANGUAGES} />}
//           {currentStep === 'facial' && <StepFacial t={t} isProcessing={isProcessing} scanStatus={scanStatus} isCameraReady={isCameraReady} videoRef={videoRef} canvasRef={canvasRef} handleAIScan={handleAIScan} />}
//           {currentStep === 'register' && <StepRegister t={t} data={newPatientData} setData={setNewPatientData} onSubmit={handleRegister} isProcessing={isProcessing} faceImage={capturedFaceImage} />}
//           {currentStep === 'registrationSuccess' && <StepComplete t={t} patient={patient} isRegSuccess={true} onNext={() => setCurrentStep('appointment')} />}
//           {currentStep === 'confirm' &&
//           <StepConfirm
//               t={t}
//               patient={patient}
//               appointment={appointment}   // <-- add this
//               onNext={() => {
//                             if (appointment && appointment.date) {
//                                 setCurrentStep('forms'); 
//                             } else {
//                                 setCurrentStep('appointment');
//                             }
//                           }}
//           />}
//           {currentStep === 'appointment' && <StepAppointment t={t} data={appointment} setData={setAppointment} onSubmit={handleBooking} isProcessing={isProcessing} depts={DEPARTMENTS} docs={PHYSICIANS} times={TIME_SLOTS} />}
//           {/* RESTORED: StepForms is back in the render loop */}
//           {currentStep === 'forms' && <StepForms t={t} forms={REQUIRED_FORMS} onComplete={() => setCurrentStep('complete')} />}
//           {currentStep === 'complete' && <StepComplete t={t} patient={patient} appointment={appointment} onReset={resetKiosk} />}
//           {currentStep === 'routing' && <StepRouting t={t} patient={patient} routing={routing} onReset={resetKiosk} />}
//         </div>
//       </div>
//     </div>
//   );
// }

// // =========================================
// // 3. SUB-COMPONENTS
// // =========================================

// function StepLanguage({ t, setLanguage, setCurrentStep, LANGUAGES }) {
//   return (
//     <div className="text-center">
//       <h2 className="text-3xl font-bold mb-3">{t.welcome}</h2>
//       <p className="text-gray-600 mb-8">{t.selectLanguage}</p>
//       <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
//         {LANGUAGES.map(lang => (
//           <button key={lang.code} onClick={() => { setLanguage(lang.code); setCurrentStep('facial'); }} className="p-6 border-2 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all"><div className="text-4xl mb-2">{lang.flag}</div><div className="text-lg font-semibold">{lang.name}</div></button>
//         ))}
//       </div>
//     </div>
//   );
// }

// function StepFacial({ t, isProcessing, scanStatus, isCameraReady, videoRef, canvasRef, handleAIScan }) {
//   useEffect(() => {
//     let timer;
//     if (isCameraReady && !isProcessing) {
//        timer = setTimeout(() => {
//          if (canvasRef.current && videoRef.current) {
//             const ctx = canvasRef.current.getContext('2d');
//             canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
//             ctx.drawImage(videoRef.current, 0, 0);
//             handleAIScan(canvasRef.current.toDataURL('image/jpeg', 0.8));
//          }
//        }, 2000);
//     }
//     return () => clearTimeout(timer);
//   }, [isCameraReady, isProcessing, canvasRef, videoRef, handleAIScan]);

//   return (
//     <div className="text-center">
//       <Video className="w-20 h-20 mx-auto mb-6 text-blue-600 animate-pulse" />
//       <h2 className="text-2xl font-bold mb-3">AI Face Recognition</h2>
//       <p className="text-gray-600 mb-6">{t.lookAtCamera}</p>
//       <div className="relative mx-auto rounded-lg overflow-hidden shadow-2xl max-w-2xl">
//         <video ref={videoRef} autoPlay playsInline muted className="w-full bg-black" style={{ transform: 'scaleX(-1)' }} />
//         <canvas ref={canvasRef} className="hidden" />
//         <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="border-4 border-blue-500/50 w-1/2 h-2/3 rounded-xl"></div></div>
//         {isProcessing && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white"><Loader2 className="w-12 h-12 animate-spin mb-4" />{scanStatus}</div>}
//       </div>
//       <div className="mt-6 text-blue-600 font-semibold">{scanStatus}</div>
//     </div>
//   );
// }

// function StepRegister({ t, data, setData, onSubmit, isProcessing, faceImage }) {
//   const [errors, setErrors] = useState({});

//   const validate = () => {
//       const newErrors = {};
//       if (!data.firstName.trim()) newErrors.firstName = t.errReq;
//       if (!data.lastName.trim()) newErrors.lastName = t.errReq;
//       if (!data.dob) newErrors.dob = t.errReq;
//       if (!data.address.trim()) newErrors.address = t.errReq;
//       if (!/^\d{10,15}$/.test(data.phone.replace(/\D/g,''))) newErrors.phone = t.errPhone;
//       if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = t.errEmail;
//       if (!data.insurance.provider.trim()) newErrors.provider = t.errReq;
//       if (!data.insurance.policy.trim()) newErrors.policy = t.errReq;
//       if (!data.insurance.group.trim()) newErrors.group = t.errReq;
//       setErrors(newErrors);
//       return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = () => { if (validate()) onSubmit(); };
//   const handleChange = (f, v) => { setData(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(p => ({ ...p, [f]: null })); };
//   const handleIns = (f, v) => { setData(p => ({ ...p, insurance: { ...p.insurance, [f]: v } })); if (errors[f]) setErrors(p => ({ ...p, [f]: null })); };
//   const Err = ({ f }) => errors[f] ? <div className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle size={12}/> {errors[f]}</div> : null;

//   return (
//     <div className="max-w-2xl mx-auto">
//       <div className="text-center mb-6"><UserPlus className="w-16 h-16 mx-auto text-green-600 mb-2"/><h2 className="text-2xl font-bold">{t.registerNewPatient}</h2>{faceImage && <img src={faceImage} alt="Face" className="w-24 h-24 rounded-full mx-auto border-4 border-green-500 mt-4" />}</div>
//       <div className="space-y-4">
//         <div className="grid grid-cols-2 gap-4">
//           <div><input className={`p-3 border-2 rounded-lg w-full ${errors.firstName?'border-red-500 bg-red-50':''}`} placeholder={t.firstName} value={data.firstName} onChange={e => handleChange('firstName', e.target.value)} /><Err f="firstName"/></div>
//           <div><input className={`p-3 border-2 rounded-lg w-full ${errors.lastName?'border-red-500 bg-red-50':''}`} placeholder={t.lastName} value={data.lastName} onChange={e => handleChange('lastName', e.target.value)} /><Err f="lastName"/></div>
//         </div>
//         <div><input type="date" className={`w-full p-3 border-2 rounded-lg ${errors.dob?'border-red-500 bg-red-50':''}`} value={data.dob} onChange={e => handleChange('dob', e.target.value)} /><Err f="dob"/></div>
//         <div><input className={`w-full p-3 border-2 rounded-lg ${errors.address?'border-red-500 bg-red-50':''}`} placeholder={t.address} value={data.address} onChange={e => handleChange('address', e.target.value)} /><Err f="address"/></div>
//         <div className="grid grid-cols-2 gap-4">
//           <div><input className={`p-3 border-2 rounded-lg w-full ${errors.phone?'border-red-500 bg-red-50':''}`} placeholder={t.phone} value={data.phone} onChange={e => handleChange('phone', e.target.value)} /><Err f="phone"/></div>
//           <div><input className={`p-3 border-2 rounded-lg w-full ${errors.email?'border-red-500 bg-red-50':''}`} placeholder={t.email} value={data.email} onChange={e => handleChange('email', e.target.value)} /><Err f="email"/></div>
//         </div>
//         <div className="border-t pt-4 mt-4">
//             <h3 className="font-semibold mb-2">{t.insuranceInfo}</h3>
//             <div><input className={`w-full p-3 border-2 rounded-lg mb-2 ${errors.provider?'border-red-500 bg-red-50':''}`} placeholder={t.insuranceProvider} value={data.insurance.provider} onChange={e => handleIns('provider', e.target.value)} /><Err f="provider"/></div>
//             <div className="grid grid-cols-2 gap-4">
//               <div><input className={`w-full p-3 border-2 rounded-lg ${errors.policy?'border-red-500 bg-red-50':''}`} placeholder={t.policyNumber} value={data.insurance.policy} onChange={e => handleIns('policy', e.target.value)} /><Err f="policy"/></div>
//               <div><input className={`w-full p-3 border-2 rounded-lg ${errors.group?'border-red-500 bg-red-50':''}`} placeholder={t.groupNumber} value={data.insurance.group} onChange={e => handleIns('group', e.target.value)} /><Err f="group"/></div>
//             </div>
//         </div>
//         <button onClick={handleSubmit} disabled={isProcessing} className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-300 flex justify-center gap-2">{isProcessing ? <Loader2 className="animate-spin"/> : <CheckCircle/>} {t.registerAndSave}</button>
//       </div>
//     </div>
//   );
// }

// function StepConfirm({ t, patient, appointment, onNext }) {
//   console.log("🟩 StepConfirm received appointment:", appointment);

//   return (
//     <div className="max-w-2xl mx-auto">
//       <h2 className="text-2xl font-bold mb-6">{t.verificationSuccess}, {patient.first_name}!</h2>

//       <div className="bg-blue-50 p-6 rounded-lg mb-4">
//         <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
//           <User className="w-5 h-5"/> {t.personalInfo}
//         </h3>

//         <div className="grid grid-cols-2 gap-2 text-sm">
//           <p><strong>{t.patientId}:</strong> {patient.id}</p>
//           <p><strong>{t.dob}:</strong> {patient.dob}</p>
//           <p className="col-span-2"><strong>{t.address}:</strong> {patient.address}</p>
//         </div>
//       </div>

//       {appointment && appointment.date && (
//         <div className="bg-green-50 p-6 rounded-lg mb-4">
//           <h3 className="font-semibold text-lg mb-2">Appointment Details</h3>
//           <p><strong>Date:</strong> {appointment.date}</p>
//           <p><strong>Time:</strong> {appointment.time}</p>
//           <p><strong>Physician:</strong> {appointment.physician}</p>
//           <p><strong>Department:</strong> {appointment.department}</p>
//           {appointment.room && (
//             <p><strong>Room:</strong> {appointment.room}</p>
//           )}
//         </div>
//       )}

//       <button 
//         onClick={onNext} 
//         className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold flex justify-center gap-2"
//       >
//         <Check/> {t.next}
//       </button>
//     </div>
//   );
// }


// function StepAppointment({ t, data, setData, onSubmit, isProcessing, depts, docs, times }) {
//   const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));
//   const isValid = data.department && data.physician && data.date && data.time;
//   return (
//     <div className="max-w-2xl mx-auto">
//       <h2 className="text-2xl font-bold mb-6">{t.scheduleAppointment}</h2>
//       <div className="space-y-4">
//         <select className="w-full p-3 border-2 rounded-lg" value={data.department} onChange={e => handleChange('department', e.target.value)}><option value="">{t.selectDepartment}</option>{depts.map(d => <option key={d} value={d}>{d}</option>)}</select>
//         {data.department && <select className="w-full p-3 border-2 rounded-lg" value={data.physician} onChange={e => handleChange('physician', e.target.value)}><option value="">{t.selectPhysician}</option>{docs[data.department].map(d => <option key={d} value={d}>{d}</option>)}</select>}
//         <div className="grid grid-cols-2 gap-4">
//             <input type="date" className="p-3 border-2 rounded-lg w-full" value={data.date} onChange={e => handleChange('date', e.target.value)} />
//             <select className="p-3 border-2 rounded-lg w-full" value={data.time} onChange={e => handleChange('time', e.target.value)}><option value="">{t.selectTime}</option>{times.map(time => <option key={time} value={time}>{time}</option>)}</select>
//         </div>
//         <textarea className="w-full p-3 border-2 rounded-lg" rows="3" placeholder={t.reasonForVisit} value={data.reason} onChange={e => handleChange('reason', e.target.value)} />
//         <button onClick={onSubmit} disabled={!isValid || isProcessing} className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 flex justify-center gap-2">{isProcessing ? <Loader2 className="animate-spin"/> : <Check/>} {t.bookAppointment}</button>
//       </div>
//     </div>
//   );
// }

// // --- RESTORED: THE FORMS STEP ---
// function StepForms({ t, forms, onComplete }) {
//   const [currentFormIndex, setCurrentFormIndex] = useState(0);
//   const [hasSignature, setHasSignature] = useState(false);
//   const signatureRef = useRef(null);
//   const isDrawing = useRef(false);

//   const getCoords = (e) => {
//     const rect = signatureRef.current.getBoundingClientRect();
//     const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//     const clientY = e.touches ? e.touches[0].clientY : e.clientY;
//     return { x: clientX - rect.left, y: clientY - rect.top };
//   };
//   const startDrawing = (e) => { e.preventDefault(); isDrawing.current = true; const ctx = signatureRef.current.getContext('2d'); const { x, y } = getCoords(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineWidth = 2; };
//   const draw = (e) => { e.preventDefault(); if (!isDrawing.current) return; const ctx = signatureRef.current.getContext('2d'); const { x, y } = getCoords(e); ctx.lineTo(x, y); ctx.stroke(); setHasSignature(true); };
//   const stopDrawing = () => { isDrawing.current = false; };
//   const clear = () => { const ctx = signatureRef.current.getContext('2d'); ctx.clearRect(0, 0, 600, 150); setHasSignature(false); };
//   const handleSubmit = () => { if (currentFormIndex < forms.length - 1) { setCurrentFormIndex(prev => prev + 1); clear(); } else { onComplete(); } };

//   return (
//     <div className="max-w-3xl mx-auto">
//       <h2 className="text-2xl font-bold mb-6">{t.pendingForms}</h2>
//       <div className="bg-gray-50 p-6 rounded-lg mb-6 border-2">
//         <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText className="text-red-500"/>{forms[currentFormIndex]} ({currentFormIndex + 1}/{forms.length})</h3>
//         <div className="bg-white p-4 border h-48 overflow-y-auto mb-4 text-sm text-gray-600">[Placeholder legal text for {forms[currentFormIndex]}...]</div>
//         <label className="block font-medium mb-2">{t.signature}</label>
//         <p className="text-xs text-gray-500 mb-1">{t.signHere}</p>
//         <canvas ref={signatureRef} width={600} height={150} className="border rounded w-full bg-white cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
//         <button onClick={clear} className="mt-2 text-sm text-red-500 flex items-center gap-1"><X className="w-4 h-4" /> {t.clear}</button>
//       </div>
//       <button onClick={handleSubmit} disabled={!hasSignature} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300">{currentFormIndex < forms.length - 1 ? t.next : t.submit}</button>
//     </div>
//   );
// }

// function StepComplete({ t, patient, appointment, isRegSuccess, onNext, onReset }) {
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
//       <p className="text-gray-600 mb-8">{t.thankYou}, {patient.first_name}!</p>
//       {appointment && appointment.date && (
//           <div className="bg-blue-50 p-6 rounded-lg max-w-md mx-auto mb-8 text-left">
//               <h3 className="font-bold mb-3 text-lg">{t.appointmentDetails}</h3>
//               <p><strong>{t.date}:</strong> {appointment.date}</p>
//               <p><strong>{t.time}:</strong> {appointment.time}</p>
//               <p><strong>{t.physician}:</strong> {appointment.physician}</p>
//               <p><strong>{t.department}:</strong> {appointment.department}</p>
//           </div>
//       )}
//       <button onClick={onReset} className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold">{t.finish}</button>
//     </div>
//   );
// }

// function StepRouting({ t, patient, routing, onReset }) {
//     return (
//          <div className="text-center space-y-6">
//              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto"><UserCheck className="w-10 h-10 text-green-600" /></div>
//              <h2 className="text-3xl font-bold text-gray-800">{t.checkedIn}</h2>
//              <p className="text-xl text-gray-600">{t.welcome}, <strong>{patient.first_name}</strong>.</p>
//              <div className="bg-blue-50 p-8 rounded-2xl border-2 border-blue-200 max-w-md mx-auto animate-pulse">
//                  <h3 className="text-lg font-semibold text-blue-800 mb-4">{t.pleaseProceed}</h3>
//                  <div className="flex items-center justify-center gap-3 text-4xl font-bold text-blue-900 mb-2"><MapPin className="w-10 h-10"/> {routing.room}</div>
//                  <p className="text-blue-700">{routing.department}</p>
//                  <div className="flex items-center justify-center gap-2 mt-4 text-blue-600"><Clock className="w-5 h-5"/> {routing.time} with {routing.physician}</div>
//              </div>
//              <button onClick={onReset} className="mt-8 px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg">{t.finish}</button>
//          </div>
//     );
// }
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home,
  Database,
  FileText,
  MapPin,
  Clock,
  UserCheck
} from 'lucide-react';

import StepFacial from './components/StepFacial';
import StepRegister from './components/StepRegister';
import StepAppointment from './components/StepAppointment';
import StepConfirm from './components/StepConfirm';
import StepComplete from './components/StepComplete';
import StepForms from './components/StepForms';
// import StepRouting from './components/StepRouting';
// import StepLanguage from './components/StepLanguage';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

const EN_TRANSLATIONS = {
  welcome: 'Welcome',
  selectLanguage: 'Select your language',
  autoScanning: 'Scanning Face...',
  lookAtCamera: 'Look at the camera',
  analyzingFace: 'Analyzing...',
  verificationSuccess: 'Welcome Back',
  newPatient: 'New Patient',
  registerNewPatient: 'Register New Patient',
  firstName: 'First Name',
  lastName: 'Last Name',
  dateOfBirth: 'Date of Birth',
  address: 'Address',
  phone: 'Phone',
  email: 'Email',
  insuranceProvider: 'Insurance Provider',
  policyNumber: 'Policy Number',
  groupNumber: 'Group Number',
  registerAndSave: 'Register & Save',
  savingToDb: 'Saving...',
  registrationSuccess: 'Registration Successful!',
  yourPatientId: 'Your Patient ID',
  faceStored: 'Biometrics secure',
  scheduleAppointment: 'Schedule Appointment',
  selectDepartment: 'Select Department',
  selectPhysician: 'Select Physician',
  selectDate: 'Select Date',
  selectTime: 'Select Time',
  reasonForVisit: 'Reason for Visit',
  bookAppointment: 'Book Appointment',
  pendingForms: 'Required Forms',
  signature: 'Signature',
  signHere: 'Sign here',
  clear: 'Clear',
  submit: 'Submit',
  next: 'Next',
  checkInComplete: 'Check-in Complete!',
  thankYou: 'Thank you',
  finish: 'Finish',
  step: 'Step',
  of: 'of',
  patientsInDb: 'Patients',
  appointmentsInDb: 'Appointments',
  personalInfo: 'Personal Information',
  insuranceInfo: 'Insurance Information',
  appointmentDetails: 'Appointment Details',
  todayAppointmentLabel: 'Today Appointment Detail',
  upcomingAppointmentLabel: 'Upcoming Appointment',
  noAppointmentInfo: 'No appointment information.',
  checkInToday: 'Check in for Today',
  bookNewAppointment: 'Book New Appointment',
  patientId: 'Patient ID',
  name: 'Name',
  dob: 'DOB',
  provider: 'Provider',
  policy: 'Policy',
  group: 'Group',
  date: 'Date',
  time: 'Time',
  physician: 'Physician',
  department: 'Department',
  cameraUnavailable: 'Camera unavailable. Proceeding with simulation.',
  checkedIn: 'Checked In!',
  pleaseProceed: 'Please proceed to:',
  room: 'Room',
  errPhone: 'Digits only (10-15)',
  errEmail: 'Invalid email format',
  errReq: 'Required field',
};

const TRANSLATIONS = { en: EN_TRANSLATIONS, es: EN_TRANSLATIONS, fr: EN_TRANSLATIONS, zh: EN_TRANSLATIONS };

const DEPARTMENTS = [
  'Internal Medicine',
  'Cardiology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Neurology'
];

const PHYSICIANS = {
  'Internal Medicine': ['Dr. Michael Chen', 'Dr. Sarah Williams'],
  Cardiology: ['Dr. Emily Rodriguez', 'Dr. James Anderson'],
  Pediatrics: ['Dr. Lisa Brown', 'Dr. David Martinez'],
  Orthopedics: ['Dr. Robert Taylor', 'Dr. Jennifer Lee'],
  Dermatology: ['Dr. Maria Garcia', 'Dr. John White'],
  Neurology: ['Dr. Amanda Johnson', 'Dr. Christopher Davis'],
};

const TIME_SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
];

const REQUIRED_FORMS = [
  'Medical History Questionnaire',
  'HIPAA Privacy Consent',
  'Treatment Consent Form'
];

export default function PatientCheckInKiosk() {
  const [currentStep, setCurrentStep] = useState('language');
  const [language, setLanguage] = useState('en');
  const [patient, setPatient] = useState(null);
  const [routing, setRouting] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const initialPatientData = {
    firstName: '',
    lastName: '',
    dob: '',
    address: '',
    phone: '',
    email: '',
    insurance: { provider: '', policy: '', group: '' },
  };

  const [newPatientData, setNewPatientData] = useState(initialPatientData);


  // const [appointment, setAppointment] = useState(null);
  const [appointment, setAppointment] = useState({
    department: '',
    physician: '',
    date: '',
    time: '',
    reason: '',
  });

  const [capturedFaceImage, setCapturedFaceImage] = useState(null);
  const [dbStats, setDbStats] = useState({ patients: 0, appointments: 0 });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // -- Fetch Stats --
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [p, a] = await Promise.all([
          fetch('http://localhost:8000/api/v1/patients').then((r) => r.json()),
          fetch('http://localhost:8000/api/v1/appointments').then((r) => r.json()),
        ]);
        setDbStats({
          patients: Array.isArray(p) ? p.length : 0,
          appointments: Array.isArray(a) ? a.length : 0,
        });
      } catch (e) {}
    };

    fetchStats();
    const i = setInterval(fetchStats, 5000);
    return () => clearInterval(i);
  }, []);

  // useEffect(() => {
  // // Don't update stats while the user is typing in StepRegister
  //   if (currentStep === 'register') return;

  //   const fetchStats = async () => {
  //     try {
  //       const [p, a] = await Promise.all([
  //         fetch('http://localhost:8000/api/v1/patients').then((r) => r.json()),
  //         fetch('http://localhost:8000/api/v1/appointments').then((r) => r.json()),
  //       ]);
  //       setDbStats({
  //         patients: Array.isArray(p) ? p.length : 0,
  //         appointments: Array.isArray(a) ? a.length : 0,
  //       });
  //     } catch (e) {
  //       console.warn('Stats fetch error:', e);
  //     }
  //   };

  //   fetchStats();
  //   const i = setInterval(fetchStats, 5000);

  //   return () => clearInterval(i);
  // }, [currentStep]);

    

  function StepLanguage({ t, setLanguage, setCurrentStep, LANGUAGES }) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-3">{t.welcome}</h2>
        <p className="text-gray-600 mb-8">{t.selectLanguage}</p>
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {LANGUAGES.map(lang => (
            <button key={lang.code} onClick={() => { setLanguage(lang.code); setCurrentStep('facial'); }} className="p-6 border-2 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all"><div className="text-4xl mb-2">{lang.flag}</div><div className="text-lg font-semibold">{lang.name}</div></button>
          ))}
        </div>
      </div>
    );
  }

  function StepRouting({ t, patient, routing, onReset }) {
      return (
          <div className="text-center space-y-6">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto"><UserCheck className="w-10 h-10 text-green-600" /></div>
              <h2 className="text-3xl font-bold text-gray-800">{t.checkedIn}</h2>
              <p className="text-xl text-gray-600">{t.welcome}, <strong>{patient.first_name}</strong>.</p>
              <div className="bg-blue-50 p-8 rounded-2xl border-2 border-blue-200 max-w-md mx-auto animate-pulse">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">{t.pleaseProceed}</h3>
                  <div className="flex items-center justify-center gap-3 text-4xl font-bold text-blue-900 mb-2"><MapPin className="w-10 h-10"/> {routing.room}</div>
                  <p className="text-blue-700">{routing.department}</p>
                  <div className="flex items-center justify-center gap-2 mt-4 text-blue-600"><Clock className="w-5 h-5"/> {routing.time} with {routing.physician}</div>
              </div>
              <button onClick={onReset} className="mt-8 px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg">{t.finish}</button>
          </div>
      );
  }
//   async function fetchTodayAppointment(patientId) {
//   const res = await fetch(`http://localhost:8000/api/v1/appointments/today/${patientId}`);
//   const data = await res.json();
//   return Array.isArray(data) && data.length > 0 ? data[0] : null;
// }

  // -------------------------
  // AI Face Scan Handler
  // -------------------------
  const handleAIScan = useCallback(
    async (faceImageData, forceSimulation = false) => {
      setIsProcessing(true);
      setScanStatus(t.analyzingFace);

      if (faceImageData) setCapturedFaceImage(faceImageData);
      await new Promise((r) => setTimeout(r, 1500));

      let matchedPatient = null;

      try {
        if (!forceSimulation) {
          const res = await fetch('http://localhost:8000/api/v1/face/identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_data: faceImageData }),
          });

          const data = await res.json();

          if (data.status === 'match' && data.patient_id) {
            const allPatients = await fetch('http://localhost:8000/api/v1/patients').then((r) => r.json());
            matchedPatient = allPatients.find((p) => p.id === data.patient_id);

            if (data.routing) setRouting(data.routing);
          }
        }
      } catch {
        console.warn('API unreachable, simulation mode.');
      }

      if (matchedPatient) {
        setPatient({
          ...matchedPatient,
          first_name: matchedPatient.first_name || matchedPatient.firstName || '',
          last_name: matchedPatient.last_name || matchedPatient.lastName || '',
          dob: matchedPatient.dob || '',
          address: matchedPatient.address || '',
        });

        // Fetch NEXT upcoming appointment
        // try {
        //   // const apptRes = await fetch(
        //   //   `http://localhost:8000/api/v1/appointments/upcoming?patient_id=${matchedPatient.id}`
        //   // );
        //   const apptRes = await fetch(
        //     `http://localhost:8000/api/v1/appointments/latest?patient_id=${matchedPatient.id}`
        //   );

        //   const apptData = await apptRes.json();

        //   if (apptData && apptData.date) {
        //     setAppointment(apptData);
        //   } else {
        //     setAppointment(null);
        //   }
        // } catch {
        //   setAppointment(null);
        // }
// 1. Try fetching TODAY appointment
        let finalAppointment = null;

        try {
          const todayRes = await fetch(
            `http://localhost:8000/api/v1/appointments/today/${matchedPatient.id}`
          );
          const todayData = await todayRes.json();

          if (Array.isArray(todayData) && todayData.length > 0) {
            finalAppointment = todayData[0];   // today appointment found
          }
        } catch (e) {
          console.error("Error fetching today appointment:", e);
        }

        // 2. If no today appointment → get upcoming appointment
        if (!finalAppointment) {
          try {
            const upRes = await fetch(
              `http://localhost:8000/api/v1/appointments/upcoming?patient_id=${matchedPatient.id}`
            );
            const upData = await upRes.json();

            if (upData && upData.date) {
              finalAppointment = upData;
            }
          } catch (e) {
            console.error("Error fetching upcoming appointment:", e);
          }
        }

        // 3. Save final appointment result
        setAppointment(finalAppointment);

        setScanStatus(t.verificationSuccess);
        await new Promise((r) => setTimeout(r, 1500));

        setCurrentStep('confirm');
      } else {
        // NEW PATIENT
        setScanStatus(t.newPatient);
        await new Promise((r) => setTimeout(r, 1500));
        setCurrentStep('register');
      }

      setIsProcessing(false);
    },
    [t]
  );

  // -------------------------
  // Camera Handling
  // -------------------------
  const startCamera = useCallback(async () => {
    try {
      setScanStatus(t.autoScanning);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsCameraReady(true);
          setScanStatus(t.lookAtCamera);
        };
      }
    } catch {
      setScanStatus(t.cameraUnavailable);
      setTimeout(() => handleAIScan(null, true), 2000);
    }
  }, [t, handleAIScan]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  useEffect(() => {
    if (currentStep === 'facial') startCamera();
    else stopCamera();

    return () => stopCamera();
  }, [currentStep, startCamera, stopCamera]);

  // -------------------------
  // Register
  // -------------------------
  const handleRegister = async () => {
    setIsProcessing(true);
    setScanStatus(t.savingToDb);

    try {
      const res = await fetch('http://localhost:8000/api/v1/patient/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPatientData, faceImage: capturedFaceImage }),
      });

      const data = await res.json();
      setPatient({ id: data.patient_id, ...newPatientData });

      await new Promise((r) => setTimeout(r, 1200));
      setCurrentStep('registrationSuccess');
    } catch {
      alert('Registration failed.');
    }

    setIsProcessing(false);
  };

  // -------------------------
  // Booking Appointment
  // -------------------------
  // const handleBooking = async () => {
  //   setIsProcessing(true);

  //   try {
  //     await fetch('http://localhost:8000/api/v1/appointment/book', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ patientId: patient.id, ...appointment }),
  //     });
  //   } catch (e) {
  //     console.error('Booking error', e);
  //   }

  //   await new Promise((r) => setTimeout(r, 1200));
  //   setIsProcessing(false);
  //   setCurrentStep('forms');
  // };
  const handleAppointmentSubmit = async (appointmentData) => {
  setIsProcessing(true);
  try {
    const res = await fetch('http://localhost:8000/api/v1/appointment/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: patient.id,                 // ✅ correct key for backend
        department: appointmentData.department,
        physician: appointmentData.physician,
        date: appointmentData.date,
        time: appointmentData.time,
        reason: appointmentData.reason || '',
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      console.error('Appointment booking failed:', result);
      alert('Failed to save appointment. Please try again.');
      return;
    }

    // Store the appointment locally so StepComplete + future flows can use it
    setAppointment(result.appointment);;

    // Move to forms step
    setCurrentStep('forms');
  } catch (e) {
    console.error('Appointment booking error:', e);
    alert('Network error while booking appointment.');
  } finally {
    setIsProcessing(false);
  }
};


  // -------------------------
  // Reset kiosk
  // -------------------------
  const resetKiosk = () => {
    // DO NOT reset newPatientData here
    setCurrentStep('language');
    setPatient(null);
    setRouting(null);
    setCapturedFaceImage(null);
    setAppointment({
      department: '',
      physician: '',
      date: '',
      time: '',
      reason: '',
      room: undefined,
    });
  };


  // =============================================================
  // RENDER
  // =============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Home className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Springfield Medical</h1>
              <p className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                AI Face Recognition
              </p>
            </div>
          </div>

          <div className="text-right text-sm flex flex-col gap-1">
            <div className="flex items-center gap-2 justify-end">
              <Database className="w-4 h-4" /> {dbStats.patients} {t.patientsInDb}
            </div>
            <div className="flex items-center gap-2 justify-end">
              <FileText className="w-4 h-4" /> {dbStats.appointments} {t.appointmentsInDb}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="p-8 min-h-[500px]">
          {currentStep === 'language' && (
            <StepLanguage
              t={t}
              setLanguage={setLanguage}
              setCurrentStep={setCurrentStep}
              LANGUAGES={LANGUAGES}
            />
          )}

          {currentStep === 'facial' && (
            <StepFacial
              t={t}
              isProcessing={isProcessing}
              scanStatus={scanStatus}
              isCameraReady={isCameraReady}
              videoRef={videoRef}
              canvasRef={canvasRef}
              handleAIScan={handleAIScan}
            />
          )}

          {currentStep === 'register' && (
            <StepRegister
              t={t}
              data={newPatientData}
              setData={setNewPatientData}
              onSubmit={handleRegister}
              isProcessing={isProcessing}
              faceImage={capturedFaceImage}
            />
          )}

          {currentStep === 'registrationSuccess' && (
            <StepComplete
              t={t}
              patient={patient}
              isRegSuccess={true}
              onNext={() => setCurrentStep('appointment')}
            />
          )}

          {currentStep === 'confirm' && (
            <StepConfirm
              t={t}
              patient={patient}
              appointment={appointment}
              onCheckInToday={() => setCurrentStep('forms')}
              onBookNewAppointment={() => setCurrentStep('appointment')}
            />
          )}

          {currentStep === 'appointment' && (
            <StepAppointment
              t={t}
              data={appointment || { department: '', physician: '', date: '', time: '', reason: '' }}
              setData={setAppointment}
              onSubmit={handleAppointmentSubmit}
              isProcessing={isProcessing}
              depts={DEPARTMENTS}
              // docs={PHYSICIANS[appointment.department] || []}  
              docs={appointment ? PHYSICIANS[appointment.department] || [] : []}
 
              times={TIME_SLOTS}
            />
          )}

          {currentStep === 'forms' && (
            <StepForms t={t} forms={REQUIRED_FORMS} onComplete={() => setCurrentStep('complete')} />
          )}

          {currentStep === 'complete' && (
            <StepComplete
              t={t}
              patient={patient}
              appointment={appointment}
              onReset={resetKiosk}
            />
          )}

          {currentStep === 'routing' && (
            <StepRouting t={t} patient={patient} routing={routing} onReset={resetKiosk} />
          )}
        </div>
      </div>
    </div>
  );
}
