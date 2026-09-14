// functions/api/download.js
// GET /api/download?id=123
// 只能下載自己上傳的檔案（owner 必須等於目前登入者）

export async function onRequestGet({ request, env, data }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "缺少 id 參數" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const file = await env.DB.prepare(
    "SELECT filename, content FROM files WHERE id = ? AND owner = ?"
  )
    .bind(id, data.username)
    .first();

  if (!file) {
    return new Response(JSON.stringify({ error: "找不到檔案或無權限" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ filename: file.filename, contentBase64: file.content }), {
    headers: { "Content-Type": "application/json" },
  });
}
