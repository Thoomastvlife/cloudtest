// functions/api/delete.js
// POST { "id": 123 }
// 已通過 _middleware.js 驗證，使用者只能刪除「自己擁有」的檔案

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

  await env.DB.prepare("DELETE FROM files WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
