import { rateLimit } from 'express-rate-limit';

// Global rate limiter for general endpoints
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 'error',
    message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.'
  }
});

// Authentication and session rate limiter (Stricter, protects against brute-force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Demasiados intentos de autenticación. Intente nuevamente en 15 minutos.'
  }
});

// Users management rate limiter
export const usersLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Límite de peticiones de gestión de usuarios alcanzado.'
  }
});

// Pages and CMS publishing rate limiter
export const pagesLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Límite de actualización de páginas alcanzado.'
  }
});

// Media library operations rate limiter
export const mediaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Límite de operaciones multimedia alcanzado.'
  }
});
