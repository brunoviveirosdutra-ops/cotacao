-- Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  cnpj TEXT UNIQUE,
  contact_person TEXT,
  password_hash TEXT NOT NULL,
  status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK(category IN ('carne', 'frango')),
  description TEXT,
  unit TEXT DEFAULT 'kg' CHECK(unit IN ('kg', 'un', 'caixa')),
  min_order_quantity REAL,
  status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Cotações
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  delivery_date DATE,
  payment_terms TEXT,
  validity_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'ativa' CHECK(status IN ('ativa', 'aceita', 'rejeitada', 'expirada')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabela de Histórico de Preços
CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL,
  unit_price REAL NOT NULL,
  quote_id INTEGER,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (quote_id) REFERENCES quotes(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_quotes_supplier ON quotes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_quotes_product ON quotes(product_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_price_history_supplier ON price_history(supplier_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
-- Tabela de Administradores
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'inativo')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
