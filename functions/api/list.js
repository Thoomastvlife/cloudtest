// functions/api/list.js
// 列出目前登入使用者上傳過的所有檔案，並回報容量使用情形

import { getUsage, purgeExpiredFiles } from "../_lib/storage.js";

export async function onRequestGet({ env, data }) {
  await purgeExpiredFiles(env);

  const { results } = await env.DB.prepare(
    "SELECT id, filename, created_at, size_bytes FROM files WHERE owner = ? ORDER BY created_at DESC"
  )
    .bind(data.username)
    .all();

  const user = await env.DB.prepare(
    "SELECT quota_bytes, retention_days FROM users WHERE username = ?"
  )
    .bind(data.username)
    .first();

  const { used } = await getUsage(env, data.username);

  return new Response(
    JSON.stringify({
      files: results,
      used,
      quota: user?.quota_bytes ?? 0,
      retentionDays: user?.retention_days ?? 0,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
