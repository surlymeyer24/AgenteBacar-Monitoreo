import { useState, useEffect } from 'react';
import { getFirebaseAuth, initFirebase, COLLECTIONS } from '../lib/firebase';
import { updatePassword, updateEmail } from 'firebase/auth';
import { useFirebaseAuthUser } from '../hooks/useFirebaseAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  User, Mail, Lock, Key, Phone, Save, Briefcase, Building, ShieldCheck, Eye, EyeOff, CheckCircle 
} from 'lucide-react';

const colorPresets = [
  { label: 'Obsidian Blue', value: 'from-indigo-600 to-blue-700' },
  { label: 'Cyan Cyber', value: 'from-cyan-500 to-emerald-500' },
  { label: 'Crimson Rose', value: 'from-rose-500 to-amber-500' },
  { label: 'Deep Grape', value: 'from-purple-600 to-pink-500' },
  { label: 'Emerald Forest', value: 'from-emerald-600 to-teal-500' }
];

export default function MiPerfil() {
  const user = useFirebaseAuthUser();
  const [activeTab, setActiveTab] = useState('general');
  const [loadingProfile, setLoadingProfile] = useState(true);

  // General profile inputs
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [deptInput, setDeptInput] = useState('');
  const [roleInput, setRoleInput] = useState('');

  // Avatar customization
  const [avatarColor, setAvatarColor] = useState('from-indigo-600 to-blue-700');

  // Password fields
  const [emailInput, setEmailInput] = useState('');
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

  // Load profile from Firestore on mount
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const db = initFirebase();
        if (db) {
          const ref = doc(db, COLLECTIONS.USUARIOS, user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setNameInput(data.nombre || '');
            setPhoneInput(data.telefono || '');
            setDeptInput(data.departamento || '');
            setRoleInput(data.cargo || '');
            setAvatarColor(data.avatarColor || 'from-indigo-600 to-blue-700');
          } else {
            // Fallback to localStorage if no Firestore doc yet
            setNameInput(localStorage.getItem('bacarsa_profile_name') || '');
            setPhoneInput(localStorage.getItem('bacarsa_profile_phone') || '');
            setDeptInput(localStorage.getItem('bacarsa_profile_dept') || '');
            setRoleInput(localStorage.getItem('bacarsa_profile_role') || '');
            setAvatarColor(localStorage.getItem('bacarsa_profile_photo_color') || 'from-indigo-600 to-blue-700');
          }
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    setEmailInput(user.email || '');
    loadProfile();
  }, [user]);

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setBannerMessage('El nombre no puede estar vacío.');
      setShowSuccessBanner(true);
      return;
    }

    // Always cache in localStorage
    localStorage.setItem('bacarsa_profile_name', nameInput);
    localStorage.setItem('bacarsa_profile_phone', phoneInput);
    localStorage.setItem('bacarsa_profile_dept', deptInput);
    localStorage.setItem('bacarsa_profile_role', roleInput);
    localStorage.setItem('bacarsa_profile_photo_color', avatarColor);

    // Persist to Firestore
    try {
      const db = initFirebase();
      if (db && user) {
        const ref = doc(db, COLLECTIONS.USUARIOS, user.uid);
        await setDoc(ref, {
          nombre: nameInput,
          telefono: phoneInput,
          departamento: deptInput,
          cargo: roleInput,
          avatarColor,
          email: user.email,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (err) {
      console.error('Error guardando perfil en Firestore:', err);
    }

    setBannerMessage('¡Información de perfil actualizada correctamente!');
    setShowSuccessBanner(true);
    setTimeout(() => setShowSuccessBanner(false), 3000);
  };

  const handleUpdatePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('La contraseña nueva debe tener al menos 6 caracteres.');
      return;
    }

    try {
      const auth = getFirebaseAuth();
      if (!auth.currentUser) {
        setPasswordError('No hay usuario autenticado.');
        return;
      }
      
      if (emailInput !== user?.email) {
        try {
           await updateEmail(auth.currentUser, emailInput);
        } catch (emailErr) {
           setPasswordError('Para cambiar el correo, es posible que debas cerrar sesión y volver a ingresar. (' + emailErr.message + ')');
           return;
        }
      }

      await updatePassword(auth.currentUser, newPassword);
      setPasswordSuccess('Credenciales actualizadas correctamente.');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err) {
      setPasswordError('Error al actualizar: Es posible que debas cerrar sesión y volver a ingresar por seguridad. (' + err.message + ')');
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Mi Cuenta de Administrador
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Verifica tus parámetros y cambia las credenciales en el sistema.
          </p>
        </div>
        
        <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-mono">
          NIVEL DE ACCESO: IT SUPER-USER
        </span>
      </div>

      {/* Banner Success */}
      {showSuccessBanner && (
        <div className="p-4 bg-emerald-500 border border-emerald-600 rounded-xl text-white font-sans text-sm font-bold shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-100" />
            <span>{bannerMessage}</span>
          </div>
          <button 
            onClick={() => setShowSuccessBanner(false)}
            className="text-xs text-emerald-100 underline hover:text-white"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Hero card with User info and quick banner */}
      <div className="bg-gradient-to-r from-[#0a0f1d] to-[#111827] border border-slate-800 rounded-xl p-8 text-white shadow-xl flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Avatar frame */}
          <div className="relative group cursor-pointer">
            <div className={`w-24 h-24 bg-gradient-to-tr ${avatarColor} rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl tracking-normal shadow-lg transition-transform duration-300 group-hover:scale-105 border-2 border-slate-800/50`}>
              {nameInput.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'IT'}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black leading-tight tracking-tight">{nameInput}</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                Online
              </span>
            </div>
            <p className="text-sm text-slate-400 font-sans flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-slate-400" />
              {roleInput} &bull; <span className="font-mono text-slate-500 text-xs">{emailInput}</span>
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-sans mt-1">
              <Building className="w-4 h-4 text-slate-500" />
              {deptInput}
            </p>
          </div>
        </div>

        {/* Preset colors picker */}
        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex flex-col gap-3 w-full md:w-auto">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide">
            COLOR DE CREDENCIAL
          </span>
          <div className="flex items-center gap-2.5">
            {colorPresets.map(preset => (
              <button
                type="button"
                key={preset.value}
                onClick={() => {
                  setAvatarColor(preset.value);
                  localStorage.setItem('bacarsa_profile_photo_color', preset.value);
                }}
                className={`w-6 h-6 rounded-md bg-gradient-to-tr ${preset.value} border-2 ${avatarColor === preset.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'} transition-all`}
                title={preset.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-8 text-base font-bold font-sans">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 relative transition-colors ${activeTab === 'general' ? 'text-blue-600 font-black' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <span>Información General</span>
            {activeTab === 'general' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 relative transition-colors ${activeTab === 'security' ? 'text-blue-600 font-black' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <span>Seguridad y Contraseña</span>
            {activeTab === 'security' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded" />
            )}
          </button>
        </div>
      </div>

      {/* TAB CONTENT SPANS */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* TAB 1: General Info */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="p-8 space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                DATOS PERSONALES DEL PERSONAL
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Configura el nombre y la información del puesto de trabajo que se muestra en los logs del sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full p-3 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold text-slate-800 text-sm"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold">Nombre de Cargo (Título del Puesto)</label>
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full p-3 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold text-slate-800 text-sm"
                  placeholder="Ej. Coordinador de Redes e Infraestructura"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold">Departamento / Ubicación Sede</label>
                <input
                  type="text"
                  value={deptInput}
                  onChange={(e) => setDeptInput(e.target.value)}
                  className="w-full p-3 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold text-slate-800 text-sm"
                  placeholder="Ej. Sede Central - Planta de Operaciones"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold">Número de Teléfono Director</label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full p-3 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold font-mono text-slate-800 text-sm"
                  placeholder="Ej. +54 351 XXX-XXXX"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-[#1a65f0] hover:bg-[#1554c9] text-white font-bold text-sm rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Security & Password */}
        {activeTab === 'security' && (
          <form onSubmit={handleUpdatePasswordSubmit} className="p-8 space-y-8">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Credenciales de Acceso
              </h3>
              <p className="text-xs text-slate-500 font-medium font-sans mt-1">
                Mantén segura la consola. El cambio de correo actualiza los datos que ingresas al iniciar sesión de control.
              </p>
            </div>

            {passwordError && (
              <p className="p-3 border border-red-200 bg-red-50 text-red-700 text-sm rounded-lg font-bold">
                {passwordError}
              </p>
            )}

            {passwordSuccess && (
              <p className="p-3 border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm rounded-lg font-bold">
                {passwordSuccess}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold">Usuario / Correo de Inicio de Sesión *</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full p-3 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold font-mono text-slate-800 text-sm"
                  placeholder="ej. desarrollo.it@bacarsa.com.ar"
                />
                <p className="text-[11px] text-slate-400 mt-1">Este correo será el utilizado para iniciar sesión en adelante.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold">Contraseña Actual *</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-3 pr-11 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono text-slate-800 text-sm"
                    placeholder="Contraseña activa actual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold">Contraseña Nueva *</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 pr-11 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono text-slate-800 text-sm"
                    placeholder="Al menos 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-600 font-bold">Confirmar Nueva Contraseña *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 pr-11 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono text-slate-800 text-sm"
                    placeholder="Repita la nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3 mt-4">
              <ShieldCheck className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div className="space-y-1 text-slate-600 text-xs font-medium leading-relaxed font-sans">
                <p className="font-extrabold text-slate-900 uppercase tracking-wide">Protocolo de Seguridad Corporativo</p>
                <p>Las contraseñas de Bacar se cifran utilizando algoritmos hashes de una sola dirección con salting criptográfico.</p>
                <p>Ningún personal ajeno a IT puede acceder a visualizar tus llaves maestras.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-[#1a65f0] hover:bg-[#1554c9] text-white font-bold text-sm rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                <Key className="w-4 h-4 text-white" />
                <span>Actualizar Credenciales</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
    </div>
  );
}
