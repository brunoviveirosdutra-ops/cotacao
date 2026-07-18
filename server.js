import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'seu-segredo-super-secreto-mude-em-producao',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Mude para true em produção com HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializar banco de dados
await initDatabase();

// Rotas da API
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/products', productsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/export', exportRouter);

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

export default app;
