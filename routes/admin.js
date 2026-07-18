import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';

const router = express.Router();

// Login do administrador
router.post('/login', async (req, res) => {
  try {
    const db = await getDatabase();

    const { email, password } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios'
      });
    }

    const admin = await db.get(
      'SELECT * FROM admins WHERE email = ?',
      normalizedEmail
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

    // Regenera a sessão para evitar Session Fixation
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({
          error: 'Erro ao iniciar sessão'
        });
      }

      req.session.admin = {
        id: admin.id,
        name: admin.name,
        email: admin.email
      };

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email
        }
      });
    });

  } catch (error) {
    console.error('Erro no login do administrador:', error);

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Verificar sessão do administrador
router.get('/me', (req, res) => {

  if (!req.session?.admin) {
    return res.status(401).json({
      error: 'Não autenticado'
    });
  }

  res.json(req.session.admin);

});

// Logout
router.post('/logout', (req, res) => {

  req.session.destroy((err) => {

    if (err) {
      return res.status(500).json({
        error: 'Erro ao fazer logout'
      });
    }

    res.clearCookie('connect.sid');

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  });

});

export default router;