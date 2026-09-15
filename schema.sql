CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  -- 容量上限（bytes）。0 = 不限制
  quota_bytes INTEGER DEFAULT 0,
  -- 檔案保留天數，超過就自動刪除。0 = 永久保留
  retention_days INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner TEXT NOT NULL,
  filename TEXT NOT NULL,
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  share_token TEXT,
  share_expires_at INTEGER,
  -- 檔案原始大小（bytes）
  size_bytes INTEGER DEFAULT 0
);
