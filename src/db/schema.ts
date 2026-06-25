import { pgTable, text, timestamp, boolean, integer, jsonb, serial, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define roles table
export const roles = pgTable('roles', {
  id: text('id').primaryKey(), // 'owner', 'editor', 'viewer'
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define permissions table
export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(), // 'pages:create', etc.
  name: text('name').notNull(),
  description: text('description'),
});

// Role-Permissions bridge table
export const rolePermissions = pgTable('role_permissions', {
  roleId: text('role_id')
    .references(() => roles.id, { onDelete: 'cascade' })
    .notNull(),
  permissionId: text('permission_id')
    .references(() => permissions.id, { onDelete: 'cascade' })
    .notNull(),
}, (t) => [
  primaryKey({ columns: [t.roleId, t.permissionId] })
]);

// Define users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Custom User UID
  username: text('username').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  roleId: text('role_id')
    .references(() => roles.id)
    .notNull(),
  status: text('status', { enum: ['active', 'inactive'] }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define refresh_tokens table for session rotation
export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define pages table
export const pages = pgTable('pages', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  isPublished: boolean('is_published').default(false).notNull(),
  blocks: jsonb('blocks').default('[]').notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define page_versions table
export const pageVersions = pgTable('page_versions', {
  id: text('id').primaryKey(),
  pageId: text('page_id')
    .references(() => pages.id, { onDelete: 'cascade' })
    .notNull(),
  version: integer('version').notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  blocks: jsonb('blocks').default('[]').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(), // User's username/email
  changeSummary: text('change_summary').notNull(),
});

// Define media_files table
export const mediaFiles = pgTable('media_files', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  size: text('size').notNull(),
  type: text('type').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define form_submissions table
export const formSubmissions = pgTable('form_submissions', {
  id: text('id').primaryKey(),
  formBlockId: text('form_block_id').notNull(),
  formTitle: text('form_title').notNull(),
  pageTitle: text('page_title').notNull(),
  data: jsonb('data').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

// Define activity_logs table
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  user: text('user').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
});

// Relations definitions
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  permissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

export const pagesRelations = relations(pages, ({ many }) => ({
  versions: many(pageVersions),
}));

export const pageVersionsRelations = relations(pageVersions, ({ one }) => ({
  page: one(pages, {
    fields: [pageVersions.pageId],
    references: [pages.id],
  }),
}));
