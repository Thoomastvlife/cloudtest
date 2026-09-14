-- 在既有的資料庫執行這兩行即可（Console 貼上、按執行）
-- 用來支援「公開分享連結」功能（連結僅 24 小時有效）
ALTER TABLE files ADD COLUMN share_token TEXT;
ALTER TABLE files ADD COLUMN share_expires_at INTEGER;
