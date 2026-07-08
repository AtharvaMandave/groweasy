import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import importRoute from './routes/import.route';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

// ─── Middleware ───
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
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
    console.log(`   CORS origin:  ${ALLOWED_ORIGIN}`);
    console.log(`   AI Model:     Llama 3.3 70B (Groq)\n`);
  });
}

export default app;
