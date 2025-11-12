export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

export const TRANSLATIONS = {
  en: {
    welcome: 'Welcome', selectLanguage: 'Select your language', autoScanning: 'Scanning Face...',
    lookAtCamera: 'Look at camera', analyzingFace: 'Analyzing...', capturingImage: 'Capturing...',
    verificationSuccess: 'Welcome Back!', newPatient: 'New Patient', registerNewPatient: 'Register New Patient',
    firstName: 'First Name', lastName: 'Last Name', dateOfBirth: 'Date of Birth', address: 'Address',
    phone: 'Phone', email: 'Email', insuranceProvider: 'Insurance Provider', policyNumber: 'Policy Number',
    groupNumber: 'Group Number', registerAndSave: 'Register & Save', savingToDb: 'Saving...',
    registrationSuccess: 'Registration Successful!', yourPatientId: 'Your Patient ID', faceStored: 'Biometrics secure',
    scheduleAppointment: 'Schedule Appointment', selectDepartment: 'Select Department', selectPhysician: 'Select Physician',
    selectDate: 'Select Date', selectTime: 'Select Time', reasonForVisit: 'Reason for Visit',
    bookAppointment: 'Book Appointment', pendingForms: 'Complete Forms', signature: 'Signature',
    signHere: 'Sign here', clear: 'Clear', submit: 'Submit', next: 'Next',
    checkInComplete: 'Check-in Complete!', thankYou: 'Thank you', finish: 'Finish',
    step: 'Step', of: 'of', patientsInDb: 'Patients', appointmentsInDb: 'Appointments',
    personalInfo: 'Personal Information', insuranceInfo: 'Insurance Information',
    appointmentDetails: 'Appointment Details', patientId: 'Patient ID', name: 'Name', dob: 'DOB',
    provider: 'Provider', policy: 'Policy', group: 'Group', date: 'Date', time: 'Time',
    physician: 'Physician', department: 'Department', cameraUnavailable: 'Camera unavailable. Using simulation.'
  },
  es: {
    welcome: 'Bienvenido', selectLanguage: 'Seleccione su idioma', autoScanning: 'Escaneando rostro...',
    lookAtCamera: 'Mire a la cámara', analyzingFace: 'Analizando...', capturingImage: 'Capturando...',
    verificationSuccess: '¡Bienvenido de nuevo!', newPatient: 'Nuevo Paciente', registerNewPatient: 'Registrar Paciente',
    firstName: 'Nombre', lastName: 'Apellido', dateOfBirth: 'Fecha de Nacimiento', address: 'Dirección',
    phone: 'Teléfono', email: 'Email', insuranceProvider: 'Proveedor de Seguro', policyNumber: 'Número de Póliza',
    groupNumber: 'Número de Grupo', registerAndSave: 'Registrar y Guardar', savingToDb: 'Guardando...',
    registrationSuccess: '¡Registro Exitoso!', yourPatientId: 'Su ID de Paciente', faceStored: 'Biometría segura',
    scheduleAppointment: 'Programar Cita', selectDepartment: 'Seleccionar Departamento', selectPhysician: 'Seleccionar Médico',
    selectDate: 'Seleccionar Fecha', selectTime: 'Seleccionar Hora', reasonForVisit: 'Motivo de Visita',
    bookAppointment: 'Reservar Cita', pendingForms: 'Completar Formularios', signature: 'Firma',
    signHere: 'Firme aquí', clear: 'Borrar', submit: 'Enviar', next: 'Siguiente',
    checkInComplete: '¡Registro Completo!', thankYou: 'Gracias', finish: 'Finalizar',
    step: 'Paso', of: 'de', patientsInDb: 'Pacientes', appointmentsInDb: 'Citas',
    personalInfo: 'Información Personal', insuranceInfo: 'Información de Seguro',
    appointmentDetails: 'Detalles de la Cita', patientId: 'ID Paciente', name: 'Nombre', dob: 'F.Nac.',
    provider: 'Proveedor', policy: 'Póliza', group: 'Grupo', date: 'Fecha', time: 'Hora',
    physician: 'Médico', department: 'Departamento', cameraUnavailable: 'Cámara no disponible. Usando simulación.'
  },
  fr: {
    welcome: 'Bienvenue', selectLanguage: 'Choisissez votre langue', autoScanning: 'Scan du visage...',
    lookAtCamera: 'Regardez la caméra', analyzingFace: 'Analyse en cours...', capturingImage: 'Capture...',
    verificationSuccess: 'Bon retour!', newPatient: 'Nouveau Patient', registerNewPatient: 'Inscrire Patient',
    firstName: 'Prénom', lastName: 'Nom', dateOfBirth: 'Date de naissance', address: 'Adresse',
    phone: 'Téléphone', email: 'Email', insuranceProvider: 'Assureur', policyNumber: 'Numéro de police',
    groupNumber: 'Numéro de groupe', registerAndSave: 'Inscrire et Sauvegarder', savingToDb: 'Sauvegarde...',
    registrationSuccess: 'Inscription réussie!', yourPatientId: 'Votre ID Patient', faceStored: 'Biométrie sécurisée',
    scheduleAppointment: 'Prendre rendez-vous', selectDepartment: 'Choisir département', selectPhysician: 'Choisir médecin',
    selectDate: 'Choisir date', selectTime: 'Choisir heure', reasonForVisit: 'Motif de visite',
    bookAppointment: 'Réserver', pendingForms: 'Remplir formulaires', signature: 'Signature',
    signHere: 'Signez ici', clear: 'Effacer', submit: 'Soumettre', next: 'Suivant',
    checkInComplete: 'Enregistrement terminé!', thankYou: 'Merci', finish: 'Terminer',
    step: 'Étape', of: 'sur', patientsInDb: 'Patients', appointmentsInDb: 'Rendez-vous',
    personalInfo: 'Informations personnelles', insuranceInfo: 'Assurance',
    appointmentDetails: 'Détails du rendez-vous', patientId: 'ID Patient', name: 'Nom', dob: 'DDN',
    provider: 'Assureur', policy: 'Police', group: 'Groupe', date: 'Date', time: 'Heure',
    physician: 'Médecin', department: 'Département', cameraUnavailable: 'Caméra indisponible. Simulation utilisée.'
  },
  zh: {
    welcome: '欢迎', selectLanguage: '选择您的语言', autoScanning: '正在扫描面部...',
    lookAtCamera: '请看摄像头', analyzingFace: '正在分析...', capturingImage: '正在拍摄...',
    verificationSuccess: '欢迎回来!', newPatient: '新患者', registerNewPatient: '注册新患者',
    firstName: '名字', lastName: '姓氏', dateOfBirth: '出生日期', address: '地址',
    phone: '电话', email: '电子邮件', insuranceProvider: '保险提供商', policyNumber: '保单号码',
    groupNumber: '团体号码', registerAndSave: '注册并保存', savingToDb: '正在保存...',
    registrationSuccess: '注册成功!', yourPatientId: '您的患者ID', faceStored: '生物识别已安全存储',
    scheduleAppointment: '预约', selectDepartment: '选择科室', selectPhysician: '选择医生',
    selectDate: '选择日期', selectTime: '选择时间', reasonForVisit: '就诊原因',
    bookAppointment: '确认预约', pendingForms: '填写表格', signature: '签名',
    signHere: '在此签名', clear: '清除', submit: '提交', next: '下一步',
    checkInComplete: '报到完成!', thankYou: '谢谢', finish: '完成',
    step: '步骤', of: '/', patientsInDb: '患者', appointmentsInDb: '预约',
    personalInfo: '个人信息', insuranceInfo: '保险信息',
    appointmentDetails: '预约详情', patientId: '患者ID', name: '姓名', dob: '出生日期',
    provider: '提供商', policy: '保单', group: '团体', date: '日期', time: '时间',
    physician: '医生', department: '科室', cameraUnavailable: '摄像头不可用。使用模拟。'
  }
};

export const DEPARTMENTS = ['Internal Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Neurology'];
export const PHYSICIANS = {
  'Internal Medicine': ['Dr. Michael Chen', 'Dr. Sarah Williams'],
  'Cardiology': ['Dr. Emily Rodriguez', 'Dr. James Anderson'],
  'Pediatrics': ['Dr. Lisa Brown', 'Dr. David Martinez'],
  'Orthopedics': ['Dr. Robert Taylor', 'Dr. Jennifer Lee'],
  'Dermatology': ['Dr. Maria Garcia', 'Dr. John White'],
  'Neurology': ['Dr. Amanda Johnson', 'Dr. Christopher Davis']
};
export const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
export const REQUIRED_FORMS = ['Medical History', 'HIPAA Consent', 'Treatment Consent'];