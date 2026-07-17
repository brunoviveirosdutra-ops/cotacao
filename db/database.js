import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
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
    db = await open({
      filename: './data/quotation.db',
      driver: sqlite3.Database
    });

    // Habilitar foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

    // Ler e executar schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Executar schema em partes
    const statements = schema.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await db.exec(statement + ';');
      }
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
