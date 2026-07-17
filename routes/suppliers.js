import express from 'express';
import { getDatabase } from '../db/database.js';

const router = express.Router();

// Listar todos os fornecedores
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const suppliers = await db.all('SELECT * FROM suppliers ORDER BY name');
    res.json(suppliers);
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter um fornecedor específico
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const supplier = await db.get('SELECT * FROM suppliers WHERE id = ?', req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    res.json(supplier);
  } catch (error) {
    console.error('Erro ao obter fornecedor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar novo fornecedor
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, email, phone, address, city, state, zip_code, cnpj, contact_person, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const result = await db.run(
      `INSERT INTO suppliers (name, email, phone, address, city, state, zip_code, cnpj, contact_person, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email || null, phone || null, address || null, city || null, state || null, zip_code || null, cnpj || null, contact_person || null, status || 'ativo']
    );

    res.status(201).json({ id: result.lastID, message: 'Fornecedor criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Nome ou CNPJ já existe' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Atualizar fornecedor
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

// Deletar fornecedor
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