// functions/api/public-download.js
// GET /api/public-download?token=xxx
// 公開端點，「不需要登入」— 任何拿到連結的人都能下載
// 連結僅在產生後 24 小時內有效，過期或權杖錯誤一律拒絕
// 注意：這條路徑故意不放進 _middleware.js 的 PROTECTED_PATHS，
// 因為它本來就是設計給未登入的人使用的公開分享連結

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("缺少分享連結參數", { status: 400 });
  }

  const file = await env.DB.prepare(
    "SELECT filename, content, share_expires_at FROM files WHERE share_token = ?"
  )
    .bind(token)
    .first();

  if (!file) {
    return new Response("連結無效，檔案可能已被刪除或連結不存在", { status: 404 });
  }

  if (!file.share_expires_at || file.share_expires_at < Date.now()) {
    return new Response("此分享連結已過期（連結僅限 24 小時內有效）", { status: 410 });
  }

  // 將 base64 內容還原成二進位檔案回傳，讓瀏覽器直接下載
  const binaryString = atob(file.content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const asciiFallback = file.filename.replace(/[^\x20-\x7E]/g, "_");
  const encodedFilename = encodeURIComponent(file.filename);

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "no-store",
    },
  });
}
