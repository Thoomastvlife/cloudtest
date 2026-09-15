// functions/api/upload.js
// 已通過 _middleware.js 驗證，context.data.username 一定存在
// 檔案內容以 base64 字串存進 D1（適合小型/文字檔；大型二進位檔建議改用 R2）

export async function onRequestPost({ request, env, data }) {
  const body = await request.json();
  const { filename, contentBase64 } = body;

  if (!filename || !contentBase64) {
    return new Response(JSON.stringify({ error: "缺少 filename 或 contentBase64" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await env.DB.prepare(
    "INSERT INTO files (owner, filename, content, created_at) VALUES (?, ?, ?, datetime('now'))"
  )
    .bind(data.username, filename, contentBase64)
    .run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
