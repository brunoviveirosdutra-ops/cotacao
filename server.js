import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

import { initDatabase } from './db/database.js';
import suppliersRouter from './routes/suppliers.js';
import productsRouter from './routes/products.js';
import quotesRouter from './routes/quotes.js';
import dashboardRouter from './routes/dashboard.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import exportRouter from './routes/export.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

/* ======================================================
   SEGURANÇA
====================================================== */

app.use(
  helmet({
    // Durante o desenvolvimento deixamos a CSP desabilitada.
    // Depois iremos habilitá-la corretamente.
    contentSecurityPolicy: false
  })
);

/* ======================================================
   COMPRESSÃO
====================================================== */

app.use(compression());

/* ======================================================
   CORS
====================================================== */

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  })
);

/* ======================================================
   LIMITADOR DE REQUISIÇÕES
====================================================== */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

/* ======================================================
   BODY PARSER
====================================================== */

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* ======================================================
   SESSÃO
====================================================== */

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'cotacao-secret-2026',
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

/* ======================================================
   ARQUIVOS ESTÁTICOS
====================================================== */

app.use(express.static(path.join(__dirname, 'public')));

/* ======================================================
   BANCO DE DADOS
====================================================== */

try {
  await initDatabase();
  console.log('✅ Banco de dados inicializado com sucesso');
} catch (erro) {
  console.error('❌ Erro ao inicializar o banco de dados');
  console.error(erro);
  process.exit(1);
}

/* ======================================================
   ROTAS DA API
====================================================== */

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/products', productsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/export', exportRouter);

/* ======================================================
   ROTA PRINCIPAL
====================================================== */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ======================================================
   404
====================================================== */

app.use((req, res) => {

  if (req.originalUrl.startsWith('/api')) {

    return res.status(404).json({
      success: false,
      message: 'Rota não encontrada'
    });

  }

  res.status(404).sendFile(
    path.join(__dirname, 'public', '404.html')
  );

});

/* ======================================================
   ERROS
====================================================== */

app.use((err, req, res, next) => {

  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });

});

/* ======================================================
   PROCESSO
====================================================== */

process.on('unhandledRejection', (err) => {
  console.error('❌ Promise rejeitada:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Exceção não tratada:', err);
});

/* ======================================================
   SERVIDOR
====================================================== */

app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 Servidor iniciado');
  console.log(`🌐 http://localhost:${PORT}`);
  console.log('========================================');
});

export default app;
