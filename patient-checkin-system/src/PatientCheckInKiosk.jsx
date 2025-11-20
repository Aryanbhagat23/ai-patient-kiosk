import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Camera, Check, Loader2, Home, User, CheckCircle, UserPlus, Video, Database, 
    FileText, X, MapPin, Clock, UserCheck, AlertCircle, Calendar 
} from 'lucide-react';

// =========================================
// 1. STATIC DATA & FULL TRANSLATIONS
// =========================================

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

const EN_TRANSLATIONS = {
    welcome: 'Welcome', selectLanguage: 'Select your language', autoScanning: 'Scanning Face...',
    lookAtCamera: 'Look at camera', analyzingFace: 'Analyzing...', capturingImage: 'Capturing...',
    verificationSuccess: 'Welcome Back!', newPatient: 'New Patient', registerNewPatient: 'Register New Patient',
    firstName: 'First Name', lastName: 'Last Name', dateOfBirth: 'Date of Birth', address: 'Address',
    phone: 'Phone', email: 'Email', insuranceProvider: 'Insurance Provider', policyNumber: 'Policy Number',
    groupNumber: 'Group Number', registerAndSave: 'Register & Save', savingToDb: 'Saving...',
    registrationSuccess: 'Registration Successful!', yourPatientId: 'Your Patient ID', faceStored: 'Biometrics secure',
    scheduleAppointment: 'Schedule Appointment', selectDepartment: 'Select Department', selectPhysician: 'Select Physician',
    selectDate: 'Select Date', selectTime: 'Select Time', reasonForVisit: 'Reason for Visit',
    bookAppointment: 'Book Appointment', pendingForms: 'Required Forms', signature: 'Signature',
    signHere: 'Sign here', clear: 'Clear', submit: 'Submit', next: 'Next',
    checkInComplete: 'Check-in Complete!', thankYou: 'Thank you', finish: 'Finish',
    step: 'Step', of: 'of', patientsInDb: 'Patients', appointmentsInDb: 'Appointments',
    personalInfo: 'Personal Information', insuranceInfo: 'Insurance Information',
    appointmentDetails: 'Appointment Details', patientId: 'Patient ID', name: 'Name', dob: 'DOB',
    provider: 'Provider', policy: 'Policy', group: 'Group', date: 'Date', time: 'Time',
    physician: 'Physician', department: 'Department', cameraUnavailable: 'Camera unavailable. Proceeding with simulation.',
    checkedIn: 'Checked In!', pleaseProceed: 'Please proceed to:', room: 'Room',
    errPhone: 'Digits only (10-15)', errEmail: 'Invalid email format', errReq: 'Required field',
    pastAppointments: 'Your Past Appointments',
    statusArrived: 'Arrived',
    statusScheduled: 'Scheduled',
    statusCompleted: 'Completed',
    noSlotsToday: 'No more slots available today'
};

