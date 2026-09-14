-- 在既有的 test 資料庫執行這行即可（Console 貼這一行、按執行）
ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;
UPDATE users SET is_admin = 1 WHERE username = 'coffee';
