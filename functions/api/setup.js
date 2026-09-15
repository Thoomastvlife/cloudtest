// functions/api/setup.js
// 初次安裝用：在「資料庫裡一個使用者都沒有」時，建立第一組管理員帳號。
//
// 為什麼需要這支？因為註冊功能已經移除，帳號一律由管理員在後台建立，
// 但全新的資料庫連一個管理員都沒有，會變成沒有人能登入。
// 這支端點只有在 users 資料表為空的時候才會放行，
// 只要建立過第一組管理員，之後任何呼叫都會直接回 403。
//
// GET  /api/setup  -> { needsSetup: true/false }
// POST /api/setup  { username, password } -> 建立第一組管理員

import { hashPassword } from "../_lib/auth.js";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function hasAnyUser(env) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();
  return (row?.n ?? 0) > 0;
}

export async function onRequestGet({ env }) {
  return json({ needsSetup: !(await hasAnyUser(env)) });
}

export async function onRequestPost({ request, env }) {
  if (await hasAnyUser(env)) {
    return json({ error: "系統已完成初始設定，請改由管理員後台新增帳號" }, 403);
  }

  const { username, password } = await request.json();

  if (!username || !password || password.length < 6) {
    return json({ error: "帳號不可為空，密碼至少 6 碼" }, 400);
  }

  const passwordHash = await hashPassword(password);

  await env.DB.prepare("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)")
    .bind(username, passwordHash)
    .run();

  return json({ ok: true, message: "管理員帳號已建立，請登入" });
}
