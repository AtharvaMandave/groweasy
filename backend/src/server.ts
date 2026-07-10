import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import importRoute from './routes/import.route';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Support multiple allowed origins via comma-separated ALLOWED_ORIGINS env var.
// Falls back to ALLOWED_ORIGIN (singular) for backward compatibility, then localhost.
const rawOrigins = process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
const ALLOWED_ORIGINS = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

// ─── Middleware ───
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!requestOrigin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${requestOrigin}' not allowed`));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json({ limit: '1mb' }));

// Rate limiting: 20 imports per 15 minutes per IP
app.use(
  '/api/import',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
      success: false,
      error: 'Too many import requests. Please try again later.',
    },
  })
);

// ─── Routes ───
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    model: 'llama-3.3-70b-versatile',
    provider: 'groq',
  });
});

app.use('/api/import', importRoute);

// ─── Error handler (must be after routes) ───
app.use(errorHandler);

// ─── Start server ───
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 GrowEasy CSV Importer API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
    console.log(`   AI Model:     Llama 3.3 70B (Groq)\n`);
  });
}

export default app;
