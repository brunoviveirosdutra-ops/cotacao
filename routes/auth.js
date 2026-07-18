import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';

const router = express.Router();

// Registrar novo fornecedor
router.post('/register', async (req, res) => {
  try {
    const db = await getDatabase();

    const { name, email, phone, password, confirmPassword } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    // Validações
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        error: 'Nome, email e senha são obrigatórios'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Senhas não conferem'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Senha deve ter no mínimo 6 caracteres'
      });
    }

    // Verificar se email já existe
    const existingSupplier = await db.get(
      'SELECT id FROM suppliers WHERE email = ?',
      normalizedEmail
    );

    if (existingSupplier) {
      return res.status(400).json({
        error: 'Email já cadastrado'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar fornecedor
    const result = await db.run(
      `INSERT INTO suppliers (name, email, password_hash, phone, status)
       VALUES (?, ?, ?, ?, 'ativo')`,
      [
        name.trim(),
        normalizedEmail,
        hashedPassword,
        phone?.trim() || null
      ]
    );

    res.status(201).json({
      message: 'Fornecedor registrado com sucesso',
      supplierId: result.lastID
    });

  } catch (error) {
    console.error('Erro ao registrar fornecedor:', error);

    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({
        error: 'Email ou nome já existe'
      });
    }

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Login do fornecedor
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

    // Buscar fornecedor
    const supplier = await db.get(
      `SELECT id, name, email, password_hash
       FROM suppliers
       WHERE email = ?`,
      normalizedEmail
    );

    if (!supplier) {
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(
      password,
      supplier.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    // Regenerar sessão (proteção contra Session Fixation)
    req.session.regenerate((err) => {

      if (err) {
        return res.status(500).json({
          error: 'Erro ao iniciar sessão'
        });
      }

      req.session.supplierId = supplier.id;
      req.session.supplierName = supplier.name;
      req.session.supplierEmail = supplier.email;

      res.json({
        message: 'Login realizado com sucesso',
        supplier: {
          id: supplier.id,
          name: supplier.name,
          email: supplier.email
        }
      });

    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);

    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Dados do fornecedor autenticado
router.get('/me', (req, res) => {

  if (!req.session?.supplierId) {
    return res.status(401).json({
      error: 'Não autenticado'
    });
  }

  res.json({
    id: req.session.supplierId,
    name: req.session.supplierName,
    email: req.session.supplierEmail
  });

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
      message: 'Logout realizado com sucesso'
    });

  });

});

export default router;