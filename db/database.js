import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function getDatabase() {
  if (db) return db;
  return initDatabase();
}

export async function initDatabase() {
  try {
    // Criar pasta data caso não exista
    const dataDir = path.join(__dirname, '..', 'data');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Caminho do banco
    const dbPath = process.env.DATABASE_PATH
      ? path.resolve(process.env.DATABASE_PATH)
      : path.join(dataDir, 'quotation.db');

    // Abrir banco
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Habilitar chaves estrangeiras
    await db.exec('PRAGMA foreign_keys = ON');

    // Executar schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const statements = schema
      .split(';')
      .filter(statement => statement.trim());

    for (const statement of statements) {
      await db.exec(statement + ';');
    }

    // Criar administrador padrão, se ainda não existir
    const admin = await db.get('SELECT id FROM admins LIMIT 1');

    if (!admin) {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      const senhaHash = await bcrypt.hash(adminPassword, 10);

      await db.run(
        `INSERT INTO admins (name, email, password_hash)
         VALUES (?, ?, ?)`,
        ['Administrador', adminEmail, senhaHash]
      );

      console.log('✅ Administrador padrão criado');
      console.log(`📧 Email: ${adminEmail}`);
      console.log('🔐 Senha definida através do arquivo .env');
    }

    console.log('✅ Banco de dados inicializado com sucesso');

    return db;

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}