const TRANSLATIONS = {
  en: EN_TRANSLATIONS,
  es: {
    ...EN_TRANSLATIONS,
    welcome: 'Bienvenido', selectLanguage: 'Seleccione su idioma', autoScanning: 'Escaneando rostro...',
    lookAtCamera: 'Mire a la cámara', analyzingFace: 'Analizando...', verificationSuccess: '¡Bienvenido de nuevo!',
    newPatient: 'Nuevo Paciente', registerNewPatient: 'Registrar Paciente', firstName: 'Nombre', lastName: 'Apellido',
    dob: 'Fecha de Nacimiento', address: 'Dirección', phone: 'Teléfono', email: 'Correo Electrónico',
    insuranceInfo: 'Información de Seguro', insuranceProvider: 'Proveedor de Seguro', policyNumber: 'Número de Póliza',
    groupNumber: 'Número de Grupo', registerAndSave: 'Registrar y Guardar', savingToDb: 'Guardando...',
    registrationSuccess: '¡Registro Exitoso!', yourPatientId: 'Su ID de Paciente', faceStored: 'Biometría segura',
    scheduleAppointment: 'Programar Cita', selectDepartment: 'Seleccionar Departamento', selectPhysician: 'Seleccionar Médico',
    selectDate: 'Seleccionar Fecha', selectTime: 'Seleccionar Hora', reasonForVisit: 'Motivo de Visita',
    bookAppointment: 'Reservar Cita', pendingForms: 'Formularios Requeridos', signature: 'Firma',
    signHere: 'Firme aquí', clear: 'Borrar', submit: 'Enviar', next: 'Siguiente',
    checkInComplete: '¡Registro Completo!', thankYou: 'Gracias', finish: 'Finalizar',
    patientsInDb: 'Pacientes', appointmentsInDb: 'Citas', personalInfo: 'Información Personal',
    appointmentDetails: 'Detalles de la Cita', patientId: 'ID Paciente', cameraUnavailable: 'Cámara no disponible.',
    checkedIn: '¡Registrado!', pleaseProceed: 'Por favor diríjase a:', room: 'Sala',
    errPhone: 'Solo dígitos (10-15)', errEmail: 'Formato de correo inválido', errReq: 'Campo obligatorio',
    pastAppointments: 'Sus Citas Anteriores', statusArrived: 'Llegó', statusScheduled: 'Programada', statusCompleted: 'Completado',
    noSlotsToday: 'No hay más citas disponibles hoy'
  },
  fr: {
    ...EN_TRANSLATIONS,
    welcome: 'Bienvenue', selectLanguage: 'Choisissez votre langue', autoScanning: 'Scan du visage...',
    lookAtCamera: 'Regardez la caméra', analyzingFace: 'Analyse en cours...', verificationSuccess: 'Bon retour!',
    newPatient: 'Nouveau Patient', registerNewPatient: 'Inscrire Patient', firstName: 'Prénom', lastName: 'Nom',
    dob: 'Date de naissance', address: 'Adresse', phone: 'Téléphone', email: 'E-mail',
    insuranceInfo: 'Informations d\'Assurance', insuranceProvider: 'Assureur', policyNumber: 'Numéro de police',
    groupNumber: 'Numéro de groupe', registerAndSave: 'Enregistrer', savingToDb: 'Sauvegarde...',
    registrationSuccess: 'Inscription réussie!', yourPatientId: 'Votre ID Patient', faceStored: 'Visage stocké',
    scheduleAppointment: 'Prendre rendez-vous', selectDepartment: 'Département', selectPhysician: 'Médecin',
    selectDate: 'Date', selectTime: 'Heure', reasonForVisit: 'Motif de visite',
    bookAppointment: 'Réserver', pendingForms: 'Formulaires requis', signature: 'Signature',
    signHere: 'Signez ici', clear: 'Effacer', submit: 'Soumettre', next: 'Suivant',
    checkInComplete: 'Terminé!', thankYou: 'Merci', finish: 'Terminer',
    patientsInDb: 'Patients', appointmentsInDb: 'Rendez-vous', personalInfo: 'Informations personnelles',
    appointmentDetails: 'Détails', patientId: 'ID Patient', cameraUnavailable: 'Caméra indisponible.',
    checkedIn: 'Enregistré!', pleaseProceed: 'Veuillez vous rendre à :', room: 'Salle',
    errPhone: 'Chiffres uniquement (10-15)', errEmail: 'Format email invalide', errReq: 'Champ obligatoire',
    pastAppointments: 'Vos rendez-vous passés', statusArrived: 'Arrivé', statusScheduled: 'Prévu', statusCompleted: 'Complété',
    noSlotsToday: 'Plus de créneaux disponibles aujourd\'hui'
  },
  zh: {
    ...EN_TRANSLATIONS,
    welcome: '欢迎', selectLanguage: '选择您的语言', autoScanning: '正在扫描面部...',
    lookAtCamera: '请看摄像头', analyzingFace: '正在分析...', capturingImage: '正在拍摄...',
    verificationSuccess: '欢迎回来!', newPatient: '新患者', registerNewPatient: '注册新患者',
    firstName: '名字', lastName: '姓氏', dob: '出生日期', address: '地址',
    phone: '电话', email: '电子邮件', insuranceInfo: '保险信息', insuranceProvider: '保险提供商',
    policyNumber: '保单号码', groupNumber: '团体号码', registerAndSave: '注册并保存',
    savingToDb: '正在保存...', registrationSuccess: '注册成功!', yourPatientId: '您的患者ID',
    faceStored: '生物识别已安全存储', scheduleAppointment: '预约挂号', selectDepartment: '选择科室',
    selectPhysician: '选择医生', selectDate: '选择日期', selectTime: '选择时间',
    reasonForVisit: '就诊原因', bookAppointment: '确认预约', pendingForms: '必要表格',
    signature: '签名', signHere: '在此签名', clear: '清除', submit: '提交',
    next: '下一步', checkInComplete: '完成!', thankYou: '谢谢', finish: '完成',
    step: '步骤', of: '/', patientsInDb: '患者', appointmentsInDb: '预约',
    personalInfo: '个人信息', appointmentDetails: '预约详情', patientId: '患者ID',
    name: '姓名', cameraUnavailable: '摄像头不可用', checkedIn: '已报到!',
    pleaseProceed: '请前往:', room: '房间', errPhone: '仅限数字 (10-15)',
    errEmail: '无效的电子邮件格式', errReq: '必填项', pastAppointments: '您过去的约会',
    statusArrived: '已到达', statusScheduled: '已预约', statusCompleted: '已完成',
    noSlotsToday: '今天没有更多可用时段'
  }
};

