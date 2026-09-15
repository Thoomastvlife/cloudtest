// functions/_lib/storage.js
// 容量計算、配額檢查、過期檔案清理的共用工具

export const GB = 1024 * 1024 * 1024;

// 由 base64 字串推算原始檔案大小（bytes）
export function base64Size(b64) {
  if (!b64) return 0;
  const clean = b64.replace(/\s/g, "");
  const padding = (clean.match(/=+$/) || [""])[0].length;
  return Math.max(0, Math.floor((clean.length / 4) * 3) - padding);
}

// 某個使用者目前用掉多少空間、幾個檔案
export async function getUsage(env, username) {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS files, COALESCE(SUM(size_bytes), 0) AS used FROM files WHERE owner = ?"
  )
    .bind(username)
    .first();
  return { files: row?.files ?? 0, used: row?.used ?? 0 };
}

// 一次算出所有使用者的用量，給管理員清單用
export async function getUsageMap(env) {
  const { results } = await env.DB.prepare(
    "SELECT owner, COUNT(*) AS files, COALESCE(SUM(size_bytes), 0) AS used FROM files GROUP BY owner"
  ).all();

  const map = {};
  results.forEach((r) => {
    map[r.owner] = { files: r.files, used: r.used };
  });
  return map;
}

// 刪除「超過擁有者設定的保留天數」的檔案。
// Cloudflare Pages Functions 沒有排程，所以改成每次列出清單或上傳時順手清一次。
// retention_days = 0 代表永久保留，不會被清掉。
export async function purgeExpiredFiles(env) {
  try {
    await env.DB.prepare(
      `DELETE FROM files WHERE id IN (
         SELECT f.id FROM files f
         JOIN users u ON u.username = f.owner
         WHERE COALESCE(u.retention_days, 0) > 0
           AND f.created_at IS NOT NULL
           AND f.created_at < datetime('now', '-' || u.retention_days || ' days')
       )`
    ).run();
  } catch (err) {
    // 清理失敗不該讓整個請求掛掉，記錄一下就好
    console.error("purgeExpiredFiles 失敗:", err);
  }
}
