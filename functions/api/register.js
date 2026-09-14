// functions/api/register.js
// 註冊新帳號。正式上線後建議加上邀請碼或直接關閉此端點，避免任何人都能自行註冊。

import { hashPassword } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json();

  if (!username || !password || password.length < 6) {
    return new Response(JSON.stringify({ error: "帳號不可為空，密碼至少 6 碼" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE username = ?")
    .bind(username)
    .first();

  if (existing) {
    return new Response(JSON.stringify({ error: "帳號已存在" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  }

  const passwordHash = await hashPassword(password);

  await env.DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .bind(username, passwordHash)
    .run();

  return new Response(JSON.stringify({ ok: true, message: "註冊成功，請登入" }), {
    headers: { "Content-Type": "application/json" },
  });
}
