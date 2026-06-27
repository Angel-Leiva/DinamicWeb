/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Page, Block, PageVersion, Role, User, 
  MediaFile, FormSubmission, LogEntry 
} from '../types';
import { 
  INITIAL_ROLES, INITIAL_PERMISSIONS, 
  INITIAL_USERS, INITIAL_MEDIA, INITIAL_LOGS 
} from '../data/initialData';
import { 
  ShieldAlert, UserCheck, Eye, ToggleLeft, ToggleRight, 
  Trash2, Edit, Plus, History, Key, Users, 
  FileSpreadsheet, Image as ImageIcon, BarChart3, 
  ClipboardList, AlertTriangle, ArrowRight, CheckCircle, 
  Layers, Lock, Sparkles, Send 
} from 'lucide-react';
import VisualEditor from './VisualEditor';

interface AdminPanelProps {
  pages: Page[];
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  versions: PageVersion[];
  setVersions: React.Dispatch<React.SetStateAction<PageVersion[]>>;
  media: MediaFile[];
  setMedia: React.Dispatch<React.SetStateAction<MediaFile[]>>;
  submissions: FormSubmission[];
  setSubmissions: React.Dispatch<React.SetStateAction<FormSubmission[]>>;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  authToken?: string | null;
  setAuthToken?: React.Dispatch<React.SetStateAction<string | null>>;
  logs: LogEntry[];
  onAddLog: (action: string, details: string) => void;
}

type AdminTab = 
  | 'dashboard' 
  | 'pages' 
  | 'versions' 
  | 'rbac' 
  | 'users' 
  | 'media' 
  | 'submissions';

