import express from 'express';
import path from 'path';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { requireAuth, requirePermission, AuthRequest } from './src/middleware/auth.ts';
import {
  getPagesList,
  createPageRecord,
  updatePageRecord,
  deletePageRecord,
  getPageVersionsList,
  createVersionRecord,
  getFormSubmissionsList,
  createFormSubmissionRecord
} from './src/db/services/pages.ts';
import {
  getAllRoles,
  getAllPermissions,
  updateRolePermissions,
  getAllUsers,
  createStaffUser,
  updateStaffUserRole,
  deleteStaffUser
} from './src/db/services/rbac.ts';
import { getActivityLogsList, createLogRecord } from './src/db/services/logs.ts';
import { getMediaFilesList, createMediaFileRecord, deleteMediaFileRecord } from './src/db/services/media.ts';

// 1. Production Hardening Imports
import { 
  globalLimiter, 
  authLimiter, 
  usersLimiter, 
  pagesLimiter, 
  mediaLimiter 
} from './src/middleware/rateLimiter.ts';
import { 
  PageValidationSchema, 
  UserValidationSchema, 
  RolePermissionsValidationSchema,
  MediaValidationSchema,
  FormSubmissionValidationSchema,
  VersionValidationSchema 
} from './src/lib/validation.ts';
import { sanitizeInput } from './src/lib/sanitizer.ts';
import { errorHandler, AppError } from './src/middleware/errorHandler.ts';
import { seedDatabase } from './src/db/seed.ts';
import { uploadMediaFile } from './src/db/services/mediaStorage.ts';
import { validateExternalUrl } from './src/lib/urlValidator.ts';
import { db } from './src/db/index.ts';
import cookieParser from 'cookie-parser';
import {
  loginUser,
  logoutUser,
  refreshUserSession,
  changeUserPassword,
  requestPasswordRecovery
} from './src/db/services/authService.ts';

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Run database migrations on startup to create tables if they do not exist
  try {
    console.log('[STARTUP] Running database migrations...');
    await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
    console.log('[STARTUP] Database migrations completed successfully.');
  } catch (migErr) {
    console.error('[STARTUP] Database migrations failed:', migErr);
  }

  // Run database seeding on startup to ensure production RBAC exists
  try {
    await seedDatabase();
  } catch (seedErr) {
    console.error('[STARTUP] RBAC Seeding failed:', seedErr);
  }

  // --- SECURITY HEADERS (HELMET) ---
  // Configure Helmet with iframe compatibility for the AI Studio live preview
  app.use(
    helmet({
      contentSecurityPolicy: false, // CSP configured false to prevent blocking live assets and external Unsplash CDNs in iframe preview
      frameguard: false, // frameguard false allows rendering within the AI Studio workspace preview pane iframe
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Global rate limiter
  app.use(globalLimiter);

  // Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // --- LOCAL STATIC ASSETS ROUTING FOR UPLOADS FALLBACK ---
  const localUploadsPath = path.join(process.cwd(), 'dist', 'uploads');
  app.use('/uploads', express.static(localUploadsPath));

  // --- API ROUTES ---

  // Enhanced Health Check
  app.get('/api/health', async (req, res, next) => {
    try {
      // 1. PostgreSQL check
      let dbStatus = 'disconnected';
      try {
        await db.execute(sql`SELECT 1`);
        dbStatus = 'connected';
      } catch (dbErr: any) {
        console.error('[HEALTH] PostgreSQL Check failed:', dbErr.message);
      }

      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      const isHealthy = dbStatus === 'connected';

      res.status(isHealthy ? 200 : 500).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        database: dbStatus,
        uptime: `${Math.floor(uptime)}s`,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // URL Verification Endpoint for Visual Editor Blocks
  app.post('/api/validate-url', requireAuth, async (req, res, next) => {
    try {
      const sanitizedBody = sanitizeInput(req.body);
      const { url, expectedType } = sanitizedBody;

      if (!url) {
        throw new AppError('La URL es requerida.', 400);
      }

      const result = await validateExternalUrl(url, expectedType || 'any');
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // 1. LOGIN
  app.post('/api/auth/login', authLimiter, async (req, res, next) => {
    try {
      const { emailOrUsername, password } = req.body;
      const { user, accessToken, refreshToken } = await loginUser(emailOrUsername, password);

      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 mins
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      await createLogRecord(
        user.email,
        'Authentication',
        `Inició sesión exitosamente (custom auth).`
      );

      res.json({ user, accessToken, refreshToken });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Credenciales inválidas.' });
    }
  });

  // 2. LOGOUT
  app.post('/api/auth/logout', async (req, res, next) => {
    try {
      const token = req.cookies.refresh_token || req.body.refreshToken;
      if (token) {
        await logoutUser(token);
      }

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      res.json({ success: true, message: 'Sesión cerrada exitosamente.' });
    } catch (error: any) {
      next(error);
    }
  });

  // 3. REFRESH SESSION
  app.post('/api/auth/refresh', async (req, res, next) => {
    try {
      const token = req.cookies.refresh_token || req.body.refreshToken;
      if (!token) {
        return res.status(401).json({ error: 'Refresh token is required' });
      }

      const { user, accessToken, refreshToken } = await refreshUserSession(token);

      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ user, accessToken, refreshToken });
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Error al refrescar token.' });
    }
  });

  // 4. CHANGE PASSWORD
  app.post('/api/auth/change-password', requireAuth, async (req: AuthRequest, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: 'Usuario no identificado' });
      }

      await changeUserPassword(uid, currentPassword, newPassword);

      await createLogRecord(
        req.user?.email || 'Unknown',
        'Authentication',
        `Cambió su contraseña exitosamente.`
      );

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      res.json({ success: true, message: 'Contraseña cambiada exitosamente. Por favor, vuelva a iniciar sesión.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al cambiar contraseña.' });
    }
  });

  // 5. RECOVER PASSWORD
  app.post('/api/auth/recover-password', async (req, res, next) => {
    try {
      const { email } = req.body;
      const result = await requestPasswordRecovery(email);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error en recuperación.' });
    }
  });

  // Auth synchronization (GET /api/auth/me)
  app.get('/api/auth/me', authLimiter, requireAuth, async (req: AuthRequest, res, next) => {
    try {
      await createLogRecord(
        req.user?.email || 'Unknown',
        'Authentication',
        `User ${req.user?.username} verified via custom JWT.`
      );
      res.json({ user: req.user });
    } catch (error) {
      next(error);
    }
  });

  // --- PAGES ENDPOINTS ---
  app.get('/api/pages', async (req, res, next) => {
    try {
      const list = await getPagesList();
      res.json(list);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/pages', pagesLimiter, requireAuth, requirePermission('pages:create'), async (req: AuthRequest, res, next) => {
    try {
      // 1. Strip potentially harmful XSS characters
      const sanitizedBody = sanitizeInput(req.body);
      
      // 2. Strong type validation using Zod
      const parseResult = PageValidationSchema.safeParse(sanitizedBody);
      if (!parseResult.success) {
        throw new AppError('Validación de página fallida', 400, parseResult.error.flatten());
      }

      const { id, title, slug, description, blocks } = parseResult.data;

      const newPage = await createPageRecord(id, title, slug, description || '', blocks);
      await createLogRecord(
        req.user?.email || 'System',
        'Page Creation',
        `Created page '${title}' with slug '${slug}'`
      );

      res.status(201).json(newPage);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/pages/:id', pagesLimiter, requireAuth, requirePermission('pages:edit'), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const sanitizedBody = sanitizeInput(req.body);

      // Validate inputs
      const parseResult = PageValidationSchema.partial().safeParse(sanitizedBody);
      if (!parseResult.success) {
        throw new AppError('Validación de actualización fallida', 400, parseResult.error.flatten());
      }

      const updatedPage = await updatePageRecord(id, parseResult.data);
      await createLogRecord(
        req.user?.email || 'System',
        'Page Update',
        `Updated page ${id}: ${Object.keys(parseResult.data).join(', ')}`
      );

      res.json(updatedPage);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/pages/:id', pagesLimiter, requireAuth, requirePermission('pages:delete'), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await deletePageRecord(id);
      await createLogRecord(
        req.user?.email || 'System',
        'Page Deletion',
        `Deleted page ID ${id}`
      );
      res.json(deleted);
    } catch (error) {
      next(error);
    }
  });

  // --- VERSIONS ENDPOINTS ---
  app.get('/api/versions/:pageId', requireAuth, async (req, res, next) => {
    try {
      const { pageId } = req.params;
      const list = await getPageVersionsList(pageId);
      res.json(list);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/versions', pagesLimiter, requireAuth, requirePermission('pages:publish'), async (req: AuthRequest, res, next) => {
    try {
      const sanitizedBody = sanitizeInput(req.body);
      const parseResult = VersionValidationSchema.safeParse(sanitizedBody);
      if (!parseResult.success) {
        throw new AppError('Validación de versión de página fallida', 400, parseResult.error.flatten());
      }

      const { id, pageId, version, title, slug, description, blocks, changeSummary } = parseResult.data;
      const creator = req.user?.username || req.user?.email || 'Unknown';
      
      const newVersion = await createVersionRecord(
        id,
        pageId,
        version,
        title,
        slug,
        description || '',
        blocks,
        creator,
        changeSummary
      );

      await createLogRecord(
        req.user?.email || 'System',
        'Page Version Snapshot',
        `Saved version snapshot v${version} for page '${title}'`
      );

      res.status(201).json(newVersion);
    } catch (error) {
      next(error);
    }
  });

  // --- SUBMISSIONS ENDPOINTS ---
  app.get('/api/submissions', requireAuth, requirePermission('forms:view'), async (req: AuthRequest, res, next) => {
    try {
      const list = await getFormSubmissionsList();
      res.json(list);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/submissions', async (req, res, next) => {
    try {
      const sanitizedBody = sanitizeInput(req.body);
      const parseResult = FormSubmissionValidationSchema.safeParse(sanitizedBody);
      if (!parseResult.success) {
        throw new AppError('Validación de envío de formulario fallida', 400, parseResult.error.flatten());
      }

      const { id, formBlockId, formTitle, pageTitle, data } = parseResult.data;

      const submission = await createFormSubmissionRecord(id, formBlockId, formTitle, pageTitle, data);
      res.status(201).json(submission);
    } catch (error) {
      next(error);
    }
  });

  // --- LOGS / AUDITING ENDPOINTS ---
  app.get('/api/logs', requireAuth, requirePermission('logs:view'), async (req: AuthRequest, res, next) => {
    try {
      const list = await getActivityLogsList();
      res.json(list);
    } catch (error) {
      next(error);
    }
  });

  // --- STAFF / USERS MANAGEMENT ENDPOINTS ---
  app.get('/api/users', usersLimiter, requireAuth, requirePermission('admins:manage'), async (req: AuthRequest, res, next) => {
    try {
      const list = await getAllUsers();
      res.json(list);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/users', usersLimiter, requireAuth, requirePermission('admins:manage'), async (req: AuthRequest, res, next) => {
    try {
      const sanitizedBody = sanitizeInput(req.body);
      const parseResult = UserValidationSchema.safeParse(sanitizedBody);
      if (!parseResult.success) {
        throw new AppError('Validación de usuario del sistema fallida', 400, parseResult.error.flatten());
      }

      const { username, email, roleId } = parseResult.data;

      const newUser = await createStaffUser(username, email, roleId);
      await createLogRecord(
        req.user?.email || 'System',
        'Staff Creation',
        `Created staff user '${username}' (${email}) with role '${roleId}'`
      );

      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/users/:uid/role', usersLimiter, requireAuth, requirePermission('admins:manage'), async (req: AuthRequest, res, next) => {
    try {
      const { uid } = req.params;
      const sanitizedBody = sanitizeInput(req.body);
      const { roleId } = sanitizedBody;

      if (!roleId || !['owner', 'editor', 'viewer'].includes(roleId)) {
        throw new AppError('Rol inválido o faltante', 400);
      }

      const updated = await updateStaffUserRole(uid, roleId);
      await createLogRecord(
        req.user?.email || 'System',
        'Staff Role Update',
        `Updated role for user UID ${uid} to '${roleId}'`
      );

      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/users/:uid', usersLimiter, requireAuth, requirePermission('admins:manage'), async (req: AuthRequest, res, next) => {
    try {
      const { uid } = req.params;
      
      // Prevent deleting self
      if (req.user?.uid === uid) {
        throw new AppError('No puedes eliminar tu propio usuario activo', 400);
      }

      const deleted = await deleteStaffUser(uid);
      await createLogRecord(
        req.user?.email || 'System',
        'Staff Deletion',
        `Removed staff user UID ${uid}`
      );

      res.json(deleted);
    } catch (error) {
      next(error);
    }
  });

  // --- ROLES & PERMISSIONS ENDPOINTS ---
  app.get('/api/roles', requireAuth, requirePermission('admins:manage'), async (req: AuthRequest, res, next) => {
    try {
      const list = await getAllRoles();
      const formatted = list.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description || '',
        permissions: role.permissions.map((p) => p.permissionId),
      }));
      res.json(formatted);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/permissions', requireAuth, requirePermission('admins:manage'), async (req: AuthRequest, res, next) => {
    try {
      const list = await getAllPermissions();
      res.json(list);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/roles/:roleId/permissions', requireAuth, requirePermission('admins:manage'), async (req: AuthRequest, res, next) => {
    try {
      const { roleId } = req.params;
      const sanitizedBody = sanitizeInput(req.body);
      
      const parseResult = RolePermissionsValidationSchema.safeParse({
        roleId,
        permissions: sanitizedBody.permissions,
      });

      if (!parseResult.success) {
        throw new AppError('Validación de actualización de rol fallida', 400, parseResult.error.flatten());
      }

      const { permissions } = parseResult.data;

      await updateRolePermissions(roleId, permissions);
      await createLogRecord(
        req.user?.email || 'System',
        'Security Alteration',
        `Updated permissions for role '${roleId}' to [${permissions.join(', ')}]`
      );

      res.json({ success: true, roleId, permissions });
    } catch (error) {
      next(error);
    }
  });

  // --- MEDIA LIBRARY ENDPOINTS ---
  app.get('/api/media', requireAuth, requirePermission('media:view'), async (req: AuthRequest, res, next) => {
    try {
      const list = await getMediaFilesList();
      res.json(list);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/media', mediaLimiter, requireAuth, requirePermission('media:upload'), async (req: AuthRequest, res, next) => {
    try {
      const sanitizedBody = sanitizeInput(req.body);
      const parseResult = MediaValidationSchema.safeParse(sanitizedBody);
      if (!parseResult.success) {
        throw new AppError('Validación de archivo multimedia fallida', 400, parseResult.error.flatten());
      }

      const { id, name, size, type, fileBase64, url } = parseResult.data;

      let finalUrl = url || '';

      // Perform real storage upload if fileBase64 is provided
      if (fileBase64) {
        finalUrl = await uploadMediaFile(name, fileBase64, type);
      } else if (!finalUrl) {
        throw new AppError('Debe proporcionar un archivo (base64) o una URL válida de recurso.', 400);
      }

      const mediaRecord = await createMediaFileRecord(id, name, finalUrl, size, type);
      await createLogRecord(
        req.user?.email || 'System',
        'Media Upload',
        `Uploaded file '${name}' (${size}, type: ${type})`
      );

      res.status(201).json(mediaRecord);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/media/:id', mediaLimiter, requireAuth, requirePermission('media:delete'), async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await deleteMediaFileRecord(id);
      await createLogRecord(
        req.user?.email || 'System',
        'Media Deletion',
        `Deleted media file ID ${id}`
      );
      res.json(deleted);
    } catch (error) {
      next(error);
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- GLOBAL ERROR MIDDLEWARE ---
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
