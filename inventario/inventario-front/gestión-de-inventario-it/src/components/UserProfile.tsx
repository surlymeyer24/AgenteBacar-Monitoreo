import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Lock, Key, Phone, Camera, CheckCircle, Save, 
  Briefcase, Building, ShieldCheck, Trash2, Plus, RefreshCw, Eye, EyeOff
} from 'lucide-react';

interface UserProfileProps {
  profileName: string;
  profileEmail: string;
  profileRole: string;
  profilePhone: string;
  profileDept: string;
  onUpdateProfile: (data: {
    profileName: string;
    profileEmail: string;
    profileRole: string;
    profilePhone: string;
    profileDept: string;
    profilePhotoColor: string;
  }) => void;
  onUpdatePassword: (newPass: string) => void;
}

export default function UserProfile({
  profileName,
  profileEmail,
  profileRole,
  profilePhone,
  profileDept,
  onUpdateProfile,
  onUpdatePassword
}: UserProfileProps) {
  // Local active tab for settings: 'general' | 'security'
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

  // General profile inputs
  const [nameInput, setNameInput] = useState(profileName);
  const [emailInput, setEmailInput] = useState(profileEmail);
  const [phoneInput, setPhoneInput] = useState(profilePhone);
  const [deptInput, setDeptInput] = useState(profileDept);
  const [roleInput, setRoleInput] = useState(profileRole);

  // Avatar customization
  const [avatarColor, setAvatarColor] = useState(() => {
    return localStorage.getItem('bacarsa_profile_photo_color') || 'from-indigo-500 to-blue-600';
  });

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Success message banner
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  // Simulation sessions
  const [sessions, setSessions] = useState([
    { id: 'SESS-1', device: 'Chrome on Windows 11 (Esta sesión)', ip: '190.137.240.16', date: 'Activo ahora', status: 'LIVE' },
    { id: 'SESS-2', device: 'Smart Client v2.4 (Android)', ip: '192.168.0.33', date: 'Hace 2 horas', status: 'COMPLETED' },
    { id: 'SESS-3', device: 'Terminal Bunker A (CCTV Station)', ip: '10.0.4.150', date: 'Ayer, 18:45', status: 'COMPLETED' }
  ]);

  // Color preset palettes for profile icon
  const colorPresets = [
    { label: 'Obsidian Blue', value: 'from-indigo-600 to-blue-700' },
    { label: 'Cyan Cyber', value: 'from-cyan-500 to-emerald-500' },
    { label: 'Crimson Rose', value: 'from-rose-500 to-amber-500' },
    { label: 'Deep Grape', value: 'from-purple-600 to-pink-500' },
    { label: 'Emerald Forest', value: 'from-emerald-600 to-teal-500' }
  ];

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setBannerMessage('El nombre no puede estar vacío.');
      setShowSuccessBanner(true);
      return;
    }
    
    // Call parent handler to sync state
    onUpdateProfile({
      profileName: nameInput,
      profileEmail: emailInput,
      profileRole: roleInput,
      profilePhone: phoneInput,
      profileDept: deptInput,
      profilePhotoColor: avatarColor
    });

    localStorage.setItem('bacarsa_profile_photo_color', avatarColor);

    setBannerMessage('¡Información de perfil actualizada correctamente!');
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 3000);
  };

  const handleUpdatePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Debes ingresar tu contraseña actual.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    // Call parent updater
    onUpdatePassword(newPassword);

    setPasswordSuccess('¡Contraseña actualizada con éxito en la base de datos segura!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setBannerMessage('¡Contraseña reconfigurada correctamente!');
    setShowSuccessBanner(true);
    setTimeout(() => {
      setShowSuccessBanner(false);
      setPasswordSuccess('');
    }, 4000);
  };

  const terminateSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    setBannerMessage('Sesión remota revocada correctamente.');
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            Mi Cuenta de Administrador
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Verifica tus parámetros y cambia las credenciales en el sistema.
          </p>
        </div>
        
        <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
          Nivel de Acceso: IT SUPER-USER
        </span>
      </div>

      {/* Banner Success */}
      <AnimatePresence>
        {showSuccessBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-500 border border-emerald-600 rounded-xl text-white font-sans text-xs font-bold shadow-md flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-100" />
              <span>{bannerMessage}</span>
            </div>
            <button 
              onClick={() => setShowSuccessBanner(false)}
              className="text-[10px] text-emerald-100 underline hover:text-white"
            >
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero card with User info and quick banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 text-white shadow-xl flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-5">
          {/* Avatar frame */}
          <div className="relative group cursor-pointer">
            <div className={`w-20 h-20 bg-gradient-to-tr ${avatarColor} rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl tracking-normal shadow-lg transition-transform duration-300 group-hover:scale-105 border-2 border-slate-850`}>
              {nameInput.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'IT'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black leading-tight tracking-tight">{nameInput}</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              {roleInput} &bull; <span className="font-mono text-slate-500 text-[10px]">{emailInput}</span>
            </p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-sans">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              {deptInput}
            </p>
          </div>
        </div>

        {/* Preset colors picker */}
        <div className="p-3 bg-slate-850/50 rounded-xl border border-slate-800 flex flex-col gap-2 w-full md:w-auto">
          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide">
            Color de Credencial
          </span>
          <div className="flex items-center gap-2">
            {colorPresets.map(preset => (
              <button
                key={preset.value}
                onClick={() => {
                  setAvatarColor(preset.value);
                  localStorage.setItem('bacarsa_profile_photo_color', preset.value);
                }}
                className={`w-5 h-5 rounded-md bg-gradient-to-tr ${preset.value} border-2 ${avatarColor === preset.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'} transition-all`}
                title={preset.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-6 text-sm font-bold font-sans">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 relative transition-colors ${activeTab === 'general' ? 'text-blue-600 font-black' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <span>Información General</span>
            {activeTab === 'general' && (
              <motion.div layoutId="profileActiveIndicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 relative transition-colors ${activeTab === 'security' ? 'text-blue-600 font-black' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <span>Seguridad y Contraseña</span>
            {activeTab === 'security' && (
              <motion.div layoutId="profileActiveIndicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-650 rounded" />
            )}
          </button>
        </div>
      </div>

      {/* TAB CONTENT SPANS */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        
        {/* TAB 1: General Info */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                Datos Personales del Personal
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Configura el nombre y la información del puesto de trabajo que se muestra en los logs del sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="block text-slate-650 font-bold">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-650 font-bold">Nombre de Cargo (Título del Puesto)</label>
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold"
                  placeholder="Ej. Coordinador de Redes e Infraestructura"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-650 font-bold">Departamento / Ubicación Sede</label>
                <input
                  type="text"
                  value={deptInput}
                  onChange={(e) => setDeptInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold"
                  placeholder="Ej. Sede Central - Planta de Operaciones"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-650 font-bold">Número de Teléfono Director</label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold font-mono"
                  placeholder="Ej. +54 351 XXX-XXXX"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Security & Password */}
        {activeTab === 'security' && (
          <form onSubmit={handleUpdatePasswordSubmit} className="p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600" />
                Credenciales de Acceso
              </h3>
              <p className="text-[11px] text-slate-500 font-medium font-sans">
                Mantén segura la consola. El cambio de correo actualiza los datos que ingresas al iniciar la sesión de control.
              </p>
            </div>

            {passwordError && (
              <p className="p-2.5 border border-red-200 bg-red-50 text-red-700 text-xs rounded-lg font-bold">
                {passwordError}
              </p>
            )}

            {passwordSuccess && (
              <p className="p-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-bold">
                {passwordSuccess}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="block text-slate-650 font-bold">Usuario / Correo de Inicio de Sesión *</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold font-mono"
                  placeholder="ej. desarrollo.it@bacarsa.com.ar"
                />
                <p className="text-[9px] text-slate-400">Este correo será el utilizado para iniciar sesión en adelante.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-650 font-bold">Contraseña Actual *</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2.5 pr-10 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                    placeholder="Contraseña activa actual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-650 font-bold">Contraseña Nueva *</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 pr-10 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                    placeholder="Al menos 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-650 font-bold">Confirmar Nueva Contraseña *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2.5 pr-10 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                    placeholder="Repita la nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-150 rounded-lg flex items-start gap-3 mt-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div className="space-y-1 text-slate-600 text-[11px] font-medium leading-relaxed font-sans">
                <p className="font-extrabold text-slate-900 uppercase tracking-wide">Protocolo de Seguridad Corporativo</p>
                <p>Las contraseñas de Bacar se cifran utilizando algoritmos hashes de una sola dirección con salting criptográfico.</p>
                <p>Ningún personal ajeno a IT puede acceder a visualizar tus llaves maestras.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#0055cc] hover:bg-[#0044aa] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Key className="w-4 h-4 text-white" />
                <span>Actualizar Credenciales</span>
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
