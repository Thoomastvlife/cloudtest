// functions/api/admin/create-user.js
// POST { "username": "...", "password": "..." }
// 已通過 _middleware.js 的管理員權限驗證
// 建立一個「一般使用者」帳號（is_admin = 0）
// 密碼由管理員自行指定；使用者登入後可以在首頁自行變更密碼

import { hashPassword } from "../../_lib/auth.js";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json();

  if (!username || !password || password.length < 6) {
    return json({ error: "帳號不可為空，密碼至少 6 碼" }, 400);
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE username = ?")
    .bind(username)
    .first();

  if (existing) {
    return json({ error: "帳號已存在" }, 409);
  }

  const passwordHash = await hashPassword(password);

  await env.DB.prepare("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 0)")
    .bind(username, passwordHash)
    .run();

  return json({ ok: true, message: "使用者帳號建立成功" });
}
