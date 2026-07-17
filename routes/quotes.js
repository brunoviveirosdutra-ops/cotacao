import express from 'express';
import { getDatabase } from '../db/database.js';
import { authenticateSupplier } from '../middleware/auth.js';

const router = express.Router();

// Listar todas as cotações (ADMIN)
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const quotes = await db.all(`
      SELECT q.*, s.name as supplier_name, p.name as product_name
      FROM quotes q
      JOIN suppliers s ON q.supplier_id = s.id
      JOIN products p ON q.product_id = p.id
      ORDER BY q.created_at DESC
    `);
    res.json(quotes);
  } catch (error) {
    console.error('Erro ao listar cotações:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar cotações do fornecedor autenticado
router.get('/supplier/my-quotes', authenticateSupplier, async (req, res) => {
  try {
    const db = await getDatabase();
    const quotes = await db.all(`
      SELECT q.*, p.name as product_name, p.category, p.unit
      FROM quotes q
      JOIN products p ON q.product_id = p.id
      WHERE q.supplier_id = ?
      ORDER BY q.created_at DESC
    `, req.supplierId);
    res.json(quotes);
  } catch (error) {
    console.error('Erro ao listar cotações:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter uma cotação específica
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const quote = await db.get(`
      SELECT q.*, s.name as supplier_name, s.email, s.phone, p.name as product_name
      FROM quotes q
      JOIN suppliers s ON q.supplier_id = s.id
      JOIN products p ON q.product_id = p.id
      WHERE q.id = ?
    `, req.params.id);
    
    if (!quote) {
      return res.status(404).json({ error: 'Cotação não encontrada' });
    }
    
    res.json(quote);
  } catch (error) {
    console.error('Erro ao obter cotação:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar nova cotação (ADMIN)
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { supplier_id, product_id, quantity, unit_price, delivery_date, payment_terms, validity_date, notes } = req.body;

    if (!supplier_id || !product_id || !quantity || !unit_price) {
      return res.status(400).json({ error: 'Fornecedor, produto, quantidade e preço são obrigatórios' });
    }

    const total_price = quantity * unit_price;

    const result = await db.run(
      `INSERT INTO quotes (supplier_id, product_id, quantity, unit_price, total_price, delivery_date, payment_terms, validity_date, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativa')`,
      [supplier_id, product_id, quantity, unit_price, total_price, delivery_date || null, payment_terms || null, validity_date || null, notes || null]
    );

    res.status(201).json({ id: result.lastID, message: 'Cotação criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar cotação:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar cotação (ADMIN)
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { quantity, unit_price, delivery_date, payment_terms, validity_date, notes, status } = req.body;

    const total_price = quantity && unit_price ? quantity * unit_price : null;

    const result = await db.run(
      `UPDATE quotes SET quantity = ?, unit_price = ?, total_price = ?, delivery_date = ?, payment_terms = ?, validity_date = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [quantity, unit_price, total_price, delivery_date || null, payment_terms || null, validity_date || null, notes || null, status, req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cotação não encontrada' });
    }

    res.json({ message: 'Cotação atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar cotação:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fornecedor atualiza status da cotação (aceita/rejeita)
router.put('/:id/supplier/status', authenticateSupplier, async (req, res) => {
  try {
    const db = await getDatabase();
    const { status } = req.body;

    if (!['aceita', 'rejeitada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use "aceita" ou "rejeitada"' });
    }

    // Verificar se a cotação pertence ao fornecedor
    const quote = await db.get('SELECT supplier_id FROM quotes WHERE id = ?', req.params.id);
    if (!quote || quote.supplier_id !== req.supplierId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const result = await db.run(
      `UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND supplier_id = ?`,
      [status, req.params.id, req.supplierId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cotação não encontrada' });
    }

    res.json({ message: `Cotação ${status} com sucesso` });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar cotação (ADMIN)
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM quotes WHERE id = ?', req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cotação não encontrada' });
    }

    res.json({ message: 'Cotação deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cotação:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
