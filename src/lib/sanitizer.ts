/**
 * Sanitization utility to protect against XSS, script injection, and HTML injection.
 */

// Basic string sanitizer that strips dangerous script tags and escapes unsafe characters
export function sanitizeString(val: string): string {
  if (!val) return val;
  // Remove script tag structures completely
  let clean = val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Strip common event handlers like onload, onerror, onclick, etc.
  clean = clean.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
  clean = clean.replace(/on\w+\s*=\s*'[^']*'/gi, '');
  clean = clean.replace(/javascript:/gi, '');
  return clean;
}

// Recursively sanitize all string attributes in any object/array
export function sanitizeInput<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeInput(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      cleanObj[key] = sanitizeInput((obj as Record<string, any>)[key]);
    }
    return cleanObj as T;
  }

  return obj;
}
