import { z } from 'zod';

// Block Schema validation for Page Content Blocks
export const BlockSchema = z.object({
  id: z.string().min(1, 'Block ID is required'),
  type: z.enum(['hero', 'text', 'features', 'gallery', 'form', 'image', 'video']),
  properties: z.record(z.string(), z.any()).default({}),
  order: z.number().default(0),
});

// Pages Validation Schema
export const PageValidationSchema = z.object({
  id: z.string().min(1, 'Page ID is required'),
  title: z.string().min(2, 'Title must be at least 2 characters long').max(100),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-_/]+$/, 'Slug must be valid slug alphanumeric format'),
  description: z.string().max(500).optional().nullable(),
  blocks: z.array(BlockSchema).default([]),
  isPublished: z.boolean().default(false),
});

// Users Validation Schema
export const UserValidationSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long').max(50),
  email: z.string().email('Invalid email address'),
  roleId: z.enum(['owner', 'editor', 'viewer']),
  status: z.enum(['active', 'inactive']).default('active'),
});

// Role Permissions Validation Schema
export const RolePermissionsValidationSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
  permissions: z.array(z.string()).nonempty('At least one permission must be selected'),
});

// Media Validation Schema
export const MediaValidationSchema = z.object({
  id: z.string().min(1, 'Media ID is required'),
  name: z.string().min(1, 'File name is required').max(255),
  size: z.string().min(1, 'File size is required'),
  type: z.string().min(1, 'File type mime is required'),
  fileBase64: z.string().optional(),
  url: z.string().url('Invalid URL format').optional(),
});

// Form Submissions Validation Schema
export const FormSubmissionValidationSchema = z.object({
  id: z.string().min(1, 'Submission ID is required'),
  formBlockId: z.string().min(1, 'Form Block ID is required'),
  formTitle: z.string().min(1, 'Form Title is required'),
  pageTitle: z.string().default('Página Pública'),
  data: z.record(z.string(), z.any()),
});

// Versions Validation Schema
export const VersionValidationSchema = z.object({
  id: z.string().min(1, 'Version ID is required'),
  pageId: z.string().min(1, 'Page ID is required'),
  version: z.number().int().positive('Version must be a positive integer'),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional().nullable(),
  blocks: z.array(BlockSchema).default([]),
  changeSummary: z.string().min(1, 'Change summary is required').max(255),
});
