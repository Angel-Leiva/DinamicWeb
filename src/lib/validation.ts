import { z } from 'zod';

// Block Schema validation for Page Content Blocks
export const BlockSchema = z.object({
  id: z.string().min(1, 'Block ID is required'),
  type: z.enum([
    'text',
    'image',
    'video',
    'table',
    'chart',
    'kpi',
    'button',
    'form',
    'separator',
    'columns'
  ]),
  text: z.object({
    content: z.string(),
    style: z.enum(['heading-1', 'heading-2', 'body', 'quote', 'callout']),
    alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
  }).optional(),
  image: z.object({
    url: z.string(),
    caption: z.string().optional().nullable(),
    aspectRatio: z.enum(['square', 'video', 'auto', 'original', '16-9', '4-3', 'free']).optional(),
  }).optional(),
  video: z.object({
    url: z.string(),
    provider: z.enum(['youtube', 'vimeo', 'html5']).optional().nullable(),
  }).optional(),
  table: z.object({
    headers: z.array(z.string()).optional().nullable(),
    rows: z.array(z.any()).optional().nullable(),
    colCount: z.number().optional().nullable(),
    rowCount: z.number().optional().nullable(),
  }).optional(),
  chart: z.object({
    title: z.string(),
    chartType: z.enum(['bar', 'line', 'pie']),
    labels: z.array(z.string()),
    values: z.array(z.number()),
    color: z.string().optional().nullable(),
  }).optional(),
  kpi: z.object({
    label: z.string(),
    value: z.string(),
    change: z.string(),
    isPositive: z.boolean(),
    icon: z.string().optional().nullable(),
  }).optional(),
  button: z.object({
    label: z.string(),
    link: z.string(),
    style: z.enum(['primary', 'secondary', 'outline', 'danger']),
    size: z.enum(['sm', 'md', 'lg']),
  }).optional(),
  form: z.object({
    title: z.string(),
    submitLabel: z.string().optional().nullable(),
    fields: z.array(z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['text', 'textarea', 'email', 'number', 'date', 'checkbox', 'radio', 'select', 'multiselect', 'file']),
      required: z.boolean(),
      options: z.array(z.string()).optional().nullable(),
    })).optional().nullable(),
  }).optional(),
  separator: z.object({
    style: z.enum(['solid', 'dashed', 'dotted']),
    spacing: z.enum(['sm', 'md', 'lg']),
  }).optional(),
  columns: z.object({
    layout: z.string(),
    cols: z.array(z.any()),
  }).optional(),
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
  password: z.string().min(6, 'Password must be at least 6 characters').optional().nullable(),
  confirmPassword: z.string().optional().nullable(),
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
