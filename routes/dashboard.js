import express from 'express';
import { getDatabase } from '../db/database.js';

const router = express.Router();

// Estatísticas gerais
router.get('/stats', async (req, res) => {
  try {
    const db = await getDatabase();
    
    const stats = {
      total_suppliers: (await db.get('SELECT COUNT(*) as count FROM suppliers')).count,
      active_suppliers: (await db.get("SELECT COUNT(*) as count FROM suppliers WHERE status = 'ativo'")).count,
      total_products: (await db.get('SELECT COUNT(*) as count FROM products')).count,
      total_quotes: (await db.get('SELECT COUNT(*) as count FROM quotes')).count,
      active_quotes: (await db.get("SELECT COUNT(*) as count FROM quotes WHERE status = 'ativa'")).count,
      total_quote_value: (await db.get('SELECT COALESCE(SUM(total_price), 0) as total FROM quotes')).total || 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Melhor preço por produto
router.get('/best-prices', async (req, res) => {
  try {
    const db = await getDatabase();
    
    const bestPrices = await db.all(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.unit,
        s.name as supplier_name,
        q.unit_price,
        q.total_price,
        q.quantity,
        q.created_at
      FROM quotes q
      JOIN products p ON q.product_id = p.id
      JOIN suppliers s ON q.supplier_id = s.id
      WHERE q.id IN (
        SELECT id FROM quotes WHERE product_id IN (
          SELECT product_id FROM quotes GROUP BY product_id
        ) ORDER BY unit_price ASC LIMIT 1
      ) OR q.status = 'ativa'
      GROUP BY p.id
      HAVING q.unit_price = MIN(q.unit_price)
      ORDER BY p.category, p.name
    `);
    
    res.json(bestPrices);
  } catch (error) {
    console.error('Erro ao obter melhores preços:', error);
    res.status(500).json({ error: error.message });
  }
});

// Preços por fornecedor
router.get('/supplier-prices/:supplier_id', async (req, res) => {
  try {
    const db = await getDatabase();
    
    const prices = await db.all(`
      SELECT 
        p.name as product_name,
        p.category,
        p.unit,
        q.unit_price,
        q.quantity,
        q.total_price,
        q.created_at,
        q.status
      FROM quotes q
      JOIN products p ON q.product_id = p.id
      WHERE q.supplier_id = ?
      ORDER BY p.name
    `, req.params.supplier_id);
    
    res.json(prices);
  } catch (error) {
    console.error('Erro ao obter preços do fornecedor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Comparação de preços por produto
router.get('/compare/:product_id', async (req, res) => {
  try {
    const db = await getDatabase();
    
    const comparison = await db.all(`
      SELECT 
        s.id as supplier_id,
        s.name as supplier_name,
        q.unit_price,
        q.quantity,
        q.total_price,
        q.created_at,
        q.status,
        q.delivery_date,
        q.payment_terms
      FROM quotes q
      JOIN suppliers s ON q.supplier_id = s.id
      WHERE q.product_id = ? AND q.status = 'ativa'
      ORDER BY q.unit_price ASC
    `, req.params.product_id);
    
    res.json(comparison);
  } catch (error) {
    console.error('Erro ao comparar preços:', error);
    res.status(500).json({ error: error.message });
  }
});

// Histórico de preços
router.get('/price-history', async (req, res) => {
  try {
    const db = await getDatabase();
    const { supplier_id, product_id, days = 30 } = req.query;
    
    let query = `
      SELECT 
        ph.id,
        s.name as supplier_name,
        p.name as product_name,
        p.category,
        p.unit,
        ph.unit_price,
        ph.quantity,
        ph.recorded_at
      FROM price_history ph
      JOIN suppliers s ON ph.supplier_id = s.id
      JOIN products p ON ph.product_id = p.id
      WHERE ph.recorded_at > datetime('now', '-' || ? || ' days')
    `;
    const params = [days];
    
    if (supplier_id) {
      query += ' AND ph.supplier_id = ?';
      params.push(supplier_id);
    }
    
    if (product_id) {
      query += ' AND ph.product_id = ?';
      params.push(product_id);
    }
    
    query += ' ORDER BY ph.recorded_at DESC';
    
    const history = await db.all(query, params);
    res.json(history);
  } catch (error) {
    console.error('Erro ao obter histórico de preços:', error);
    res.status(500).json({ error: error.message });
  }
});

// Produtos por categoria
router.get('/by-category', async (req, res) => {
  try {
    const db = await getDatabase();
    
    const categories = await db.all(`
      SELECT 
        p.category,
        COUNT(*) as total_products,
        COUNT(DISTINCT q.supplier_id) as suppliers_count,
        MIN(q.unit_price) as min_price,
        MAX(q.unit_price) as max_price,
        AVG(q.unit_price) as avg_price
      FROM products p
      LEFT JOIN quotes q ON p.id = q.product_id AND q.status = 'ativa'
      GROUP BY p.category
    `);
    
    res.json(categories);
  } catch (error) {
    console.error('Erro ao obter produtos por categoria:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;