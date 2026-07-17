import express from 'express';
import { getDatabase } from '../db/database.js';

const router = express.Router();

// Listar todas as cotações
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { supplier_id, product_id, status } = req.query;
    
    let query = `
      SELECT q.*, s.name as supplier_name, p.name as product_name, p.category, p.unit
      FROM quotes q
      JOIN suppliers s ON q.supplier_id = s.id
      JOIN products p ON q.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    
    if (supplier_id) {
      query += ' AND q.supplier_id = ?';
      params.push(supplier_id);
    }
    
    if (product_id) {
      query += ' AND q.product_id = ?';
      params.push(product_id);
    }
    
    if (status) {
      query += ' AND q.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY q.created_at DESC';
    const quotes = await db.all(query, params);
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
    const quote = await db.get(
      `SELECT q.*, s.name as supplier_name, p.name as product_name, p.category, p.unit
       FROM quotes q
       JOIN suppliers s ON q.supplier_id = s.id
       JOIN products p ON q.product_id = p.id
       WHERE q.id = ?`,
      req.params.id
    );
    
    if (!quote) {
      return res.status(404).json({ error: 'Cotação não encontrada' });
    }
    res.json(quote);
  } catch (error) {
    console.error('Erro ao obter cotação:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar nova cotação
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { supplier_id, product_id, quantity, unit_price, delivery_date, payment_terms, validity_date, notes } = req.body;

    if (!supplier_id || !product_id || !quantity || unit_price === undefined) {
      return res.status(400).json({ error: 'Fornecedor, produto, quantidade e preço são obrigatórios' });
    }

    const total_price = quantity * unit_price;

    const result = await db.run(
      `INSERT INTO quotes (supplier_id, product_id, quantity, unit_price, total_price, delivery_date, payment_terms, validity_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [supplier_id, product_id, quantity, unit_price, total_price, delivery_date || null, payment_terms || null, validity_date || null, notes || null]
    );

    // Registrar no histórico de preços
    await db.run(
      `INSERT INTO price_history (supplier_id, product_id, quantity, unit_price, quote_id)
       VALUES (?, ?, ?, ?, ?)`,
      [supplier_id, product_id, quantity, unit_price, result.lastID]
    );

    res.status(201).json({ id: result.lastID, message: 'Cotação criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar cotação:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar cotação
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { quantity, unit_price, delivery_date, payment_terms, validity_date, notes, status } = req.body;

    const total_price = quantity && unit_price ? quantity * unit_price : undefined;

    let updateQuery = 'UPDATE quotes SET ';
    const updates = [];
    const params = [];

    if (quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    if (unit_price !== undefined) {
      updates.push('unit_price = ?');
      params.push(unit_price);
    }
    if (total_price !== undefined) {
      updates.push('total_price = ?');
      params.push(total_price);
    }
    if (delivery_date !== undefined) {
      updates.push('delivery_date = ?');
      params.push(delivery_date);
    }
    if (payment_terms !== undefined) {
      updates.push('payment_terms = ?');
      params.push(payment_terms);
    }
    if (validity_date !== undefined) {
      updates.push('validity_date = ?');
      params.push(validity_date);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    updateQuery += updates.join(', ') + ' WHERE id = ?';
    params.push(req.params.id);

    const result = await db.run(updateQuery, params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cotação não encontrada' });
    }

    res.json({ message: 'Cotação atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar cotação:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deletar cotação
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    
    // Deletar histórico de preços associado
    await db.run('DELETE FROM price_history WHERE quote_id = ?', req.params.id);
    
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