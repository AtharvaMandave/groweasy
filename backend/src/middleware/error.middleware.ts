import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

/**
 * Global error handling middleware.
 * Catches Multer errors, validation errors, and unexpected errors.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err.message);

  // Multer file upload errors
  if (err instanceof MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        res.status(413).json({
          success: false,
          error: 'File too large. Maximum size is 10MB.',
        });
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        res.status(400).json({
          success: false,
          error: 'Unexpected file field. Use "file" as the form field name.',
        });
        return;
      default:
        res.status(400).json({
          success: false,
          error: `File upload error: ${err.message}`,
        });
        return;
    }
  }

  // Custom validation errors (from multer fileFilter)
  if (err.message === 'Only CSV files are allowed') {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Generic error
  res.status(500).json({
    success: false,
    error: 'Internal server error. Please try again.',
  });
}
