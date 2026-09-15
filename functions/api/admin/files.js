// functions/api/admin/files.js
// 管理員可以看到所有檔案（含大小與分享狀態）

import { purgeExpiredFiles } from "../../_lib/storage.js";

export async function onRequestGet({ env }) {
  await purgeExpiredFiles(env);

  const { results } = await env.DB.prepare(
    `SELECT id, owner, filename, created_at, size_bytes, share_expires_at
     FROM files ORDER BY created_at DESC`
  ).all();

  const total = results.reduce((sum, f) => sum + (f.size_bytes || 0), 0);

  return new Response(JSON.stringify({ files: results, total }), {
    headers: { "Content-Type": "application/json" },
  });
}
