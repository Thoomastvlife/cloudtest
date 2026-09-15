-- 在既有的資料庫執行這三行即可（Console 貼上、按執行）
-- 用來支援「每位使用者容量上限 / 自動刪除天數」與「檔案大小顯示」
ALTER TABLE users ADD COLUMN quota_bytes INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN retention_days INTEGER DEFAULT 0;
ALTER TABLE files ADD COLUMN size_bytes INTEGER DEFAULT 0;

-- 舊資料沒有 size_bytes，用 base64 長度回推真實大小
UPDATE files
SET size_bytes = (LENGTH(content) / 4) * 3
                 - (LENGTH(content) - LENGTH(RTRIM(content, '=')))
WHERE (size_bytes IS NULL OR size_bytes = 0)
  AND content IS NOT NULL AND content <> '';
