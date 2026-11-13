import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Sliders,
  User,
  Users,
  UserCircle,
  Building2,
  Network,
  Cpu,
  Save,
  Copy,
  Check,
  Terminal,
  Key,
  Lock,
  Mail,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Activity,
  Briefcase,
  Building,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

import { useFirebaseAuthUser } from '../hooks/useFirebaseAuth';
import { usePermisos } from '../hooks/usePermisos';
import { getFirebaseAuth, initFirebase, COLLECTIONS } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updatePassword, updateEmail, updateProfile } from 'firebase/auth';

import {
  fetchUsuarios,
  lookupUsuarioAuth,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from '../api/usuarioApi';
import { ROLES_SISTEMA, badgeClassRol, labelRolSistema } from '../constants/roles';
import { useCatalogo, opcionesEnumCatalogo, labelDeCatalogo } from '../hooks/useCatalogo';

import CatalogosAdmin from './CatalogosAdmin';
import ResponsablesList from './ResponsablesList';
import System from './System';
import { ModuleHeader, TabsCard } from '../components/layout';

const COLOR_PRESETS = [
  { label: 'Obsidian Blue', value: 'from-indigo-600 to-blue-700' },
  { label: 'Cyan Cyber', value: 'from-cyan-500 to-emerald-500' },
  { label: 'Crimson Rose', value: 'from-rose-500 to-amber-500' },
  { label: 'Deep Grape', value: 'from-purple-600 to-pink-500' },
  { label: 'Emerald Forest', value: 'from-emerald-600 to-teal-500' },
];

const FORM_USUARIO_INICIAL = {
  email: '',
  nombre: '',
  rol: 'VISUALIZADOR',
  activo: true,
  uid: '',
  departamento: '',
};

function getInitials(name, email) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (!email) return 'IT';
  return email.slice(0, 2).toUpperCase();
}

