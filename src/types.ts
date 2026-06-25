/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BlockType =
  | 'text'
  | 'image'
  | 'video'
  | 'table'
  | 'chart'
  | 'kpi'
  | 'button'
  | 'form'
  | 'separator'
  | 'columns';

export interface ColumnData {
  id: string;
  blocks: Block[];
}

export interface Block {
  id: string;
  type: BlockType;
  // Block-specific settings
  text?: {
    content: string;
    style: 'heading-1' | 'heading-2' | 'body' | 'quote' | 'callout';
    alignment: 'left' | 'center' | 'right';
  };
  image?: {
    url: string;
    caption: string;
    aspectRatio: 'square' | 'video' | 'auto';
  };
  video?: {
    url: string; // YouTube, Vimeo, or MP4 url
    provider: 'youtube' | 'vimeo' | 'html5';
  };
  table?: {
    headers: string[];
    rows: string[][];
  };
  chart?: {
    title: string;
    chartType: 'bar' | 'line' | 'pie';
    labels: string[];
    values: number[];
    color: string;
  };
  kpi?: {
    label: string;
    value: string;
    change: string; // e.g. "+15% vs last month"
    isPositive: boolean;
    icon: string;
  };
  button?: {
    label: string;
    link: string;
    style: 'primary' | 'secondary' | 'outline' | 'danger';
    size: 'sm' | 'md' | 'lg';
  };
  form?: {
    title: string;
    submitLabel: string;
    fields: {
      id: string;
      label: string;
      type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox';
      required: boolean;
      options?: string[]; // for select
    }[];
  };
  separator?: {
    style: 'solid' | 'dashed' | 'dotted';
    spacing: 'sm' | 'md' | 'lg';
  };
  columns?: {
    layout: '1-1' | '1-2' | '2-1' | '1-1-1';
    cols: ColumnData[];
  };
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  blocks: Block[];
  version: number;
}

export interface PageVersion {
  id: string;
  pageId: string;
  version: number;
  title: string;
  slug: string;
  description: string;
  blocks: Block[];
  createdAt: string;
  createdBy: string; // user name/email
  changeSummary: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
}

export interface User {
  id: string;
  username: string;
  email: string;
  roleId: string; // Role ID
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string; // e.g., 'image/png', 'video/mp4'
  createdAt: string;
}

export interface FormSubmission {
  id: string;
  formBlockId: string;
  formTitle: string;
  pageTitle: string;
  data: Record<string, any>;
  submittedAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
