// functions/api/admin/create-admin.js
// POST { "username": "...", "password": "..." }
// 已通過 _middleware.js 的管理員權限驗證
// 建立一個新的「管理員」帳號（is_admin = 1）

import { hashPassword } from "../../_lib/auth.js";

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

  await env.DB.prepare("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)")
    .bind(username, passwordHash)
    .run();

  return new Response(JSON.stringify({ ok: true, message: "管理員帳號建立成功" }), {
    headers: { "Content-Type": "application/json" },
  });
}