export default function ConfiguracionSistema() {
  const user = useFirebaseAuthUser();
  const { esAdministrador, puedeEscribir } = usePermisos();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab activo: por defecto 'perfil' (solapa Mi Perfil primero)
  const currentTab = searchParams.get('tab') || 'perfil';

  const setTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Toast / feedback message
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Modal de Auditoría

  // ─────────────────────────────────────────────────────────────
  // 1. Estado de Mi Perfil
  // ─────────────────────────────────────────────────────────────
  const [nameInput, setNameInput] = useState('');
  const [deptInput, setDeptInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [avatarColor, setAvatarColor] = useState('from-indigo-600 to-blue-700');

  const [emailInput, setEmailInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [copiedToken, setCopiedToken] = useState(false);

  // Cargar datos de perfil del usuario logueado
  useEffect(() => {
    if (!user) return;
    setEmailInput(user.email || '');

    const loadProfile = async () => {
      try {
        const db = initFirebase();
        if (db) {
          const ref = doc(db, COLLECTIONS.USUARIOS, user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setNameInput(data.nombre || '');
            setDeptInput(data.departamento || '');
            setRoleInput(data.cargo || '');
            setAvatarColor(data.avatarColor || 'from-indigo-600 to-blue-700');
          } else {
            setNameInput(localStorage.getItem('bacarsa_profile_name') || user.displayName || '');
            setDeptInput(localStorage.getItem('bacarsa_profile_dept') || 'Bóveda Central CBA');
            setRoleInput(localStorage.getItem('bacarsa_profile_role') || 'SUPERADMIN IT');
            setAvatarColor(localStorage.getItem('bacarsa_profile_photo_color') || 'from-indigo-600 to-blue-700');
          }
        }
      } catch (err) {
        console.warn('Error cargando perfil en Configuración:', err);
      }
    };
    loadProfile();
  }, [user]);

  // Guardar datos generales de Mi Perfil
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      showToast('El nombre no puede estar vacío.', 'error');
      return;
    }

    localStorage.setItem('bacarsa_profile_name', nameInput);
    localStorage.setItem('bacarsa_profile_dept', deptInput);
    localStorage.setItem('bacarsa_profile_role', roleInput);
    localStorage.setItem('bacarsa_profile_photo_color', avatarColor);

    try {
      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nameInput });
      }
    } catch (authErr) {
      console.warn('Error al actualizar displayName en Auth:', authErr);
    }

    try {
      const db = initFirebase();
      if (db && user) {
        const ref = doc(db, COLLECTIONS.USUARIOS, user.uid);
        await setDoc(ref, {
          nombre: nameInput,
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

    window.dispatchEvent(new CustomEvent('bacarsa_profile_updated', { detail: { nombre: nameInput } }));
    showToast('¡Información de perfil actualizada correctamente!');
  };

  // Actualizar contraseña de Mi Perfil
  const handleUpdatePassword = async (e) => {
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
      showToast('Credenciales actualizadas.');
    } catch (err) {
      setPasswordError('Error al actualizar contraseña: Reingresa a tu cuenta por seguridad. (' + err.message + ')');
    }
  };

  const handleCopyApiToken = () => {
    const token = `bacar_sec_2025_${user?.uid ? user.uid.slice(0, 14) : '99f381c82e04da'}`;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
    showToast('Token copiado al portapapeles');
  };

  // ─────────────────────────────────────────────────────────────
  // 2. Estado de Usuarios y Roles
  // ─────────────────────────────────────────────────────────────
  const { items: rolItems } = useCatalogo('roles_sistema');
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [usuariosCargando, setUsuariosCargando] = useState(false);
  const [usuariosError, setUsuariosError] = useState(null);
  const [buscarUsuario, setBuscarUsuario] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
  const [editandoUsuarioId, setEditandoUsuarioId] = useState(null);
  const [formUsuario, setFormUsuario] = useState(FORM_USUARIO_INICIAL);
  const [formUsuarioError, setFormUsuarioError] = useState('');
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [buscandoAuth, setBuscandoAuth] = useState(false);
  const [authInfo, setAuthInfo] = useState(null);

  const cargarUsuarios = () => {
    setUsuariosCargando(true);
    setUsuariosError(null);
    fetchUsuarios()
      .then(setUsuariosLista)
      .catch(() => setUsuariosError('No se pudo cargar la lista de usuarios.'))
      .finally(() => setUsuariosCargando(false));
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const q = buscarUsuario.trim().toLowerCase();
    return usuariosLista.filter((u) => {
      const matchBuscar =
        !q ||
        (u.nombre || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q);
      let matchRol = true;
      if (filtroRol === 'SIN_ROL') {
        matchRol = !u.tienePerfil || !u.rol;
      } else if (filtroRol) {
        matchRol = u.rol === filtroRol;
      }
      return matchBuscar && matchRol;
    });
  }, [usuariosLista, buscarUsuario, filtroRol]);

  const totalUsuariosActivos = useMemo(() => {
    return usuariosLista.filter((u) => u.activo !== false && u.tienePerfil).length;
  }, [usuariosLista]);

  const abrirNuevoUsuario = () => {
    setEditandoUsuarioId(null);
    setFormUsuario(FORM_USUARIO_INICIAL);
    setAuthInfo(null);
    setFormUsuarioError('');
    setModalUsuarioAbierto(true);
  };

  const abrirEditarUsuario = (u) => {
    const tienePerfil = !!u.tienePerfil;
    setEditandoUsuarioId(tienePerfil ? u.id : null);
    setFormUsuario({
      email: u.email || '',
      nombre: u.nombre || '',
      rol: u.rol || 'VISUALIZADOR',
      activo: u.activo !== false,
      uid: u.id || '',
      departamento: u.departamento || '',
    });
    setAuthInfo({
      uid: u.id,
      email: u.email,
      displayName: u.nombre,
      yaRegistrado: tienePerfil,
    });
    setFormUsuarioError('');
    setModalUsuarioAbierto(true);
  };

  const buscarCuentaFirebase = async () => {
    const email = formUsuario.email.trim();
    if (!email) {
      setFormUsuarioError('Ingresá un correo para buscar en Firebase Auth.');
      return;
    }
    setBuscandoAuth(true);
    setFormUsuarioError('');
    try {
      const info = await lookupUsuarioAuth(email);
      setAuthInfo(info);
      if (info.yaRegistrado && !editandoUsuarioId) {
        setFormUsuarioError('Ese correo ya tiene rol asignado. Editá el registro existente.');
      } else if (info.displayName && !formUsuario.nombre.trim()) {
        setFormUsuario((f) => ({ ...f, nombre: info.displayName }));
      }
      setFormUsuario((f) => ({ ...f, uid: info.uid, email: info.email || email }));
    } catch (err) {
      setAuthInfo(null);
      setFormUsuarioError(err.message || 'No se encontró la cuenta en Firebase Auth.');
    } finally {
      setBuscandoAuth(false);
    }
  };

  const handleGuardarUsuarioSubmit = async (e) => {
    e.preventDefault();
    if (!formUsuario.nombre.trim() || !formUsuario.email.trim() || !formUsuario.rol) {
      setFormUsuarioError('Nombre, correo y rol son obligatorios.');
      return;
    }

    setGuardandoUsuario(true);
    setFormUsuarioError('');
    try {
      if (editandoUsuarioId) {
        await actualizarUsuario(editandoUsuarioId, {
          nombre: formUsuario.nombre.trim(),
          email: formUsuario.email.trim(),
          rol: formUsuario.rol,
          activo: formUsuario.activo,
          departamento: formUsuario.departamento.trim(),
        });
      } else {
        let uid = authInfo?.uid || formUsuario.uid;
        if (!uid) {
          const info = await lookupUsuarioAuth(formUsuario.email.trim());
          if (info.yaRegistrado) {
            setFormUsuarioError('Ese correo ya tiene rol asignado. Editá el registro existente.');
            return;
          }
          uid = info.uid;
        }
        await crearUsuario({
          uid,
          nombre: formUsuario.nombre.trim(),
          email: formUsuario.email.trim(),
          rol: formUsuario.rol,
          departamento: formUsuario.departamento.trim(),
        });
      }
      setModalUsuarioAbierto(false);
      cargarUsuarios();
      showToast('Usuario guardado exitosamente.');
    } catch (err) {
      setFormUsuarioError(err.message || 'Error al guardar usuario.');
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const handleEliminarUsuario = (u) => {
    if (!u.tienePerfil) {
      alert('Esta cuenta solo existe en Firebase Auth. No hay perfil de inventario para quitar.');
      return;
    }
    if (
      !window.confirm(
        `¿Quitar acceso a "${u.nombre || u.email}"?\n\nSe eliminará el perfil de permisos en el inventario. La cuenta Firebase Auth no se borrará.`
      )
    ) {
      return;
    }
    eliminarUsuario(u.id)
      .then(() => {
        cargarUsuarios();
        showToast('Acceso quitado.');
      })
      .catch(() => alert('No se pudo quitar el usuario.'));
  };

  // ─────────────────────────────────────────────────────────────
  // Componentes de Tarjetas Reutilizables (Izquierda en Mockup)
  // ─────────────────────────────────────────────────────────────
  const OperadorSesionCard = () => (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-red-600" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
            Operador IT en Sesión
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ACTIVO
        </span>
      </div>

      <div className="flex items-start gap-3.5 pt-1">
        <div className="relative">
          <div
            className={`w-12 h-12 bg-gradient-to-tr ${avatarColor} rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-sm border border-slate-700/20`}
          >
            {getInitials(nameInput, user?.email)}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-sm text-slate-900 truncate">
            {nameInput || user?.displayName || 'Operador IT'}
          </h4>
          <p className="text-xs text-slate-500 truncate font-mono">
            {user?.email || 'operador@bacar.com.ar'}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider bg-rose-600 text-white uppercase">
              {roleInput || (esAdministrador ? 'SUPERADMIN IT' : 'OPERADOR IT')}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ID: {user?.uid ? `IT-${user.uid.slice(0, 4).toUpperCase()}` : 'IT-0091'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Sede Asignada
          </span>
          <span className="font-bold text-slate-800 text-xs truncate block mt-0.5" title={deptInput}>
            {deptInput || 'Bóveda Central CBA'}
          </span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Último Ingreso
          </span>
          <span className="font-bold text-slate-800 text-xs block mt-0.5">
            Hoy, 08:14 ART
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
        <span className="text-slate-400 font-medium">Expiración de clave en 14 días</span>
        <button
          type="button"
          onClick={() => setTab('perfil')}
          className="text-red-600 hover:text-red-800 font-bold cursor-pointer"
        >
          Renovar Credencial
        </button>
      </div>
    </div>
  );


  const ConsolaRemotaCard = () => (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            Consola Remota CLI
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            Acceso directo a bacar-srv-mgmt
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setTab('agente')}
        className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
      >
        Conectar
      </button>
    </div>
  );

  const AgenteSincronizacionCard = () => (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-red-600" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
            Agente de Sincronización Local BACAR.Agent
          </h3>
        </div>
        <a
          href="#bacar.internal"
          onClick={(e) => {
            e.preventDefault();
            setTab('agente');
          }}
          className="text-xs text-blue-600 hover:text-blue-800 font-mono font-bold"
        >
          bacar.internal
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Servidor de Enlace Master
          </span>
          <span className="font-mono text-slate-700 font-bold text-xs truncate block mt-0.5">
            sync-prod-ar01.bacar.internal
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Frecuencia de Heartbeat
          </span>
          <span className="font-bold text-slate-700 text-xs block mt-0.5">
            Cada 30 minutos
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Canal de Distribución
          </span>
          <span className="font-bold text-slate-700 text-xs block mt-0.5">
            Canal Estable (v2.1.8)
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full px-4 sm:px-6 py-4 space-y-4">

        {/* ── HEADER EN CARD INDEPENDIENTE ── */}
        <ModuleHeader
          title="Configuración del Sistema"
          badge={
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              BACAR.it v2.1 Enterprise
            </span>
          }
          description="Control centralizado de identidades, catálogos técnicos de hardware y reglas operativas de activos."
        />

        {/* Toast Alert */}
        {toastMsg && (
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 ${
              toastMsg.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── BARRA DE SOLAPAS EN CARD INDEPENDIENTE ── */}
        <TabsCard
          tabs={[
            {
              key: 'perfil',
              label: 'Mi Perfil IT',
              icon: <UserCircle className="w-4 h-4" />,
            },
            {
              key: 'usuarios',
              label: 'Usuarios y Permisos',
              icon: <Users className="w-4 h-4" />,
              count: `${totalUsuariosActivos} activos`,
            },
            {
              key: 'catalogos',
              label: 'Catálogos',
              icon: <Sliders className="w-4 h-4" />,
            },
            {
              key: 'responsables',
              label: 'Responsables y Áreas',
              icon: <Building2 className="w-4 h-4" />,
            },
            {
              key: 'agente',
              label: 'Integraciones y Agente',
              icon: <Network className="w-4 h-4" />,
            },
          ]}
          activeTab={currentTab}
          onChange={setTab}
        />

        {/* ── CONTENIDO DE CADA SOLAPA ── */}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SOLAPA 1: MI PERFIL IT (Primero) */}
        {/* ─────────────────────────────────────────────────────────── */}
        {currentTab === 'perfil' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda: Tarjetas de Estado y Operador en Sesión */}
            <div className="lg:col-span-4 space-y-6">
              <OperadorSesionCard />
              <ConsolaRemotaCard />
            </div>

            {/* Columna Derecha: Edición de Información General y Credenciales */}
            <div className="lg:col-span-8 space-y-6">
              {/* Formulario de Información General */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-red-600" />
                      Datos Personales del Operador
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configura el nombre y la información de puesto que se asocia a tus acciones en el inventario.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5 text-xs text-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-bold">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Ej. Ing. Mariano Benitez"
                        className="w-full p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg font-bold text-slate-800 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-bold">Nombre de Cargo (Título del Puesto)</label>
                      <input
                        type="text"
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        placeholder="Ej. Coordinador de Infraestructura IT"
                        className="w-full p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg font-bold text-slate-800 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-slate-600 font-bold">Departamento / Sede Asignada</label>
                      <input
                        type="text"
                        value={deptInput}
                        onChange={(e) => setDeptInput(e.target.value)}
                        placeholder="Ej. Bóveda Central CBA"
                        className="w-full p-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white rounded-lg font-bold text-slate-800 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Color de Credencial de Operador
                      </span>
                      <span className="text-xs text-slate-600">Personaliza el gradiente de tu avatar.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          type="button"
                          key={preset.value}
                          onClick={() => setAvatarColor(preset.value)}
                          className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${preset.value} border-2 ${
                            avatarColor === preset.value
                              ? 'border-slate-900 scale-110 shadow-sm'
                              : 'border-transparent hover:scale-105'
                          } transition-all cursor-pointer`}
                          title={preset.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Información Personal</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Formulario de Seguridad y Contraseña */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-600" />
                    Credenciales de Acceso y Seguridad
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifica tu correo de acceso y renueva la clave criptográfica de sesión.
                  </p>
                </div>

                {passwordError && (
                  <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded-xl font-bold">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs rounded-xl font-bold">
                    {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs text-slate-700">
                  <div className="space-y-1.5">
                    <label className="block text-slate-600 font-bold">Correo de Inicio de Sesión *</label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg font-mono text-slate-800 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-bold">Contraseña Actual *</label>
                      <div className="relative">
                        <input
                          type={showCurrent ? 'text' : 'password'}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Clave actual"
                          className="w-full p-2.5 pr-8 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg font-mono text-slate-800 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-bold">Nueva Contraseña *</label>
                      <div className="relative">
                        <input
                          type={showNew ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full p-2.5 pr-8 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg font-mono text-slate-800 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-slate-600 font-bold">Confirmar Nueva *</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repite la clave"
                          className="w-full p-2.5 pr-8 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg font-mono text-slate-800 text-xs focus:ring-1 focus:ring-red-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>Actualizar Credenciales</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SOLAPA 2: USUARIOS Y PERMISOS (Diseño fiel al Stitch Mockup) */}
        {/* ─────────────────────────────────────────────────────────── */}
        {currentTab === 'usuarios' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda (Mockup ~1/3) */}
            <div className="lg:col-span-4 space-y-6">
              <OperadorSesionCard />
              <ConsolaRemotaCard />
            </div>

            {/* Columna Derecha (Mockup ~2/3) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Tabla de Operadores de Inventario y Permisos */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                        Operadores de Inventario y Permisos
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Usuarios técnicos con credenciales activas sobre el inventario patrimonial de BACAR.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={abrirNuevoUsuario}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#b91c1c] hover:bg-[#991b1b] text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Operador IT</span>
                  </button>
                </div>

                {/* Filtro y buscador */}
                <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none">
                  <div className="relative w-[65%] min-w-[200px] flex-1">
                    <input
                      type="search"
                      value={buscarUsuario}
                      onChange={(e) => setBuscarUsuario(e.target.value)}
                      placeholder="Buscar por nombre, correo o UID..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <select
                    value={filtroRol}
                    onChange={(e) => setFiltroRol(e.target.value)}
                    className="!w-[25%] max-w-[28%] min-w-[140px] px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 font-medium focus:bg-white focus:border-blue-500 focus:outline-none truncate cursor-pointer"
                  >
                    <option value="">Todos los roles</option>
                    <option value="SIN_ROL">Sin rol</option>
                    {opcionesEnumCatalogo(rolItems).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={cargarUsuarios}
                    title="Actualizar lista"
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 shrink-0 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${usuariosCargando ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Tabla de Operadores */}
                <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">OPERADOR</th>
                        <th className="px-4 py-3">ROL DEL SISTEMA</th>
                        <th className="px-4 py-3">SEDE / DEPENDENCIA</th>
                        <th className="px-4 py-3">ESTADO</th>
                        <th className="px-4 py-3 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usuariosCargando ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">
                            Cargando operadores de inventario...
                          </td>
                        </tr>
                      ) : usuariosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">
                            No se encontraron operadores registrados.
                          </td>
                        </tr>
                      ) : (
                        usuariosFiltrados.map((u) => {
                          const esTuUsuario = user?.email && u.email?.toLowerCase() === user.email.toLowerCase();
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    {getInitials(u.nombre, u.email)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900 truncate">
                                        {u.nombre || '—'}
                                      </span>
                                      {esTuUsuario && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                                          TÚ
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-400 block truncate font-mono">
                                      {u.email || u.id}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${badgeClassRol(
                                    u.rol
                                  )}`}
                                >
                                  {labelDeCatalogo(rolItems, u.rol) || u.rol || 'Sin rol'}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-slate-600 font-medium">
                                {u.departamento || 'Sede Central Córdoba'}
                              </td>

                              <td className="px-4 py-3">
                                {!u.tienePerfil ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Solo Auth
                                  </span>
                                ) : u.activo !== false ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Activo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    Inactivo
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => abrirEditarUsuario(u)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Editar operador"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  {u.tienePerfil && (
                                    <button
                                      type="button"
                                      onClick={() => handleEliminarUsuario(u)}
                                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Quitar acceso"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SOLAPA 3: CATÁLOGOS */}
        {/* ─────────────────────────────────────────────────────────── */}
        {currentTab === 'catalogos' && (
          <div className="space-y-6">
            <CatalogosAdmin />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SOLAPA 4: RESPONSABLES Y ÁREAS */}
        {/* ─────────────────────────────────────────────────────────── */}
        {currentTab === 'responsables' && (
          <div className="space-y-6">
            <ResponsablesList />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* SOLAPA 5: INTEGRACIONES Y AGENTE */}
        {/* ─────────────────────────────────────────────────────────── */}
        {currentTab === 'agente' && (
          <div className="space-y-6">
            <AgenteSincronizacionCard />
            <System />
          </div>
        )}

      </div>

      {/* ── MODAL NUEVO / EDITAR OPERADOR IT ── */}
      {modalUsuarioAbierto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setModalUsuarioAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 border-t-4 border-t-red-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2 uppercase tracking-wide">
                <Users className="w-4 h-4 text-red-600 shrink-0" />
                {editandoUsuarioId ? 'Editar Operador IT' : 'Registrar Nuevo Operador IT'}
              </h3>
              <button
                type="button"
                onClick={() => setModalUsuarioAbierto(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formUsuarioError && (
              <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                {formUsuarioError}
              </div>
            )}

            <form onSubmit={handleGuardarUsuarioSubmit} className="space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Correo (Firebase Auth) *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      disabled={!!editandoUsuarioId || !!formUsuario.uid}
                      placeholder="usuario@bacarsa.com.ar"
                      value={formUsuario.email}
                      onChange={(e) => {
                        setFormUsuario((f) => ({ ...f, email: e.target.value }));
                        setAuthInfo(null);
                      }}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-800 disabled:bg-slate-50 focus:ring-1 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                  {!editandoUsuarioId && !formUsuario.uid && (
                    <button
                      type="button"
                      onClick={buscarCuentaFirebase}
                      disabled={buscandoAuth}
                      className="px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {buscandoAuth ? 'Buscando...' : 'Buscar'}
                    </button>
                  )}
                </div>
                {authInfo && (
                  <p className="text-[10px] text-emerald-700 mt-1 font-mono">
                    Cuenta encontrada: {authInfo.uid}
                    {authInfo.displayName ? ` · ${authInfo.displayName}` : ''}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formUsuario.nombre}
                  onChange={(e) => setFormUsuario((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Sede / Dependencia</label>
                <input
                  type="text"
                  value={formUsuario.departamento}
                  onChange={(e) => setFormUsuario((f) => ({ ...f, departamento: e.target.value }))}
                  placeholder="Ej. Bóveda Central CBA"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Rol del Sistema *</label>
                <select
                  required
                  value={formUsuario.rol}
                  onChange={(e) => setFormUsuario((f) => ({ ...f, rol: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white font-semibold focus:ring-1 focus:ring-red-500 focus:outline-none"
                >
                  {opcionesEnumCatalogo(rolItems).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {ROLES_SISTEMA.find((r) => r.value === formUsuario.rol)?.descripcion}
                </p>
              </div>

              {editandoUsuarioId && (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formUsuario.activo}
                    onChange={(e) => setFormUsuario((f) => ({ ...f, activo: e.target.checked }))}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="font-semibold text-slate-700">
                    Operador Activo (desmarcar para modo solo lectura forzada)
                  </span>
                </label>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalUsuarioAbierto(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoUsuario}
                  className="px-5 py-2 bg-[#b91c1c] hover:bg-[#991b1b] disabled:opacity-60 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                >
                  {guardandoUsuario ? 'Guardando...' : 'Guardar Operador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