const DEPARTMENTS = ['Internal Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Neurology'];
const PHYSICIANS = {
  'Internal Medicine': ['Dr. Michael Chen', 'Dr. Sarah Williams'],
  'Cardiology': ['Dr. Emily Rodriguez', 'Dr. James Anderson'],
  'Pediatrics': ['Dr. Lisa Brown', 'Dr. David Martinez'],
  'Orthopedics': ['Dr. Robert Taylor', 'Dr. Jennifer Lee'],
  'Dermatology': ['Dr. Maria Garcia', 'Dr. John White'],
  'Neurology': ['Dr. Amanda Johnson', 'Dr. Christopher Davis']
};
const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const REQUIRED_FORMS = ['Medical History Questionnaire', 'HIPAA Privacy Consent', 'Treatment Consent Form'];

// =========================================
// 2. KIOSK COMPONENT
// =========================================

export default function PatientCheckInKiosk() {
  const [currentStep, setCurrentStep] = useState('language');
  const [language, setLanguage] = useState('en');
  const [patient, setPatient] = useState(null);
  const [routing, setRouting] = useState(null);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [newPatientData, setNewPatientData] = useState({ firstName: '', lastName: '', dob: '', address: '', phone: '', email: '', insurance: { provider: '', policy: '', group: '' } });
  const [appointment, setAppointment] = useState({ department: '', physician: '', date: '', time: '', reason: '' });
  const [capturedFaceImage, setCapturedFaceImage] = useState(null);
  const [dbStats, setDbStats] = useState({ patients: 0, appointments: 0 });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  // STATS POLLER
  useEffect(() => {
      const fetchStats = async () => {
          try {
              const [p, a] = await Promise.all([
                  fetch("http://localhost:8000/api/v1/patients").then(r=>r.json()),
                  fetch("http://localhost:8000/api/v1/appointments").then(r=>r.json())
              ]);
              setDbStats({ patients: Array.isArray(p)?p.length:0, appointments: Array.isArray(a)?a.length:0 });
          } catch(e) {}
      };
      fetchStats(); const i = setInterval(fetchStats, 5000); return () => clearInterval(i);
  }, []);

  // AI HANDLER
  const handleAIScan = useCallback(async (faceImageData, forceSimulation = false) => {
    setIsProcessing(true);
    setScanStatus(t.analyzingFace);
    if (faceImageData) setCapturedFaceImage(faceImageData);
    await new Promise(resolve => setTimeout(resolve, 1500));

    let matchedPatient = null;
    try {
        if (!forceSimulation) {
            const res = await fetch("http://localhost:8000/api/v1/face/identify", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_data: faceImageData }) });
            if (!res.ok) throw new Error("API identify error");
            const data = await res.json();
            
            if (data.status === 'match' && data.patient_id) {
                const allPatientsRes = await fetch("http://localhost:8000/api/v1/patients");
                if (allPatientsRes.ok) {
                    const allPatients = await allPatientsRes.json();
                    matchedPatient = allPatients.find(p => p.id === data.patient_id);
                }
                if (data.routing) setRouting(data.routing);
                if (data.history) setAppointmentHistory(data.history);
            }
        }
    } catch (error) { console.warn("API unreachable. Simulating 'new patient'."); }

    if (matchedPatient) {
        setPatient(matchedPatient);
        setScanStatus(t.verificationSuccess);
        await new Promise(r => setTimeout(r, 1500));
        setCurrentStep(routing ? 'routing' : 'confirm');
    } else {
        setScanStatus(t.newPatient);
        await new Promise(r => setTimeout(r, 1500));
        setCurrentStep('register');
    }
    setIsProcessing(false);
  }, [t, routing]);

  // CAMERA LOGIC
  const startCamera = useCallback(async () => {
    try {
      setScanStatus(t.autoScanning);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; videoRef.current.onloadedmetadata = () => { videoRef.current.play(); setIsCameraReady(true); setScanStatus(t.lookAtCamera); }; }
    } catch (error) { setScanStatus(t.cameraUnavailable); setTimeout(() => handleAIScan(null, true), 2000); }
  }, [t, handleAIScan]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraReady(false);
  }, []);

  useEffect(() => {
    if (currentStep === 'facial') startCamera(); else stopCamera();
    return () => stopCamera();
  }, [currentStep, startCamera, stopCamera]);

  // ACTION HANDLERS
  const handleRegister = async () => {
    setIsProcessing(true); setScanStatus(t.savingToDb);
    try {
        const res = await fetch("http://localhost:8000/api/v1/patient/register", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newPatientData, faceImage: capturedFaceImage }) });
        if (!res.ok) throw new Error("Registration failed");
        const data = await res.json();
        setPatient({ id: data.patient_id, first_name: newPatientData.firstName, last_name: newPatientData.lastName, ...newPatientData });
        await new Promise(r => setTimeout(r, 1500));
        setCurrentStep('registrationSuccess');
    } catch (e) { alert("Registration Failed. Is the backend running?"); }
    setIsProcessing(false);
  };

  const handleBooking = async () => {
    setIsProcessing(true);
    try {
        await fetch("http://localhost:8000/api/v1/appointment/book", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: patient.id, ...appointment }) });
    } catch (error) { console.error("Booking Error"); }
    await new Promise(r => setTimeout(r, 1500));
    setIsProcessing(false);
    setCurrentStep('forms');
  };

  const resetKiosk = () => {
    setCurrentStep('language'); setPatient(null); setRouting(null); setAppointmentHistory([]);
    setAppointment({ department: '', physician: '', date: '', time: '', reason: '' });
    setNewPatientData({ firstName: '', lastName: '', dob: '', address: '', phone: '', email: '', insurance: { provider: '', policy: '', group: '' } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3"><Home className="w-8 h-8" /><div><h1 className="text-2xl font-bold">Springfield Medical</h1><p className="text-sm flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/> AI Face Recognition</p></div></div>
          <div className="text-right text-sm flex flex-col gap-1"><div className="flex items-center gap-2 justify-end"><Database className="w-4 h-4" /> {dbStats.patients} {t.patientsInDb}</div><div className="flex items-center gap-2 justify-end"><FileText className="w-4 h-4" /> {dbStats.appointments} {t.appointmentsInDb}</div></div>
        </div>
        <div className="p-8 min-h-[500px]">
          {currentStep === 'language' && <StepLanguage t={t} setLanguage={setLanguage} setCurrentStep={setCurrentStep} LANGUAGES={LANGUAGES} />}
          {currentStep === 'facial' && <StepFacial t={t} isProcessing={isProcessing} scanStatus={scanStatus} isCameraReady={isCameraReady} videoRef={videoRef} canvasRef={canvasRef} handleAIScan={handleAIScan} />}
          {currentStep === 'register' && <StepRegister t={t} data={newPatientData} setData={setNewPatientData} onSubmit={handleRegister} isProcessing={isProcessing} faceImage={capturedFaceImage} />}
          {currentStep === 'registrationSuccess' && <StepComplete t={t} patient={patient} isRegSuccess={true} onNext={() => setCurrentStep('appointment')} />}
          {currentStep === 'confirm' && <StepConfirm t={t} patient={patient} history={appointmentHistory} onNext={() => setCurrentStep('appointment')} />}
          {currentStep === 'appointment' && <StepAppointment t={t} data={appointment} setData={setAppointment} onSubmit={handleBooking} isProcessing={isProcessing} depts={DEPARTMENTS} docs={PHYSICIANS} times={TIME_SLOTS} />}
          {currentStep === 'forms' && <StepForms t={t} forms={REQUIRED_FORMS} onComplete={() => setCurrentStep('complete')} />}
          {currentStep === 'complete' && <StepComplete t={t} patient={patient} appointment={appointment} onReset={resetKiosk} />}
          {currentStep === 'routing' && <StepRouting t={t} patient={patient} routing={routing} onReset={resetKiosk} />}
        </div>
      </div>
    </div>
  );
}

// =========================================
// 4. KIOSK SUB-COMPONENTS
// =========================================

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

function StepFacial({ t, isProcessing, scanStatus, isCameraReady, videoRef, canvasRef, handleAIScan }) {
  useEffect(() => {
    let timer;
    if (isCameraReady && !isProcessing) {
       timer = setTimeout(() => {
         if (canvasRef.current && videoRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);
            handleAIScan(canvasRef.current.toDataURL('image/jpeg', 0.8));
         }
       }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isCameraReady, isProcessing, canvasRef, videoRef, handleAIScan]);

  return (
    <div className="text-center">
      <Video className="w-20 h-20 mx-auto mb-6 text-blue-600 animate-pulse" />
      <h2 className="text-2xl font-bold mb-3">AI Face Recognition</h2>
      <p className="text-gray-600 mb-6">{t.lookAtCamera}</p>
      <div className="relative mx-auto rounded-lg overflow-hidden shadow-2xl max-w-2xl">
        <video ref={videoRef} autoPlay playsInline muted className="w-full bg-black" style={{ transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="border-4 border-blue-500/50 w-1/2 h-2/3 rounded-xl"></div></div>
        {isProcessing && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white"><Loader2 className="w-12 h-12 animate-spin mb-4" />{scanStatus}</div>}
      </div>
      <div className="mt-6 text-blue-600 font-semibold">{scanStatus}</div>
    </div>
  );
}

function StepRegister({ t, data, setData, onSubmit, isProcessing, faceImage }) {
  const [errors, setErrors] = useState({});
  const [today] = useState(new Date().toISOString().split('T')[0]); // Get today's date

  const validate = () => {
      const newErrors = {};
      if (!data.firstName.trim()) newErrors.firstName = t.errReq;
      if (!data.lastName.trim()) newErrors.lastName = t.errReq;
      if (!data.dob) newErrors.dob = t.errReq;
      if (!data.address.trim()) newErrors.address = t.errReq;
      if (!/^\d{10,15}$/.test(data.phone.replace(/\D/g,''))) newErrors.phone = t.errPhone;
      if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = t.errEmail;
      if (!data.insurance.provider.trim()) newErrors.provider = t.errReq;
      if (!data.insurance.policy.trim()) newErrors.policy = t.errReq;
      if (!data.insurance.group.trim()) newErrors.group = t.errReq;
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSubmit(); };
  const handleChange = (f, v) => { setData(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(p => ({ ...p, [f]: null })); };
  const handleIns = (f, v) => { setData(p => ({ ...p, insurance: { ...p.insurance, [f]: v } })); if (errors[f]) setErrors(p => ({ ...p, [f]: null })); };
  const Err = ({ f }) => errors[f] ? <div className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle size={12}/> {errors[f]}</div> : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6"><UserPlus className="w-16 h-16 mx-auto text-green-600 mb-2"/><h2 className="text-2xl font-bold">{t.registerNewPatient}</h2>{faceImage && <img src={faceImage} alt="Face" className="w-24 h-24 rounded-full mx-auto border-4 border-green-500 mt-4" />}</div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><input className={`p-3 border-2 rounded-lg w-full ${errors.firstName?'border-red-500 bg-red-50':''}`} placeholder={t.firstName} value={data.firstName} onChange={e => handleChange('firstName', e.target.value)} /><Err f="firstName"/></div>
          <div><input className={`p-3 border-2 rounded-lg w-full ${errors.lastName?'border-red-500 bg-red-50':''}`} placeholder={t.lastName} value={data.lastName} onChange={e => handleChange('lastName', e.target.value)} /><Err f="lastName"/></div>
        </div>
        <div>
            <input 
                type="date" 
                className={`w-full p-3 border-2 rounded-lg ${errors.dob?'border-red-500 bg-red-50':''}`} 
                value={data.dob} 
                onChange={e => handleChange('dob', e.target.value)}
                max={today} // FIX: Cannot select a future date
            />
            <Err f="dob"/>
        </div>
        <div><input className={`w-full p-3 border-2 rounded-lg ${errors.address?'border-red-500 bg-red-50':''}`} placeholder={t.address} value={data.address} onChange={e => handleChange('address', e.target.value)} /><Err f="address"/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><input className={`p-3 border-2 rounded-lg w-full ${errors.phone?'border-red-500 bg-red-50':''}`} placeholder={t.phone} value={data.phone} onChange={e => handleChange('phone', e.target.value)} /><Err f="phone"/></div>
          <div><input className={`p-3 border-2 rounded-lg w-full ${errors.email?'border-red-500 bg-red-50':''}`} placeholder={t.email} value={data.email} onChange={e => handleChange('email', e.target.value)} /><Err f="email"/></div>
        </div>
        <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">{t.insuranceInfo}</h3>
            <div><input className={`w-full p-3 border-2 rounded-lg mb-2 ${errors.provider?'border-red-500 bg-red-50':''}`} placeholder={t.insuranceProvider} value={data.insurance.provider} onChange={e => handleIns('provider', e.target.value)} /><Err f="provider"/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><input className={`w-full p-3 border-2 rounded-lg ${errors.policy?'border-red-500 bg-red-50':''}`} placeholder={t.policyNumber} value={data.insurance.policy} onChange={e => handleIns('policy', e.target.value)} /><Err f="policy"/></div>
              <div><input className={`w-full p-3 border-2 rounded-lg ${errors.group?'border-red-500 bg-red-50':''}`} placeholder={t.groupNumber} value={data.insurance.group} onChange={e => handleIns('group', e.target.value)} /><Err f="group"/></div>
            </div>
        </div>
        <button onClick={handleSubmit} disabled={isProcessing} className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold disabled:bg-gray-300 flex justify-center gap-2">{isProcessing ? <Loader2 className="animate-spin"/> : <CheckCircle/>} {t.registerAndSave}</button>
      </div>
    </div>
  );
}

function StepConfirm({ t, patient, history, onNext }) {
  const StatusBadge = ({ status }) => {
    let text = t.statusScheduled; let color = 'bg-blue-100 text-blue-800';
    if (status === 'arrived') { text = t.statusArrived; color = 'bg-green-100 text-green-800'; }
    if (status === 'completed') { text = t.statusCompleted; color = 'bg-gray-100 text-gray-800'; }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{text}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{t.verificationSuccess}, {patient.first_name}!</h2>
      <div className="bg-blue-50 p-6 rounded-lg mb-4">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><User className="w-5 h-5"/> {t.personalInfo}</h3>
        <p><strong>{t.patientId}:</strong> {patient.id}</p><p><strong>{t.dob}:</strong> {patient.dob}</p>
      </div>
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Calendar className="w-5 h-5"/> {t.pastAppointments}</h3>
        {history.length > 0 ? (
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {history.map((apt, i) => (
              <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border">
                <div><p className="font-medium">{apt.date}</p><p className="text-sm text-gray-600">{apt.physician}</p></div>
                <StatusBadge status={apt.status} />
              </div>
            ))}
          </div>
        ) : (<p className="text-gray-500 text-sm">No appointment history found.</p>)}
      </div>
      <button onClick={onNext} className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold flex justify-center gap-2"><Check/> {t.next}</button>
    </div>
  );
}

function StepAppointment({ t, data, setData, onSubmit, isProcessing, depts, docs, times }) {
  const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));
  const isValid = data.department && data.physician && data.date && data.time;

  // --- REAL-TIME TIME SLOT LOGIC ---
  const today = new Date().toISOString().split('T')[0];
  const isToday = data.date === today;
  const currentHour = new Date().getHours(); // 0-23

  const parseTimeSlot = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours] = time.split(':');
    hours = parseInt(hours, 10);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0; 
    return hours;
  };
  
  const availableTimeSlots = times.filter(slot => {
      if (!isToday) return true; // If future date, all slots are fine
      const slotHour = parseTimeSlot(slot);
      return slotHour > currentHour; // Only show slots later than the current hour
  });
  // --- END REAL-TIME LOGIC ---

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{t.scheduleAppointment}</h2>
      <div className="space-y-4">
        <select className="w-full p-3 border-2 rounded-lg" value={data.department} onChange={e => handleChange('department', e.target.value)}><option value="">{t.selectDepartment}</option>{depts.map(d => <option key={d} value={d}>{d}</option>)}</select>
        {data.department && <select className="w-full p-3 border-2 rounded-lg" value={data.physician} onChange={e => handleChange('physician', e.target.value)}><option value="">{t.selectPhysician}</option>{docs[data.department].map(d => <option key={d} value={d}>{d}</option>)}</select>}
        <div className="grid grid-cols-2 gap-4">
            <input 
              type="date" 
              className="p-3 border-2 rounded-lg w-full" 
              value={data.date} 
              onChange={e => handleChange('date', e.target.value)}
              min={today} // FIX: Cannot select a past date
            />
            <select 
              className="p-3 border-2 rounded-lg w-full" 
              value={data.time} 
              onChange={e => handleChange('time', e.target.value)}
              disabled={!data.date}
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
        <button onClick={onSubmit} disabled={!isValid || isProcessing} className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 flex justify-center gap-2">{isProcessing ? <Loader2 className="animate-spin"/> : <Check/>} {t.bookAppointment}</button>
      </div>
    </div>
  );
}

