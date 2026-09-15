// functions/api/list.js
// 列出目前登入使用者上傳過的所有檔案

export async function onRequestGet({ env, data }) {
  const { results } = await env.DB.prepare(
    "SELECT id, filename, created_at FROM files WHERE owner = ? ORDER BY created_at DESC"
  )
    .bind(data.username)
    .all();

  return new Response(JSON.stringify({ files: results }), {
    headers: { "Content-Type": "application/json" },
  });
}
