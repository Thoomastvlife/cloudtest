// functions/api/admin/share.js
// POST { "id": 123 }
// 管理員可以替「任何人」的檔案產生公開分享連結
// 和使用者版一樣：每次呼叫都重新產生權杖，效期重設為 24 小時

import { generateToken } from "../../_lib/auth.js";

const SHARE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function onRequestPost({ request, env }) {
  const { id } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: "缺少 id 參數" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const file = await env.DB.prepare("SELECT id FROM files WHERE id = ?").bind(id).first();

  if (!file) {
    return new Response(JSON.stringify({ error: "找不到檔案" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = generateToken();
  const expiresAt = Date.now() + SHARE_MAX_AGE_MS;

  await env.DB.prepare("UPDATE files SET share_token = ?, share_expires_at = ? WHERE id = ?")
    .bind(token, expiresAt, id)
    .run();

  const origin = new URL(request.url).origin;

  return new Response(
    JSON.stringify({ ok: true, url: `${origin}/api/public-download?token=${token}`, expiresAt }),
    { headers: { "Content-Type": "application/json" } }
  );
}
