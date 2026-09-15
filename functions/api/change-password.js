// functions/api/change-password.js
// POST { "oldPassword": "...", "newPassword": "..." }
// 已通過 _middleware.js 驗證，使用者只能變更「自己」的密碼
// 必須先通過舊密碼驗證，才允許寫入新密碼

import { hashPassword, verifyPassword } from "../_lib/auth.js";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost({ request, env, data }) {
  const { oldPassword, newPassword } = await request.json();

  if (!oldPassword || !newPassword) {
    return json({ error: "請輸入目前密碼與新密碼" }, 400);
  }

  if (newPassword.length < 6) {
    return json({ error: "新密碼至少 6 碼" }, 400);
  }

  if (oldPassword === newPassword) {
    return json({ error: "新密碼不可與目前密碼相同" }, 400);
  }

  const user = await env.DB.prepare("SELECT id, password_hash FROM users WHERE username = ?")
    .bind(data.username)
    .first();

  if (!user) {
    return json({ error: "找不到使用者" }, 404);
  }

  if (!(await verifyPassword(oldPassword, user.password_hash))) {
    return json({ error: "目前密碼不正確" }, 401);
  }

  const passwordHash = await hashPassword(newPassword);

  await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(passwordHash, user.id)
    .run();

  return json({ ok: true, message: "密碼已更新" });
}
