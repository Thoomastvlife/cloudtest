// functions/api/admin/reset-password.js
// POST { "id": 3 }
// 已通過 _middleware.js 的管理員權限驗證
// 系統會自動產生一組新的隨機密碼、寫回資料庫，並把明文密碼回傳一次
// （只有這次 API 回應看得到明文，請管理員自行複製轉交給使用者，之後無法再次查詢）

import { hashPassword, generateRandomPassword } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const { id } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: "缺少 id 參數" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await env.DB.prepare("SELECT id, username FROM users WHERE id = ?")
    .bind(id)
    .first();

  if (!user) {
    return new Response(JSON.stringify({ error: "找不到使用者" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const newPassword = generateRandomPassword();
  const passwordHash = await hashPassword(newPassword);

  await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .bind(passwordHash, id)
    .run();

  return new Response(
    JSON.stringify({ ok: true, username: user.username, newPassword }),
    { headers: { "Content-Type": "application/json" } }
  );
}
