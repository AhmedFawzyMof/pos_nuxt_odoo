import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'pos-app.db')
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  initSchema(db)
  return db
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      label_ar TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      odoo_user_id INTEGER UNIQUE NOT NULL,
      name TEXT,
      login TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS user_odoo_groups (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      odoo_group_id INTEGER NOT NULL,
      group_name TEXT,
      full_name TEXT,
      category_name TEXT,
      PRIMARY KEY (user_id, odoo_group_id)
    );
  `)

  const count = database.prepare('SELECT COUNT(*) as count FROM roles').get() as any
  if (count.count === 0) {
    seedRoles(database)
  }
}

function seedRoles(database: Database.Database) {
  const insert = database.prepare('INSERT INTO roles (name, label, label_ar) VALUES (?, ?, ?)')
  const roles: [string, string, string][] = [
    ['pos_user', 'Point of Sale / User', 'نقطة البيع / مستخدم'],
    ['pos_manager', 'Point of Sale / Administrator', 'نقطة البيع / مدير'],
    ['purchase_user', 'Purchase / User', 'المشتريات / مستخدم'],
    ['purchase_manager', 'Purchase / Administrator', 'المشتريات / مدير'],
    ['account_invoice', 'Accounting / Invoicing', 'المحاسبة / فواتير'],
    ['account_manager', 'Accounting / Administrator', 'المحاسبة / مدير'],
    ['stock_user', 'Inventory / User', 'المخزون / مستخدم'],
    ['stock_manager', 'Inventory / Administrator', 'المخزون / مدير'],
    ['settings_access_rights', 'Administration / Access Rights', 'الإدارة / صلاحيات الوصول'],
    ['base_user', 'Internal User', 'مستخدم داخلي'],
  ]
  const tx = database.transaction(() => {
    for (const [name, label, labelAr] of roles) {
      insert.run(name, label, labelAr)
    }
  })
  tx()
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
