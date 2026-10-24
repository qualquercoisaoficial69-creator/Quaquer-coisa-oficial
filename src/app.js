import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './database/db.js';
import authRoutes from './routes/auth.js';
import gamesRoutes from './routes/games.js';
import postsRoutes from './routes/posts.js';
import commentsRoutes from './routes/comments.js';
import teamRoutes from './routes/team.js';
import feedbackRoutes from './routes/feedback.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos de mídia e uploads estáticos
const uploadDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Servir os arquivos do Frontend (pasta public)
const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

// Inicializar banco de dados SQLite / Turso
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (e) {
      console.warn('Inicialização do banco em andamento ou já concluída:', e.message);
    }
  }
  next();
});

// Status da API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    studio: 'Qualquer Coisa Rápido API & CMS',
    mode: process.env.TURSO_DATABASE_URL ? 'Turso Cloud' : 'SQLite Local',
    timestamp: new Date().toISOString()
  });
});

// Registro de rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/upload', uploadRoutes);

// Fallback de erro global
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ error: 'Erro interno no servidor.', details: err.message });
});

export default app;
