// functions/api/admin/download.js
// GET /api/admin/download?id=123
// 管理員可以下載「任何人」的檔案（一般使用者的 /api/download 仍然只能下載自己的）

export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "缺少 id 參數" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const file = await env.DB.prepare("SELECT filename, content FROM files WHERE id = ?")
    .bind(id)
    .first();

  if (!file) {
    return new Response(JSON.stringify({ error: "找不到檔案" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ filename: file.filename, contentBase64: file.content }),
    { headers: { "Content-Type": "application/json" } }
  );
}
