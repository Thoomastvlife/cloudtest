// functions/api/admin/delete-user.js
// POST { "id": 3 }

export async function onRequestPost({ request, env, data }) {
  const { id } = await request.json();

  const target = await env.DB.prepare("SELECT username FROM users WHERE id = ?").bind(id).first();

  if (!target) {
    return new Response(JSON.stringify({ error: "找不到使用者" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (target.username === data.username) {
    return new Response(JSON.stringify({ error: "不能刪除自己目前登入的帳號" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await env.DB.prepare("DELETE FROM files WHERE owner = ?").bind(target.username).run();
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
