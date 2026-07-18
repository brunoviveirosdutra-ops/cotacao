import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';

const router = express.Router();

// Login do administrador
router.post('/login', async (req, res) => {
  try {
    const db = await getDatabase();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios'
      });
    }

    const admin = await db.get(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    );

    if (!admin) {
      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });
    }

    const senhaCorreta = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        error: 'Email ou senha inválidos'
      });
    }

    req.session.admin = {
      id: admin.id,
      name: admin.name,
      email: admin.email
    };

    res.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }
    });

  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      error: 'Erro interno'
    });
  }
});

// Verificar sessão do administrador
router.get('/me', (req, res) => {

  if (!req.session.admin) {
    return res.status(401).json({
      error: 'Não autenticado'
    });
  }

  res.json(req.session.admin);

});

// Logout
router.post('/logout', (req, res) => {

  delete req.session.admin;

  res.json({
    success: true
  });

});

export default router;