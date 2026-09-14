// functions/api/share.js
// POST { "id": 123 }
// 已通過 _middleware.js 驗證，只能替「自己擁有」的檔案產生分享連結
// 每次呼叫都會重新產生一組權杖，並把有效期重設為「現在起 24 小時」

import { generateToken } from "../_lib/auth.js";

const SHARE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 小時

export async function onRequestPost({ request, env, data }) {
  const { id } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: "缺少 id 參數" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const file = await env.DB.prepare("SELECT id FROM files WHERE id = ? AND owner = ?")
    .bind(id, data.username)
    .first();

  if (!file) {
    return new Response(JSON.stringify({ error: "找不到檔案或無權限" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = generateToken();
  const expiresAt = Date.now() + SHARE_MAX_AGE_MS;

  await env.DB.prepare("UPDATE files SET share_token = ?, share_expires_at = ? WHERE id = ?")
    .bind(token, expiresAt, id)
    .run();

  const url = new URL(request.url);
  const shareUrl = `${url.origin}/api/public-download?token=${token}`;

  return new Response(JSON.stringify({ ok: true, url: shareUrl, expiresAt }), {
    headers: { "Content-Type": "application/json" },
  });
}
