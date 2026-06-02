import React, { useState } from 'react';
import { User, Asset } from '../types';
import { 
  Users, Search, Plus, Mail, MapPin, Briefcase, Tag, Trash2, Edit2, 
  X, ShieldAlert, CheckCircle, ExternalLink, Laptop, Smartphone, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UsersListProps {
  users: User[];
  assets: Asset[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

export default function UsersList({ users, assets, onAddUser, onUpdateUser, onDeleteUser }: UsersListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDept, setFormDept] = useState('Ingeniería');
  const [formRole, setFormRole] = useState('');
  const [formLocation, setFormLocation] = useState('Sede Principal - CDMX');
  const [formAvatar, setFormAvatar] = useState('');
  const [formError, setFormError] = useState('');

  const departments = ['All', 'Ingeniería', 'Diseño UX/UI', 'Recursos Humanos', 'Ventas & Marketing', 'Finanzas', 'Soporte e IT'];

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormDept('Ingeniería');
    setFormRole('');
    setFormLocation('Sede Principal - CDMX');
    setFormAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'); // Default elegant fallback
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormDept(user.department);
    setFormRole(user.role);
    setFormLocation(user.location);
    setFormAvatar(user.avatarUrl || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formRole.trim() || !formLocation.trim()) {
      setFormError('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    const payload = {
      name: formName,
      email: formEmail,
      department: formDept,
      role: formRole,
      location: formLocation,
      avatarUrl: formAvatar || undefined
    };

    if (editingUser) {
      onUpdateUser({
        ...payload,
        id: editingUser.id
      });
    } else {
      onAddUser(payload);
    }
    setIsFormOpen(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || user.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div id="users-view" className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Directorio de Colaboradores</h1>
          <p className="text-xs text-slate-500">Administración de usuarios, sus roles corporativos y visualización en tiempo real de su equipamiento asignado.</p>
        </div>
        <button 
          id="add-user-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded-lg font-medium text-sm transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Registrar Usuario
        </button>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por nombre, puesto o correo electrónico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-700"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">
          <span>Departamento:</span>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer select-none"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept === 'All' ? 'Todos' : dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Users Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUsers.map((user) => {
          const userAssets = assets.filter(a => a.assignedToUserId === user.id);
          
          return (
            <div 
              key={user.id}
              onClick={() => setSelectedUserForDetails(user)}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-500 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start gap-4">
                <img 
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                  alt={user.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1 overflow-hidden">
                  <h3 className="font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors truncate">{user.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Briefcase className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Badges and statistics details */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-normal">Sede / Ubicación</span>
                  <div className="flex items-center gap-1 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[120px]">{user.location}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-normal">Equipos Custodiados</span>
                  <div className="flex items-center justify-end gap-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${userAssets.length > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                      {userAssets.length} {userAssets.length === 1 ? 'activo' : 'activos'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Overlay */}
              <div className="pt-2 flex justify-end gap-1.5">
                <button 
                  onClick={(e) => handleOpenEdit(user, e)}
                  className="p-1 px-2.5 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded font-medium transition-colors border border-transparent hover:border-blue-100"
                >
                  <Edit2 className="w-3 h-3 inline mr-1" /> Editar
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); if (confirm('¿Deseas dar de baja a este usuario corporativo?')) onDeleteUser(user.id); }}
                  className="p-1 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-800 rounded font-medium transition-colors"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" /> Baja
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* POPUP MODAL: Add & Edit User Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-950 text-sm">
                  {editingUser ? 'Modificar Registro de Usuario' : 'Registrar Nuevo Colaborador'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-2 border border-red-200 bg-red-100 text-red-700 text-xs rounded">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Nombre Completo *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Sofía Rodríguez"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Puesto o Cargo Laboral *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej. Principal Frontend Engineer"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Correo Electrónico *</label>
                  <input 
                    type="email"
                    required
                    placeholder="Ej. sofia.rodriguez@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Departamento</label>
                    <select 
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs bg-white"
                    >
                      {departments.filter(d => d !== 'All').map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Ubicación de Trabajo</label>
                    <input 
                      type="text"
                      placeholder="Ej. CDMX / Guadalajara / Remoto"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-medium text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">URL Avatar (Opcional)</label>
                  <input 
                    type="text"
                    placeholder="URL de foto o imagen de perfil"
                    value={formAvatar}
                    onChange={(e) => setFormAvatar(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-[#0c66e4] hover:bg-[#0055cc] text-white rounded text-xs font-semibold"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* USER WORKSTATION DETAIL DRAWER */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setSelectedUserForDetails(null)} />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-950 text-sm">Usuario e Inventario Vinculado</h3>
              <button onClick={() => setSelectedUserForDetails(null)}>
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="text-center space-y-2">
                <img 
                  src={selectedUserForDetails.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                  alt={selectedUserForDetails.name} 
                  className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-blue-100 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-900 text-base">{selectedUserForDetails.name}</h4>
                  <p className="text-xs font-semibold text-blue-600">{selectedUserForDetails.role}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{selectedUserForDetails.email}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-lg p-3.5 bg-slate-50/50 space-y-2 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Información Institucional</p>
                <div className="space-y-1 text-slate-600">
                  <p><span className="font-semibold text-slate-700">Departamento:</span> {selectedUserForDetails.department}</p>
                  <p><span className="font-semibold text-slate-700">Jurisdicción:</span> {selectedUserForDetails.location}</p>
                </div>
              </div>

              {/* Hardware items under user's supervision list */}
              <div className="space-y-3">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Activos bajo su custodia física ({assets.filter(a => a.assignedToUserId === selectedUserForDetails.id).length})</p>
                
                {assets.filter(a => a.assignedToUserId === selectedUserForDetails.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Ningún hardware asignado a esta persona actualmente.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assets.filter(a => a.assignedToUserId === selectedUserForDetails.id).map(a => (
                      <div key={a.id} className="p-3 border border-slate-100 rounded-lg bg-white flex items-start gap-2.5 shadow-2xs">
                        <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
                          {a.type === 'Laptop' ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                        </span>
                        <div className="text-xs overflow-hidden leading-tight">
                          <p className="font-bold text-slate-800 truncate">{a.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">S/N: {a.serialNumber}</p>
                          <span className="inline-block mt-1 font-mono font-semibold text-blue-600 bg-blue-50/50 rounded px-1 text-[9px]">{a.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => setSelectedUserForDetails(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs"
              >
                Cerrar Panel
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
