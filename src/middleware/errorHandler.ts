import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, statusCode = 500, details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Clean, structured error logging for production audit and debugging
  console.error(`[ERROR] [${req.method}] ${req.path} - StatusCode: ${statusCode} - Message: ${message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    details: err.details || null,
    // Avoid exposing raw stack traces in production environment
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}
