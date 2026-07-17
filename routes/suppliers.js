import express from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';
import { authenticateSupplier } from '../middleware/auth.js';

const router = express.Router();

// Listar todos os fornecedores (ADMIN)
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const suppliers = await db.all('SELECT id, name, email, phone, city, status, created_at FROM suppliers ORDER BY name');
    res.json(suppliers);
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter dados do fornecedor autenticado
router.get('/me/profile', authenticateSupplier, async (req, res) => {
  try {
    const db = await getDatabase();
    const supplier = await db.get(
      'SELECT id, name, email, phone, address, city, state, zip_code, cnpj, contact_person, status, created_at FROM suppliers WHERE id = ?',
      req.supplierId
    );
    if (!supplier) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json(supplier);
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar perfil do fornecedor autenticado
router.put('/me/profile', authenticateSupplier, async (req, res) => {
  try {
    const db = await getDatabase();
    const { phone, address, city, state, zip_code, cnpj, contact_person } = req.body;

    const result = await db.run(
      `UPDATE suppliers SET phone = ?, address = ?, city = ?, state = ?, zip_code = ?, cnpj = ?, contact_person = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [phone || null, address || null, city || null, state || null, zip_code || null, cnpj || null, contact_person || null, req.supplierId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar novo fornecedor (ADMIN)
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, email, phone, address, city, state, zip_code, cnpj, contact_person, status, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    // Verificar se email já existe
    const existingSupplier = await db.get('SELECT id FROM suppliers WHERE email = ?', email);
    if (existingSupplier) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha (se não fornecida, gera uma aleatória)
    const pwd = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(pwd, 10);

    const result = await db.run(
      `INSERT INTO suppliers (name, email, password_hash, phone, address, city, state, zip_code, cnpj, contact_person, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, phone || null, address || null, city || null, state || null, zip_code || null, cnpj || null, contact_person || null, status || 'ativo']
    );

    res.status(201).json({ id: result.lastID, message: 'Fornecedor criado com sucesso', password: pwd });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Nome ou email já existe' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Obter um fornecedor específico (ADMIN)
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const supplier = await db.get('SELECT id, name, email, phone, address, city, state, zip_code, cnpj, contact_person, status, created_at FROM suppliers WHERE id = ?', req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json(supplier);
  } catch (error) {
    console.error('Erro ao obter fornecedor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar fornecedor (ADMIN)
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, email, phone, address, city, state, zip_code, cnpj, contact_person, status } = req.body;

    const result = await db.run(
      `UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, zip_code = ?, cnpj = ?, contact_person = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, email, phone, address, city, state, zip_code, cnpj, contact_person, status, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    res.json({ message: 'Fornecedor atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar fornecedor (ADMIN)
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM suppliers WHERE id = ?', req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    res.json({ message: 'Fornecedor deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
