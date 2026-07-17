import express from 'express';
import { getDatabase } from '../db/database.js';

const router = express.Router();

// Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { category } = req.query;
    
    let query = 'SELECT * FROM products';
    const params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY name';
    const products = await db.all(query, params);
    res.json(products);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter um produto específico
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const product = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar novo produto
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, category, description, unit, min_order_quantity, status } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
    }

    if (!['carne', 'frango'].includes(category)) {
      return res.status(400).json({ error: 'Categoria inválida. Use: carne ou frango' });
    }

    const result = await db.run(
      `INSERT INTO products (name, category, description, unit, min_order_quantity, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, category, description || null, unit || 'kg', min_order_quantity || null, status || 'ativo']
    );

    res.status(201).json({ id: result.lastID, message: 'Produto criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Produto já existe' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Atualizar produto
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, category, description, unit, min_order_quantity, status } = req.body;

    const result = await db.run(
      `UPDATE products SET name = ?, category = ?, description = ?, unit = ?, min_order_quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, description, unit, min_order_quantity, status, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar produto
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM products WHERE id = ?', req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;