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
    const dbPath = path.join(__dirname, '..', 'data', 'quotation.db');

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Habilitar foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

    // Ler e executar schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const statements = schema
      .split(';')
      .filter(stmt => stmt.trim());

    for (const statement of statements) {
      await db.exec(statement + ';');
    }

    // Criar administrador padrão, caso não exista
    const admin = await db.get('SELECT id FROM admins LIMIT 1');

    if (!admin) {
      const senhaHash = await bcrypt.hash('Admin@123', 10);

      await db.run(
        `INSERT INTO admins (name, email, password_hash)
         VALUES (?, ?, ?)`,
        ['Administrador', 'admin@cotacao.com', senhaHash]
      );

      console.log('✅ Administrador padrão criado');
      console.log('📧 Email: admin@cotacao.com');
      console.log('🔑 Senha: Admin@123');
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