export default function AdminPanel({
  pages,
  setPages,
  versions,
  setVersions,
  media,
  setMedia,
  submissions,
  setSubmissions,
  currentUser,
  onLoginSuccess,
  authToken,
  setAuthToken,
  logs,
  onAddLog,
}: AdminPanelProps) {
  // Login States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Workspace Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // RBAC Config States (Loaded from initialData but modifiable)
  const [rolesList, setRolesList] = useState<Role[]>(INITIAL_ROLES);
  const [usersList, setUsersList] = useState<User[]>(INITIAL_USERS);

  // Fetch users and roles from PostgreSQL database
  useEffect(() => {
    if (!authToken) return;

    const fetchAdmins = async () => {
      try {
        const res = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          const dbUsers = await res.json();
          setUsersList(dbUsers);
        }
      } catch (e) {
        console.error('Error fetching admin users:', e);
      }
    };

    const fetchRoles = async () => {
      try {
        const res = await fetch('/api/roles', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          const dbRoles = await res.json();
          setRolesList(dbRoles);
        }
      } catch (e) {
        console.error('Error fetching roles:', e);
      }
    };

    fetchAdmins();
    fetchRoles();
  }, [authToken, activeTab]);

  // Modal / Editing states
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageDesc, setNewPageDesc] = useState('');

  // User Management Forms
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('editor');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState('');

  // Password reset/change states
  const [isResettingPasswordUid, setIsResettingPasswordUid] = useState<string | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetConfirmPasswordVal, setResetConfirmPasswordVal] = useState('');

  // Media upload simulation
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaName, setNewMediaName] = useState('');

  // Selected Page for version control
  const [selectedVerPageId, setSelectedVerPageId] = useState<string>(
    pages.length > 0 ? pages[0].id : ''
  );

  // Authentication validation helper
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername: usernameInput,
          password: passwordInput,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Credenciales incorrectas o error en el servidor.');
      }

      const data = await response.json();
      onLoginSuccess(data.user);
    } catch (error: any) {
      setLoginError(error.message || 'Error al conectar con el servidor.');
    }
  };

  // Check if current user has permission
  const hasPermission = (permissionId: string): boolean => {
    if (!currentUser) return false;
    const userRole = rolesList.find((r) => r.id === currentUser.roleId);
    return userRole ? userRole.permissions.includes(permissionId) : false;
  };

  // Publish Page Snapshot (Real-time Versioning)
  const handleSavePageBlocks = (blockData: Block[], summary: string, publish: boolean) => {
    if (!editingPageId) return;

    setPages((prevPages) =>
      prevPages.map((pg) => {
        if (pg.id === editingPageId) {
          const nextVer = publish ? pg.version + 1 : pg.version;
          const updatedPage = {
            ...pg,
            blocks: blockData,
            version: nextVer,
            isPublished: publish ? true : pg.isPublished,
            updatedAt: new Date().toISOString(),
          };

          // If publishing, push snapshot to versioning list
          if (publish) {
            const verRand = Math.random().toString(36).substring(2, 6);
            const newVer: PageVersion = {
              id: `ver-${Date.now()}-${verRand}`,
              pageId: pg.id,
              version: nextVer,
              title: pg.title,
              slug: pg.slug,
              description: pg.description,
              blocks: blockData,
              createdAt: new Date().toISOString(),
              createdBy: currentUser?.email || 'sistema@cms.com',
              changeSummary: summary || 'Publicación de bloques visuales',
            };
            setVersions((prev) => [newVer, ...prev]);
            onAddLog('Publicación de Versión', `Se publicó la versión v${nextVer} de la página "${pg.title}".`);
          } else {
            onAddLog('Guardado de Borrador', `Se guardó un borrador de los bloques para "${pg.title}".`);
          }

          return updatedPage;
        }
        return pg;
      })
    );

    setEditingPageId(null);
  };

  // Restore previous page snapshot (Rollback)
  const handleRollback = (ver: PageVersion) => {
    if (!hasPermission('pages:publish')) {
      triggerToast('Error: No tienes permisos para publicar o revertir cambios.', 'error');
      return;
    }

    setPages((prevPages) =>
      prevPages.map((pg) => {
        if (pg.id === ver.pageId) {
          onAddLog('Restaurar Versión (Rollback)', `Se revirtió la página "${pg.title}" a la versión histórica v${ver.version}.`);
          return {
            ...pg,
            title: ver.title,
            slug: ver.slug,
            description: ver.description,
            blocks: ver.blocks,
            version: pg.version + 1, // increments the live edit version counter
            updatedAt: new Date().toISOString(),
          };
        }
        return pg;
      })
    );

    triggerToast(`¡Éxito! La página fue revertida al snapshot histórico v${ver.version} de manera inmutable.`, 'success');
  };

  // Toggle Publish draft state
  const handleTogglePublish = (pageId: string) => {
    if (!hasPermission('pages:publish')) {
      triggerToast('Error: No tienes permisos para publicar cambios.', 'error');
      return;
    }

    setPages((prev) =>
      prev.map((pg) => {
        if (pg.id === pageId) {
          const nextState = !pg.isPublished;
          onAddLog('Cambio de Publicación', `Página "${pg.title}" cambiada a ${nextState ? 'Publicada' : 'Borrador'}.`);
          return {
            ...pg,
            isPublished: nextState,
            updatedAt: new Date().toISOString(),
          };
        }
        return pg;
      })
    );
  };

  // Create new page
  const handleCreatePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('pages:create')) {
      triggerToast('Permisos insuficientes para crear páginas.', 'error');
      return;
    }

    const cleanedSlug = newPageSlug.toLowerCase().trim().replace(/\s+/g, '-');
    
    // Check slug collision
    if (pages.some((p) => p.slug === cleanedSlug)) {
      triggerToast('Error: Ya existe una página con ese identificador slug.', 'error');
      return;
    }

    const pageRand = Math.random().toString(36).substring(2, 6);
    const newPage: Page = {
      id: `pag-${Date.now()}-${pageRand}`,
      title: newPageTitle,
      slug: cleanedSlug || `pagina-${Date.now()}-${pageRand}`,
      description: newPageDesc,
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      blocks: [
        {
          id: `blk-${Date.now()}-${pageRand}`,
          type: 'text',
          text: {
            content: `Título Inicial de ${newPageTitle}`,
            style: 'heading-1',
            alignment: 'left',
          },
        },
      ],
    };

    setPages((prev) => [...prev, newPage]);
    onAddLog('Creación de Página', `Se creó la página "${newPageTitle}" como Borrador.`);
    
    // reset form
    setNewPageTitle('');
    setNewPageSlug('');
    setNewPageDesc('');
    setIsCreatingPage(false);
  };

  // Delete Page
  const handleDeletePage = (pageId: string) => {
    if (!hasPermission('pages:delete')) {
      triggerToast('Permisos insuficientes para eliminar páginas.', 'error');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar permanentemente esta página? Esta acción es irreversible.')) {
      const pageToDelete = pages.find((p) => p.id === pageId);
      setPages((prev) => prev.filter((p) => p.id !== pageId));
      onAddLog('Eliminación de Página', `Página "${pageToDelete?.title}" eliminada permanentemente.`);
    }
  };

  // Toggle Permission (RBAC Configurator)
  const handleTogglePermission = (roleId: string, permId: string) => {
    if (!hasPermission('admins:manage')) {
      triggerToast('Acceso Denegado: No tienes permisos para gestionar la seguridad o roles.', 'error');
      return;
    }

    setRolesList((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id === roleId) {
          const hasPerm = role.permissions.includes(permId);
          const nextPerms = hasPerm
            ? role.permissions.filter((p) => p !== permId)
            : [...role.permissions, permId];

          onAddLog('Modificación de Roles (RBAC)', `Se alteró el permiso "${permId}" del rol "${role.name}".`);
          return { ...role, permissions: nextPerms };
        }
        return role;
      })
    );
  };

  // Create new user admin
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('admins:manage')) {
      triggerToast('Acceso Denegado: Permisos insuficientes para administrar personal.', 'error');
      return;
    }

    if (newUserPassword !== newUserConfirmPassword) {
      triggerToast('Error: Las contraseñas no coinciden.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newUserEmail.trim(),
          roleId: newUserRole,
          password: newUserPassword,
          confirmPassword: newUserConfirmPassword
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error registrando usuario.');
      }

      const createdUser = await res.json();
      setUsersList((prev) => [...prev, createdUser]);
      triggerToast('Usuario administrativo registrado exitosamente.', 'success');
      onAddLog('Creación de Usuario', `Se creó el administrador "${newUsername}" con rol "${newUserRole}".`);

      setNewUsername('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserConfirmPassword('');
      setIsCreatingUser(false);
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (userUid: string) => {
    if (!hasPermission('admins:manage')) {
      triggerToast('Permisos insuficientes para administrar personal.', 'error');
      return;
    }

    if (userUid === currentUser?.uid) {
      triggerToast('Error: No puedes eliminar tu propio usuario activo.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/users/${userUid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error eliminando usuario.');
      }

      setUsersList((prev) => prev.filter((u) => (u.uid || u.id.toString()) !== userUid));
      triggerToast('Usuario administrativo removido.', 'success');
      onAddLog('Eliminación de Usuario', `Usuario administrativo UID ${userUid} removido.`);
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  // Add simulated Media File
  const handleMediaUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('media:upload')) {
      triggerToast('Permisos insuficientes para cargar archivos.', 'error');
      return;
    }

    const randomId = Math.floor(Math.random() * 1000) + 100;
    const mediaUrl = newMediaUrl.trim() || `https://images.unsplash.com/photo-${randomId}?w=800`;
    const mediaName = newMediaName.trim() || `imagen_usuario_${randomId}.jpg`;

    const medRand = Math.random().toString(36).substring(2, 6);
    const newFile: MediaFile = {
      id: `med-${Date.now()}-${medRand}`,
      name: mediaName,
      url: mediaUrl,
      size: '640 KB',
      type: 'image/jpeg',
      createdAt: new Date().toISOString(),
    };

    setMedia((prev) => [newFile, ...prev]);
    onAddLog('Carga de Archivo', `Se subió la imagen "${mediaName}" al almacén S3.`);

    setNewMediaUrl('');
    setNewMediaName('');
    setIsUploadingMedia(false);
  };

  // Delete Media
  const handleDeleteMedia = (mediaId: string) => {
    if (!hasPermission('media:upload')) {
      triggerToast('Permisos insuficientes para borrar archivos.', 'error');
      return;
    }

    const file = media.find((m) => m.id === mediaId);
    setMedia((prev) => prev.filter((m) => m.id !== mediaId));
    onAddLog('Eliminación de Archivo', `Se eliminó el archivo "${file?.name}" de S3.`);
  };

  // Delete Submission
  const handleDeleteSubmission = (subId: string) => {
    if (!hasPermission('forms:view')) return;
    setSubmissions((prev) => prev.filter((s) => s.id !== subId));
    onAddLog('Eliminación de Envío', 'Se eliminó un envío de formulario.');
  };


  // RENDERING COMPONENT
  
  // A. IF NOT LOGGED IN, RENDER GORGEOUS LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md my-12 animate-fade-in">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner mb-3">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Acceso Administrativo</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Identifícate para acceder al dashboard y constructor visual.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Usuario Administrador</label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="ej: AngelLeiva"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="login-username-input"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Contraseña</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="login-password-input"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 rounded-xl text-[11px] text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors cursor-pointer"
              id="login-submit-btn"
            >
              Autenticar y Acceder
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // B. IF A PAGE BLOCKS EDITOR IS LAUNCHED, RENDER THE FULL SCREEN CONSTRUCTOR
  if (editingPageId) {
    const pageToEdit = pages.find((p) => p.id === editingPageId);
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">Constructor Visual de Bloques</span>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mt-0.5">
              Editando: <span className="font-medium text-gray-600 dark:text-gray-400">{pageToEdit?.title}</span>
            </h2>
          </div>
          <button 
            onClick={() => setEditingPageId(null)}
            className="px-3.5 py-1.5 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
          >
            Cerrar Constructor
          </button>
        </div>
        
        {pageToEdit && (
          <VisualEditor 
            initialBlocks={pageToEdit.blocks} 
            onSave={handleSavePageBlocks} 
            onCancel={() => setEditingPageId(null)} 
          />
        )}
      </div>
    );
  }

  // C. MAIN OPERATIONAL WORKSPACE LAYOUT
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Mini Tabs Selector Sidebar */}
      <div className="w-full lg:w-60 flex-shrink-0">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Módulos Administrativos</span>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mt-1 bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg border border-blue-100 dark:border-blue-900">
              Rol: <span className="text-blue-600 dark:text-blue-400 uppercase font-mono">{currentUser.roleId}</span>
            </span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'dashboard' ? 'bg-blue-500 text-white shadow shadow-blue-500/15' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('pages')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'pages' ? 'bg-blue-500 text-white shadow shadow-blue-500/15' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              <Layers className="h-4 w-4" />
              Gestión de Páginas
            </button>

            <button
              onClick={() => setActiveTab('versions')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'versions' ? 'bg-blue-500 text-white shadow shadow-blue-500/15' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              <History className="h-4 w-4" />
              Historial y Versiones
            </button>

            <button
              onClick={() => setActiveTab('rbac')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'rbac' ? 'bg-blue-500 text-white shadow shadow-blue-500/15' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              <Key className="h-4 w-4" />
              Roles y Permisos
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'users' ? 'bg-blue-500 text-white shadow shadow-blue-500/15' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              <Users className="h-4 w-4" />
              Administradores
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
                activeTab === 'media' ? 'bg-blue-500 text-white shadow shadow-blue-500/15' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              Biblioteca S3
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all relative ${
                activeTab === 'submissions' ? 'bg-blue-500 text-white shadow shadow-blue-500/15' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Formularios Recibidos
              {submissions.length > 0 && (
                <span className="absolute right-2 top-2.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Admin Tab Panel Display */}
      <div className="flex-grow space-y-6">
        {/* KPI SUMMARIES GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Páginas Dinámicas</p>
            <h3 className="text-xl font-black text-gray-950 dark:text-gray-50 mt-1">{pages.length}</h3>
          </div>
          <div className="p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Biblioteca S3</p>
            <h3 className="text-xl font-black text-gray-950 dark:text-gray-50 mt-1">{media.length} Archivos</h3>
          </div>
          <div className="p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Formularios</p>
            <h3 className="text-xl font-black text-gray-950 dark:text-gray-50 mt-1">{submissions.length} Envíos</h3>
          </div>
          <div className="p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admins / Roles</p>
            <h3 className="text-xl font-black text-gray-950 dark:text-gray-50 mt-1">{usersList.length} Activos</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm min-h-[400px]">
          {/* TAB 1: DASHBOARD SUMMARY */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Estado de Operaciones</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Auditoría completa de actividad, transacciones de base de datos y logs de cambio.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Logs de auditoria en vivo */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                    Registro de Eventos Auditados
                  </h4>
                  <div className="border border-gray-100 dark:border-gray-900 rounded-xl overflow-hidden text-xs max-h-72 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/10">
                    <div className="divide-y divide-gray-100 dark:divide-gray-900">
                      {logs.map((log) => (
                        <div key={log.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                          <div className="flex justify-between font-mono text-[9px] text-gray-400">
                            <span>{log.user}</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="font-bold text-gray-800 dark:text-gray-200 mt-1">{log.action}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{log.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Envíos recientes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-purple-500" />
                    Últimas Respuestas de Formularios
                  </h4>
                  <div className="border border-gray-100 dark:border-gray-900 rounded-xl overflow-hidden text-xs max-h-72 overflow-y-auto">
                    {submissions.length === 0 ? (
                      <p className="p-6 text-center italic text-gray-400">No se han recibido consultas en los formularios del portal público.</p>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-900">
                        {submissions.slice(0, 5).map((sub) => (
                          <div key={sub.id} className="p-3">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                              <span>De: {sub.pageTitle}</span>
                              <span className="font-mono">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                            </div>
                            <h5 className="font-semibold text-gray-800 dark:text-gray-200 mt-1">{sub.formTitle}</h5>
                            <ul className="mt-1 space-y-1 bg-gray-50 dark:bg-gray-900/40 p-2 rounded-lg text-[10px]">
                              {Object.entries(sub.data).map(([lbl, val]) => (
                                <li key={lbl} className="truncate">
                                  <span className="font-bold text-gray-600 dark:text-gray-400">{lbl}:</span> {val}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAGES MANAGER */}
          {activeTab === 'pages' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Gestor de Contenido y Diseños</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Crea o elimina páginas y edita sus bloques visuales mediante el constructor sin código.</p>
                </div>
                {hasPermission('pages:create') && (
                  <button
                    onClick={() => setIsCreatingPage(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Página
                  </button>
                )}
              </div>

              {/* Crear página modal simulation */}
              {isCreatingPage && (
                <form onSubmit={handleCreatePageSubmit} className="p-4 border border-blue-100 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/20 rounded-2xl space-y-4">
                  <h4 className="font-bold text-xs text-blue-800 dark:text-blue-300">Nueva Página Dinámica</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Título de la Página</label>
                      <input 
                        type="text" 
                        required
                        value={newPageTitle}
                        onChange={(e) => {
                          setNewPageTitle(e.target.value);
                          setNewPageSlug(e.target.value.toLowerCase().trim().replace(/\s+/g, '-'));
                        }}
                        placeholder="ej: Portafolio de Negocios"
                        className="w-full p-2 text-xs rounded-xl border bg-white dark:bg-gray-950"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Slug Identificador (Ruta URL)</label>
                      <input 
                        type="text" 
                        required
                        value={newPageSlug}
                        onChange={(e) => setNewPageSlug(e.target.value)}
                        placeholder="ej: portafolio"
                        className="w-full p-2 text-xs rounded-xl border bg-white dark:bg-gray-950"
                      />
                    </div>
                    <div className="space-y-1 col-span-1 md:col-span-3">
                      <label className="text-[10px] font-bold text-gray-500">Descripción o Meta Tag</label>
                      <input 
                        type="text" 
                        value={newPageDesc}
                        onChange={(e) => setNewPageDesc(e.target.value)}
                        placeholder="ej: Página para mostrar estadísticas empresariales..."
                        className="w-full p-2 text-xs rounded-xl border bg-white dark:bg-gray-950"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button 
                      type="button" 
                      onClick={() => setIsCreatingPage(false)}
                      className="px-3 py-1.5 border rounded-xl hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl shadow"
                    >
                      Generar Página
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de paginas */}
              <div className="border border-gray-100 dark:border-gray-900 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-5 bg-gray-50 dark:bg-gray-900 p-3 text-xs font-bold text-gray-500 tracking-wide border-b border-gray-100 dark:border-gray-900">
                  <div className="col-span-2">PÁGINA / IDENTIFICADOR</div>
                  <div>VERSION EN VIVO</div>
                  <div>ESTADO</div>
                  <div className="text-right">ACCIONES</div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-900 text-xs">
                  {pages.map((pg) => (
                    <div key={pg.id} className="grid grid-cols-5 p-3 items-center hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                      <div className="col-span-2">
                        <span className="font-bold text-gray-900 dark:text-gray-100 block">{pg.title}</span>
                        <span className="font-mono text-[10px] text-gray-400">/{pg.slug}</span>
                      </div>
                      <div className="font-mono text-gray-500">v{pg.version}</div>
                      <div>
                        <button
                          onClick={() => handleTogglePublish(pg.id)}
                          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                        >
                          {pg.isPublished ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold rounded-full text-[10px]">
                              ● Publicado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold rounded-full text-[10px]">
                              ● Borrador
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingPageId(pg.id)}
                          className="p-1.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-blue-500 text-blue-600 transition-colors cursor-pointer"
                          title="Construir Bloques"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        {hasPermission('pages:delete') && (
                          <button
                            onClick={() => handleDeletePage(pg.id)}
                            className="p-1.5 rounded-lg border border-red-100 dark:border-red-900/20 bg-white dark:bg-gray-950 hover:border-red-500 text-red-500 transition-colors cursor-pointer"
                            title="Eliminar Página"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE / PAGE VERSIONS */}
          {activeTab === 'versions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Control de Versiones y Historial</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Visualiza los snapshots inmutables guardados para restaurar instantáneamente el sitio.</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <label className="font-semibold text-gray-600">Seleccionar Página:</label>
                  <select
                    value={selectedVerPageId}
                    onChange={(e) => setSelectedVerPageId(e.target.value)}
                    className="p-1.5 rounded-xl border"
                  >
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Version timeline list */}
              <div className="space-y-4">
                {versions.filter((v) => v.pageId === selectedVerPageId).length === 0 ? (
                  <div className="p-8 border border-dashed rounded-2xl text-center italic text-gray-400 text-xs">
                    No se han registrado versiones congeladas para esta página aún. Realiza una publicación en el editor de bloques para congelar una versión.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-blue-100 pl-6 space-y-6 text-xs">
                    {versions
                      .filter((v) => v.pageId === selectedVerPageId)
                      .map((ver) => (
                        <div key={ver.id} className="relative bg-gray-50 dark:bg-gray-900/40 border p-4 rounded-2xl">
                          <span className="absolute -left-[31px] top-4 h-4 w-4 rounded-full bg-blue-600 border-2 border-white dark:border-gray-950" />
                          <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-gray-100 dark:border-gray-900">
                            <span className="font-bold text-gray-900 dark:text-gray-100 text-xs">
                              Versión Inmutable v{ver.version}
                            </span>
                            <span className="font-mono text-[9px] text-gray-400">
                              {new Date(ver.createdAt).toLocaleString()} por {ver.createdBy}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-700 dark:text-gray-300 mt-2">{ver.changeSummary}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Bloques snapshot contenidos: {ver.blocks.length}</p>
                          
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => handleRollback(ver)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 hover:bg-blue-100 text-[10px] font-bold rounded-xl cursor-pointer"
                            >
                              <History className="h-3 w-3" />
                              Restaurar Esta Versión (Rollback)
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RBAC SETTINGS */}
          {activeTab === 'rbac' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Configuración de Seguridad (RBAC Grid)</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Define qué permisos posee cada rol en tiempo real para autorizaciones dinámicas de la API.</p>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-100 dark:border-gray-900 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-900">
                      <th className="p-3 font-bold text-gray-500">TOKEN DE PERMISO / DESCRIPCIÓN</th>
                      {rolesList.map((role) => (
                        <th key={role.id} className="p-3 font-bold text-gray-700 dark:text-gray-200 text-center uppercase font-mono">
                          {role.name.split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {INITIAL_PERMISSIONS.map((perm) => (
                      <tr key={perm.id} className="border-b border-gray-100 dark:border-gray-900/40 hover:bg-gray-50/50">
                        <td className="p-3">
                          <span className="font-bold text-gray-900 dark:text-gray-100 font-mono text-[10px] block">{perm.id}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">{perm.description}</span>
                        </td>
                        {rolesList.map((role) => {
                          const isAssigned = role.permissions.includes(perm.id);
                          return (
                            <td key={role.id} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                disabled={role.id === 'owner'} // Owner rules cannot be changed
                                onChange={() => handleTogglePermission(role.id, perm.id)}
                                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ADMINS MANAGER */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Administradores Registrados</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Lista del personal administrativo y sus roles vinculados para autorizaciones.</p>
                </div>
                {hasPermission('admins:manage') && (
                  <button
                    onClick={() => setIsCreatingUser(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Registrar Admin
                  </button>
                )}
              </div>

              {/* Crear usuario modal simulation */}
              {isCreatingUser && (
                <form onSubmit={handleCreateUserSubmit} className="p-4 border border-blue-100 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/20 rounded-2xl space-y-4 animate-fade-in">
                  <h4 className="font-bold text-xs text-blue-800 dark:text-blue-300">Registrar Personal Administrativo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Nombre de Usuario (Login)</label>
                      <input 
                        type="text" 
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="ej: carlos_editor"
                        className="w-full p-2 text-xs rounded-xl border bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Correo Electrónico Corporativo</label>
                      <input 
                        type="email" 
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="ej: carlos@empresa.com"
                        className="w-full p-2 text-xs rounded-xl border bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Rol del Sistema</label>
                      <select 
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                      >
                        <option value="owner">Propietario / Owner</option>
                        <option value="editor">Editor de Contenidos</option>
                        <option value="viewer">Analista / Lector</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Contraseña (Mínimo 6 caracteres)</label>
                      <input 
                        type="password" 
                        required
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2 text-xs rounded-xl border bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Confirmar Contraseña</label>
                      <input 
                        type="password" 
                        required
                        value={newUserConfirmPassword}
                        onChange={(e) => setNewUserConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-2 text-xs rounded-xl border bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button 
                      type="button" 
                      onClick={() => setIsCreatingUser(false)}
                      className="px-3 py-1.5 border rounded-xl hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl shadow"
                    >
                      Registrar
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de usuarios */}
              <div className="border border-gray-100 dark:border-gray-900 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-900 p-3 text-xs font-bold text-gray-500 border-b border-gray-100 dark:border-gray-900">
                  <div>USUARIO / CORREO</div>
                  <div>ROL ASOCIADO</div>
                  <div>ESTADO</div>
                  <div className="text-right">ACCIONES</div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-900 text-xs">
                  {usersList.map((usr) => (
                    <div key={usr.id} className="border-b border-gray-100 dark:border-gray-900 last:border-b-0">
                      <div className="grid grid-cols-4 p-3 items-center hover:bg-gray-50/50">
                        <div>
                          <span className="font-bold text-gray-900 dark:text-gray-100 block">{usr.username}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{usr.email}</span>
                        </div>
                        <div className="capitalize font-mono text-xs">{usr.roleId}</div>
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-semibold text-[10px]">
                            {usr.status}
                          </span>
                        </div>
                        <div className="text-right flex justify-end gap-2 items-center">
                          {hasPermission('admins:manage') && (
                            <button
                              onClick={() => {
                                setIsResettingPasswordUid(usr.uid || usr.id.toString());
                                setResetPasswordVal('');
                                setResetConfirmPasswordVal('');
                              }}
                              className="p-1 text-amber-500 hover:text-amber-700 cursor-pointer"
                              title="Restablecer Contraseña"
                            >
                              <Key className="h-4 w-4 inline" />
                            </button>
                          )}
                          {hasPermission('admins:manage') && usr.email !== currentUser?.email && (
                            <button
                              onClick={() => handleDeleteUser(usr.uid || usr.id.toString())}
                              className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                              title="Remover Usuario"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          )}
                        </div>
                      </div>

                      {isResettingPasswordUid === (usr.uid || usr.id.toString()) && (
                        <div className="p-3 bg-amber-50/10 dark:bg-amber-950/10 border-t border-amber-100/50 dark:border-amber-900/50 flex flex-col md:flex-row gap-3 items-end justify-between animate-fade-in">
                          <div className="grid grid-cols-2 gap-2 flex-1">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Nueva Contraseña</label>
                              <input 
                                type="password" 
                                value={resetPasswordVal}
                                onChange={(e) => setResetPasswordVal(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full p-1.5 text-xs rounded-lg border bg-white dark:bg-gray-950 border-amber-200 dark:border-amber-900"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Confirmar Contraseña</label>
                              <input 
                                type="password" 
                                value={resetConfirmPasswordVal}
                                onChange={(e) => setResetConfirmPasswordVal(e.target.value)}
                                placeholder="Repita la contraseña"
                                className="w-full p-1.5 text-xs rounded-lg border bg-white dark:bg-gray-950 border-amber-200 dark:border-amber-900"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setIsResettingPasswordUid(null)}
                              className="px-2.5 py-1.5 text-[10px] font-bold border rounded-lg hover:bg-gray-50 bg-white dark:bg-gray-950"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={async () => {
                                if (resetPasswordVal !== resetConfirmPasswordVal) {
                                  triggerToast('Las contraseñas no coinciden.', 'error');
                                  return;
                                }
                                if (resetPasswordVal.length < 6) {
                                  triggerToast('La contraseña debe tener al menos 6 caracteres.', 'error');
                                  return;
                                }
                                try {
                                  const res = await fetch(`/api/users/${usr.uid || usr.id.toString()}/reset-password`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${authToken}`
                                    },
                                    body: JSON.stringify({
                                      password: resetPasswordVal,
                                      confirmPassword: resetConfirmPasswordVal
                                    })
                                  });
                                  if (!res.ok) {
                                    const err = await res.json();
                                    throw new Error(err.message || 'Error restableciendo contraseña.');
                                  }
                                  triggerToast('Contraseña restablecida exitosamente.', 'success');
                                  setIsResettingPasswordUid(null);
                                } catch (err: any) {
                                  triggerToast(err.message, 'error');
                                }
                              }}
                              className="px-2.5 py-1.5 text-[10px] font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MEDIA ASSETS */}
          {activeTab === 'media' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Biblioteca S3 y Multimedia</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Imágenes y documentos simulados en la nube para inyección rápida en bloques.</p>
                </div>
                {hasPermission('media:upload') && (
                  <button
                    onClick={() => setIsUploadingMedia(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Subir Imagen URL
                  </button>
                )}
              </div>

              {/* Subir archivo simulación modal */}
              {isUploadingMedia && (
                <form onSubmit={handleMediaUploadSubmit} className="p-4 border border-blue-100 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/20 rounded-2xl space-y-4">
                  <h4 className="font-bold text-xs text-blue-800 dark:text-blue-300">Sincronizar archivo con Amazon S3</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Nombre del Archivo físico</label>
                      <input 
                        type="text" 
                        value={newMediaName}
                        onChange={(e) => setNewMediaName(e.target.value)}
                        placeholder="ej: banner_principal.jpg"
                        className="w-full p-2 text-xs rounded-xl border bg-white dark:bg-gray-950"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Enlace de la Foto (Unsplash o URL)</label>
                      <input 
                        type="text" 
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder="Opcional: URL de imagen de internet"
                        className="w-full p-2 text-xs rounded-xl border bg-white dark:bg-gray-950"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button 
                      type="button" 
                      onClick={() => setIsUploadingMedia(false)}
                      className="px-3 py-1.5 border rounded-xl hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl shadow"
                    >
                      Cargar y Enlazar S3
                    </button>
                  </div>
                </form>
              )}

              {/* Biblioteca de imagenes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {media.map((med) => (
                  <div key={med.id} className="border border-gray-100 dark:border-gray-900 rounded-2xl overflow-hidden bg-white dark:bg-gray-900/40 shadow-inner group">
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={med.url} 
                        alt={med.name} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                        referrerPolicy="no-referrer"
                      />
                      {hasPermission('media:upload') && (
                        <button
                          onClick={() => handleDeleteMedia(med.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-600 transition-colors cursor-pointer"
                          title="Remover de S3"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="p-3 text-[10px]">
                      <span className="font-bold text-gray-800 dark:text-gray-200 block truncate">{med.name}</span>
                      <div className="flex justify-between text-gray-400 mt-1 font-mono">
                        <span>{med.size}</span>
                        <span>{new Date(med.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: FORM SUBMISSIONS READER */}
          {activeTab === 'submissions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Respuestas del Formulario</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Ver y auditar respuestas ingresadas por usuarios en el portal de contacto dinámico.</p>
                </div>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-20 text-gray-400 italic text-xs">
                  Aún no se han recibido respuestas en los formularios de las páginas publicadas. Completa un formulario en la sección de "Contacto" del Portal Público para ver los datos reflejarse aquí.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 dark:border-gray-900 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-900">
                        <th className="p-3 font-bold text-gray-500">FECHA / HORA</th>
                        <th className="p-3 font-bold text-gray-500">PÁGINA / FORMULARIO</th>
                        <th className="p-3 font-bold text-gray-500">INFORMACIÓN DEL USUARIO</th>
                        <th className="p-3 font-bold text-gray-500 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-900/40 hover:bg-gray-50/50">
                          <td className="p-3 font-mono text-[10px] text-gray-400">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-gray-800 dark:text-gray-200 block">{sub.formTitle}</span>
                            <span className="text-[10px] text-gray-400 font-mono">/{sub.pageTitle}</span>
                          </td>
                          <td className="p-3">
                            <ul className="space-y-1 bg-gray-50 dark:bg-gray-900/20 p-2 rounded-xl text-[10px] text-gray-600 dark:text-gray-300">
                              {Object.entries(sub.data).map(([lbl, val]) => (
                                <li key={lbl} className="whitespace-pre-wrap">
                                  <span className="font-bold text-gray-500 dark:text-gray-400">{lbl}:</span> {val}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                              title="Borrar Envío"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-2xl shadow-xl border text-xs font-semibold animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' 
            : toast.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            : 'bg-blue-50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />}
          {toast.type === 'error' && <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />}
          {toast.type === 'info' && <ShieldAlert className="h-4.5 w-4.5 text-blue-500" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