function StepForms({ t, forms, onComplete }) {
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
  const startDrawing = (e) => { e.preventDefault(); isDrawing.current = true; const ctx = signatureRef.current.getContext('2d'); const { x, y } = getCoords(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineWidth = 2; };
  const draw = (e) => { e.preventDefault(); if (!isDrawing.current) return; const ctx = signatureRef.current.getContext('2d'); const { x, y } = getCoords(e); ctx.lineTo(x, y); ctx.stroke(); setHasSignature(true); };
  const stopDrawing = () => { isDrawing.current = false; };
  const clear = () => { const ctx = signatureRef.current.getContext('2d'); ctx.clearRect(0, 0, 600, 150); setHasSignature(false); };
  const handleSubmit = () => { if (currentFormIndex < forms.length - 1) { setCurrentFormIndex(prev => prev + 1); clear(); } else { onComplete(); } };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{t.pendingForms}</h2>
      <div className="bg-gray-50 p-6 rounded-lg mb-6 border-2">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText className="text-red-500"/>{forms[currentFormIndex]} ({currentFormIndex + 1}/{forms.length})</h3>
        <div className="bg-white p-4 border h-48 overflow-y-auto mb-4 text-sm text-gray-600">[Placeholder legal text for {forms[currentFormIndex]}...]</div>
        <label className="block font-medium mb-2">{t.signature}</label>
        <p className="text-xs text-gray-500 mb-1">{t.signHere}</p>
        <canvas ref={signatureRef} width={600} height={150} className="border rounded w-full bg-white cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
        <button onClick={clear} className="mt-2 text-sm text-red-500 flex items-center gap-1"><X className="w-4 h-4" /> {t.clear}</button>
      </div>
      <button onClick={handleSubmit} disabled={!hasSignature} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300">{currentFormIndex < forms.length - 1 ? t.next : t.submit}</button>
    </div>
  );
}

function StepComplete({ t, patient, appointment, isRegSuccess, onNext, onReset }) {
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
      <p className="text-gray-600 mb-8">{t.thankYou}, {patient.first_name || patient.firstName}!</p>
      {appointment && appointment.date && (
          <div className="bg-blue-50 p-6 rounded-lg max-w-md mx-auto mb-8 text-left">
              <h3 className="font-bold mb-3 text-lg">{t.appointmentDetails}</h3>
              <p><strong>{t.date}:</strong> {appointment.date}</p><p><strong>{t.time}:</strong> {appointment.time}</p>
              <p><strong>{t.physician}:</strong> {appointment.physician}</p><p><strong>{t.department}:</strong> {appointment.department}</p>
          </div>
      )}
      <button onClick={onReset} className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold">{t.finish}</button>
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