// functions/api/admin/users.js
// 已通過 _middleware.js 的管理員權限驗證
// 除了帳號資料，也一併回傳每個人的容量使用情形

import { getUsageMap } from "../../_lib/storage.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, username, is_admin, quota_bytes, retention_days FROM users ORDER BY id DESC"
  ).all();

  const usage = await getUsageMap(env);

  const users = results.map((u) => ({
    id: u.id,
    username: u.username,
    is_admin: u.is_admin,
    quotaBytes: u.quota_bytes ?? 0,
    retentionDays: u.retention_days ?? 0,
    used: usage[u.username]?.used ?? 0,
    fileCount: usage[u.username]?.files ?? 0,
  }));

  return new Response(JSON.stringify({ users }), {
    headers: { "Content-Type": "application/json" },
  });
}
