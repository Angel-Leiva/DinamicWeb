import { db } from './index.ts';
import { roles, permissions, rolePermissions, users } from './schema.ts';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const ALL_PERMISSIONS = [
  { id: 'pages:create', name: 'Crear Páginas', description: 'Permite crear nuevas páginas.' },
  { id: 'pages:edit', name: 'Editar Páginas', description: 'Permite modificar páginas.' },
  { id: 'pages:delete', name: 'Eliminar Páginas', description: 'Permite eliminar páginas.' },
  { id: 'pages:publish', name: 'Publicar Cambios', description: 'Permite publicar cambios y guardar versiones.' },
  { id: 'pages:restore', name: 'Restaurar Versiones', description: 'Permite revertir a versiones anteriores.' },
  { id: 'admins:manage', name: 'Gestionar Admins y Roles', description: 'Permite administrar roles, usuarios y permisos.' },
  { id: 'media:view', name: 'Ver Multimedia', description: 'Permite listar y ver archivos multimedia.' },
  { id: 'media:upload', name: 'Subir Multimedia', description: 'Permite cargar nuevos archivos.' },
  { id: 'media:delete', name: 'Eliminar Multimedia', description: 'Permite eliminar archivos multimedia.' },
  { id: 'logs:view', name: 'Ver Auditoría', description: 'Permite visualizar los registros de auditoría.' },
  { id: 'logs:delete', name: 'Eliminar Auditoría', description: 'Permite depurar registros de auditoría.' },
  { id: 'forms:view', name: 'Ver Formularios', description: 'Permite ver respuestas de formularios.' },
  { id: 'forms:delete', name: 'Eliminar Formularios', description: 'Permite eliminar respuestas de formularios.' },
];

const DEFAULT_ROLES = [
  {
    id: 'owner',
    name: 'Super Administrador (Owner)',
    description: 'Acceso total al sistema, seguridad y auditoría.',
    permissions: ALL_PERMISSIONS.map(p => p.id),
  },
  {
    id: 'editor',
    name: 'Editor de Contenido',
    description: 'Gestiona páginas, bloques y multimedia. No puede modificar seguridad.',
    permissions: [
      'pages:create',
      'pages:edit',
      'pages:publish',
      'pages:restore',
      'media:view',
      'media:upload',
      'forms:view',
      'logs:view',
    ],
  },
  {
    id: 'viewer',
    name: 'Analista / Lector',
    description: 'Acceso de lectura a páginas, multimedia, formularios y logs.',
    permissions: [
      'media:view',
      'forms:view',
      'logs:view',
    ],
  },
];

export async function seedDatabase() {
  console.log('[SEED] Starting database RBAC seeding...');
  try {
    // 1. Insert/Update Permissions
    for (const perm of ALL_PERMISSIONS) {
      await db.insert(permissions)
        .values({
          id: perm.id,
          name: perm.name,
          description: perm.description,
        })
        .onConflictDoUpdate({
          target: permissions.id,
          set: {
            name: perm.name,
            description: perm.description,
          },
        });
    }
    console.log('[SEED] Permissions synchronized successfully.');

    // 2. Insert/Update Roles
    for (const r of DEFAULT_ROLES) {
      await db.insert(roles)
        .values({
          id: r.id,
          name: r.name,
          description: r.description,
        })
        .onConflictDoUpdate({
          target: roles.id,
          set: {
            name: r.name,
            description: r.description,
          },
        });

      // Synchronize role permissions
      // Clear existing for this role and insert fresh mapped records
      await db.delete(rolePermissions).where(sql`${rolePermissions.roleId} = ${r.id}`);
      
      const values = r.permissions.map((pId) => ({
        roleId: r.id,
        permissionId: pId,
      }));
      
      if (values.length > 0) {
        await db.insert(rolePermissions).values(values);
      }
    }
    console.log('[SEED] Roles and their permission mappings synchronized successfully.');

    // 3. Seed Default Owner User if no users exist, or set default password for existing users without hashes
    const userCountResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const userCount = Number(userCountResult[0]?.count || 0);

    const salt = await bcrypt.genSalt(10);
    const defaultHash = await bcrypt.hash('Admin123!', salt);

    if (userCount === 0) {
      console.log('[SEED] Seeding default owner user...');
      await db.insert(users).values({
        uid: 'owner-default-uid',
        username: 'admin_owner',
        email: 'angelleiva3hola@gmail.com',
        passwordHash: defaultHash,
        roleId: 'owner',
        status: 'active',
      });
      console.log('[SEED] Default owner user seeded successfully (email: angelleiva3hola@gmail.com, password: Admin123!)');
    } else {
      const existingUsers = await db.select().from(users);
      for (const u of existingUsers) {
        if (!u.passwordHash) {
          await db.update(users)
            .set({ passwordHash: defaultHash })
            .where(sql`${users.id} = ${u.id}`);
          console.log(`[SEED] Set default password Admin123! for user ${u.email}`);
        }
      }
    }
  } catch (error) {
    console.error('[SEED] Error seeding database:', error);
  }
}
