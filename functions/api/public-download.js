// functions/api/public-download.js
// GET /api/public-download?token=xxx
// 公開端點，「不需要登入」— 任何拿到連結的人都能下載
// 連結僅在產生後 24 小時內有效，過期或權杖錯誤一律拒絕
// 注意：這條路徑故意不放進 _middleware.js 的 PROTECTED_PATHS，
// 因為它本來就是設計給未登入的人使用的公開分享連結

// 依副檔名對應 MIME type，讓瀏覽器能在支援的格式上直接預覽
// 找不到對應類型時，回退成 application/octet-stream（瀏覽器會直接下載）
const MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8",
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

function guessMimeType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

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
  const mimeType = guessMimeType(file.filename);

  // 用 inline 而非 attachment：瀏覽器認得的類型（圖片、PDF、文字、音訊、影片…）
  // 會直接在分頁裡開啟預覽，使用者可以自己決定要不要另外「另存新檔」下載；
  // 瀏覽器不認得的類型仍會照原本行為自動下載，不受影響。
  return new Response(bytes, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "no-store",
    },
  });
}
