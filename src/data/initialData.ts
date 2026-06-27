/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Page, PageVersion, Role, Permission, User, MediaFile, LogEntry } from '../types';

export const INITIAL_PERMISSIONS: Permission[] = [
  { id: 'pages:create', name: 'Crear Páginas', description: 'Permite crear nuevas páginas en la plataforma.' },
  { id: 'pages:edit', name: 'Editar Páginas', description: 'Permite modificar el contenido y diseño de las páginas.' },
  { id: 'pages:delete', name: 'Eliminar Páginas', description: 'Permite eliminar de forma permanente páginas del sistema.' },
  { id: 'pages:publish', name: 'Publicar Cambios', description: 'Permite publicar cambios en tiempo real y gestionar versiones.' },
  { id: 'admins:manage', name: 'Gestionar Admins y Roles', description: 'Permite crear/editar administradores, gestionar roles y sus permisos.' },
  { id: 'media:upload', name: 'Subir Multimedia', description: 'Permite cargar y eliminar imágenes, videos y documentos.' },
  { id: 'forms:view', name: 'Ver Formularios', description: 'Permite consultar y exportar datos enviados por usuarios.' },
];

export const INITIAL_ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Super Administrador (Owner)',
    description: 'Acceso total al sistema, gestión de seguridad y configuración global.',
    permissions: INITIAL_PERMISSIONS.map(p => p.id),
  },
  {
    id: 'editor',
    name: 'Editor de Contenido',
    description: 'Gestiona páginas, bloques y multimedia. No puede modificar accesos ni configuraciones de seguridad.',
    permissions: ['pages:create', 'pages:edit', 'pages:publish', 'media:upload', 'forms:view'],
  },
  {
    id: 'viewer',
    name: 'Analista / Lector',
    description: 'Acceso de solo lectura al dashboard administrativo, versiones y envíos de formularios.',
    permissions: ['forms:view'],
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-root',
    username: 'AngelLeiva',
    email: 'angelleiva3hola@gmail.com',
    roleId: 'owner',
    status: 'active',
    createdAt: '2026-06-23T10:00:00Z',
  },
];

export const INITIAL_MEDIA: MediaFile[] = [];

export const INITIAL_LOGS: LogEntry[] = [];

export const INITIAL_PAGES: Page[] = [];

export const INITIAL_VERSIONS: PageVersion[] = [];

