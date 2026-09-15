// functions/api/admin/users.js
// 已通過 _middleware.js 的管理員權限驗證

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, username, is_admin FROM users ORDER BY id DESC"
  ).all();

  return new Response(JSON.stringify({ users: results }), {
    headers: { "Content-Type": "application/json" },
  });
}
