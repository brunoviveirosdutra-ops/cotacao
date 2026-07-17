import express from 'express';
import ExcelJS from 'exceljs';
import { getDatabase } from '../db/database.js';

const router = express.Router();

// Estilos para o Excel
const headerStyle = {
  font: { bold: true, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
};

const cellStyle = {
  border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
  alignment: { vertical: 'center', wrapText: true }
};

const currencyStyle = {
  ...cellStyle,
  numFmt: '"R$ "#,##0.00'
};

// Exportar todas as cotações
router.get('/quotes', async (req, res) => {
  try {
    const db = await getDatabase();
    const quotes = await db.all(`
      SELECT q.*, s.name as supplier_name, p.name as product_name, p.category, p.unit
      FROM quotes q
      JOIN suppliers s ON q.supplier_id = s.id
      JOIN products p ON q.product_id = p.id
      ORDER BY q.created_at DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cotações');

    // Cabeçalho
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Fornecedor', key: 'supplier_name', width: 20 },
      { header: 'Produto', key: 'product_name', width: 20 },
      { header: 'Categoria', key: 'category', width: 12 },
      { header: 'Quantidade', key: 'quantity', width: 12 },
      { header: 'Unidade', key: 'unit', width: 10 },
      { header: 'Preço Unitário', key: 'unit_price', width: 15 },
      { header: 'Preço Total', key: 'total_price', width: 15 },
      { header: 'Data Entrega', key: 'delivery_date', width: 15 },
      { header: 'Termos Pagamento', key: 'payment_terms', width: 20 },
      { header: 'Data Validade', key: 'validity_date', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Criado em', key: 'created_at', width: 18 },
      { header: 'Atualizado em', key: 'updated_at', width: 18 }
    ];

    // Formatar cabeçalho
    worksheet.getRow(1).forEach((cell) => {
      cell.style = headerStyle;
    });

    // Adicionar dados
    quotes.forEach((quote) => {
      const row = worksheet.addRow({
        id: quote.id,
        supplier_name: quote.supplier_name,
        product_name: quote.product_name,
        category: quote.category,
        quantity: quote.quantity,
        unit: quote.unit,
        unit_price: quote.unit_price,
        total_price: quote.total_price,
        delivery_date: quote.delivery_date ? quote.delivery_date.split('T')[0] : '',
        payment_terms: quote.payment_terms || '',
        validity_date: quote.validity_date ? quote.validity_date.split('T')[0] : '',
        status: quote.status,
        created_at: new Date(quote.created_at).toLocaleString('pt-BR'),
        updated_at: new Date(quote.updated_at).toLocaleString('pt-BR')
      });

      // Formatar preços como moeda
      row.getCell('unit_price').style = currencyStyle;
      row.getCell('total_price').style = currencyStyle;

      // Formatar outras células
      row.cells.forEach((cell) => {
        if (!cell.style?.numFmt) {
          cell.style = cellStyle;
        }
      });
    });

    // Autoajustar colunas
    worksheet.columns.forEach((column) => {
      column.width = Math.min(column.width, 30);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="cotacoes_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erro ao exportar cotações:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exportar comparação de preços por produto
router.get('/compare/:product_id', async (req, res) => {
  try {
    const db = await getDatabase();
    const product = await db.get('SELECT name, category, unit FROM products WHERE id = ?', req.params.product_id);
    
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const comparison = await db.all(`
      SELECT 
        s.id as supplier_id,
        s.name as supplier_name,
        s.email,
        s.phone,
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Comparação de Preços');

    // Título
    const titleRow = worksheet.addRow([`Comparação de Preços - ${product.name}`]);
    titleRow.font = { bold: true, size: 14 };
    titleRow.alignment = { horizontal: 'center' };
    worksheet.mergeCells('A1:J1');

    // Info do produto
    const infoRow = worksheet.addRow([`Categoria: ${product.category} | Unidade: ${product.unit}`]);
    infoRow.font = { italic: true };
    worksheet.mergeCells('A2:J2');

    worksheet.addRow([]); // Linha em branco

    // Cabeçalho
    worksheet.columns = [
      { header: 'Fornecedor', key: 'supplier_name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Telefone', key: 'phone', width: 15 },
      { header: 'Quantidade', key: 'quantity', width: 12 },
      { header: 'Preço Unitário', key: 'unit_price', width: 15 },
      { header: 'Preço Total', key: 'total_price', width: 15 },
      { header: 'Data Entrega', key: 'delivery_date', width: 15 },
      { header: 'Termos Pagamento', key: 'payment_terms', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Criado em', key: 'created_at', width: 18 }
    ];

    // Formatar cabeçalho
    worksheet.getRow(4).forEach((cell) => {
      cell.style = headerStyle;
    });

    // Adicionar dados
    comparison.forEach((row) => {
      const newRow = worksheet.addRow({
        supplier_name: row.supplier_name,
        email: row.email || '',
        phone: row.phone || '',
        quantity: row.quantity,
        unit_price: row.unit_price,
        total_price: row.total_price,
        delivery_date: row.delivery_date ? row.delivery_date.split('T')[0] : '',
        payment_terms: row.payment_terms || '',
        status: row.status,
        created_at: new Date(row.created_at).toLocaleString('pt-BR')
      });

      // Formatar preços
      newRow.getCell('unit_price').style = currencyStyle;
      newRow.getCell('total_price').style = currencyStyle;

      // Destacar menor preço
      if (comparison[0] && row.unit_price === comparison[0].unit_price) {
        newRow.getCell('unit_price').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
        newRow.getCell('total_price').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
      }

      newRow.cells.forEach((cell) => {
        if (!cell.style?.numFmt && !cell.fill) {
          cell.style = cellStyle;
        }
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="comparacao_${product.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erro ao exportar comparação:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exportar histórico de preços
router.get('/price-history', async (req, res) => {
  try {
    const db = await getDatabase();
    const { supplier_id, product_id, days = 30 } = req.query;

    let query = `
      SELECT 
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Histórico de Preços');

    // Cabeçalho
    worksheet.columns = [
      { header: 'Fornecedor', key: 'supplier_name', width: 20 },
      { header: 'Produto', key: 'product_name', width: 20 },
      { header: 'Categoria', key: 'category', width: 12 },
      { header: 'Unidade', key: 'unit', width: 10 },
      { header: 'Quantidade', key: 'quantity', width: 12 },
      { header: 'Preço Unitário', key: 'unit_price', width: 15 },
      { header: 'Data Registro', key: 'recorded_at', width: 18 }
    ];

    // Formatar cabeçalho
    worksheet.getRow(1).forEach((cell) => {
      cell.style = headerStyle;
    });

    // Adicionar dados
    history.forEach((row) => {
      const newRow = worksheet.addRow({
        supplier_name: row.supplier_name,
        product_name: row.product_name,
        category: row.category,
        unit: row.unit,
        quantity: row.quantity,
        unit_price: row.unit_price,
        recorded_at: new Date(row.recorded_at).toLocaleString('pt-BR')
      });

      newRow.getCell('unit_price').style = currencyStyle;
      newRow.cells.forEach((cell) => {
        if (!cell.style?.numFmt) {
          cell.style = cellStyle;
        }
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="historico_precos_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erro ao exportar histórico:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exportar fornecedores
router.get('/suppliers', async (req, res) => {
  try {
    const db = await getDatabase();
    const suppliers = await db.all('SELECT * FROM suppliers ORDER BY name');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Fornecedores');

    // Cabeçalho
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nome', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Telefone', key: 'phone', width: 15 },
      { header: 'Endereço', key: 'address', width: 30 },
      { header: 'Cidade', key: 'city', width: 15 },
      { header: 'Estado', key: 'state', width: 8 },
      { header: 'CEP', key: 'zip_code', width: 12 },
      { header: 'CNPJ', key: 'cnpj', width: 15 },
      { header: 'Contato', key: 'contact_person', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Criado em', key: 'created_at', width: 18 }
    ];

    // Formatar cabeçalho
    worksheet.getRow(1).forEach((cell) => {
      cell.style = headerStyle;
    });

    // Adicionar dados
    suppliers.forEach((row) => {
      const newRow = worksheet.addRow({
        id: row.id,
        name: row.name,
        email: row.email || '',
        phone: row.phone || '',
        address: row.address || '',
        city: row.city || '',
        state: row.state || '',
        zip_code: row.zip_code || '',
        cnpj: row.cnpj || '',
        contact_person: row.contact_person || '',
        status: row.status,
        created_at: new Date(row.created_at).toLocaleString('pt-BR')
      });

      newRow.cells.forEach((cell) => {
        cell.style = cellStyle;
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="fornecedores_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erro ao exportar fornecedores:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exportar produtos
router.get('/products', async (req, res) => {
  try {
    const db = await getDatabase();
    const products = await db.all('SELECT * FROM products ORDER BY category, name');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Produtos');

    // Cabeçalho
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nome', key: 'name', width: 25 },
      { header: 'Categoria', key: 'category', width: 12 },
      { header: 'Descrição', key: 'description', width: 30 },
      { header: 'Unidade', key: 'unit', width: 10 },
      { header: 'Qtd Mínima', key: 'min_order_quantity', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Criado em', key: 'created_at', width: 18 }
    ];

    // Formatar cabeçalho
    worksheet.getRow(1).forEach((cell) => {
      cell.style = headerStyle;
    });

    // Adicionar dados
    products.forEach((row) => {
      const newRow = worksheet.addRow({
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description || '',
        unit: row.unit,
        min_order_quantity: row.min_order_quantity || '',
        status: row.status,
        created_at: new Date(row.created_at).toLocaleString('pt-BR')
      });

      newRow.cells.forEach((cell) => {
        cell.style = cellStyle;
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="produtos_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erro ao exportar produtos:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
