// functions/api/login.js

import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json();

  const user = await env.DB.prepare("SELECT * FROM users WHERE username = ?")
    .bind(username)
    .first();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return new Response(JSON.stringify({ error: "帳號或密碼錯誤" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = await createSessionToken(username, env.SESSION_SECRET);

  return new Response(JSON.stringify({ ok: true, username }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}`,
    },
  });
}
