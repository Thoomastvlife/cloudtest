// functions/api/admin/update-user.js
// POST { "id": 3, "quotaGb": 2, "retentionDays": 30 }
// 設定單一使用者的「容量上限」與「檔案保留天數」
// quotaGb = 0 代表不限制容量；retentionDays = 0 代表永久保留

import { GB } from "../../_lib/storage.js";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const { id, quotaGb, retentionDays } = await request.json();

  if (!id) return json({ error: "缺少 id 參數" }, 400);

  const gb = Number(quotaGb);
  const days = Number(retentionDays);

  if (!Number.isFinite(gb) || gb < 0) return json({ error: "容量上限必須是 0 或正數" }, 400);
  if (!Number.isInteger(days) || days < 0) return json({ error: "保留天數必須是 0 或正整數" }, 400);
  if (days > 3650) return json({ error: "保留天數最多 3650 天" }, 400);

  const user = await env.DB.prepare("SELECT id, username FROM users WHERE id = ?")
    .bind(id)
    .first();

  if (!user) return json({ error: "找不到使用者" }, 404);

  const quotaBytes = Math.round(gb * GB);

  await env.DB.prepare("UPDATE users SET quota_bytes = ?, retention_days = ? WHERE id = ?")
    .bind(quotaBytes, days, id)
    .run();

  return json({ ok: true, username: user.username, quotaBytes, retentionDays: days });
}
