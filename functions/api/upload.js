// functions/api/upload.js
// 已通過 _middleware.js 驗證，context.data.username 一定存在
// 檔案內容以 base64 字串存進 D1（適合小型/文字檔；大型二進位檔建議改用 R2）
// 上傳前會先檢查使用者的容量上限（quota_bytes），超過就拒絕

import { base64Size, getUsage, purgeExpiredFiles } from "../_lib/storage.js";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function formatBytes(n) {
  if (n >= 1024 ** 3) return (n / 1024 ** 3).toFixed(2) + " GB";
  if (n >= 1024 ** 2) return (n / 1024 ** 2).toFixed(1) + " MB";
  if (n >= 1024) return (n / 1024).toFixed(1) + " KB";
  return n + " B";
}

export async function onRequestPost({ request, env, data }) {
  const { filename, contentBase64 } = await request.json();

  if (!filename || !contentBase64) {
    return json({ error: "缺少 filename 或 contentBase64" }, 400);
  }

  // 先清掉已過保留期限的檔案，讓釋放出來的空間可以馬上使用
  await purgeExpiredFiles(env);

  const size = base64Size(contentBase64);

  const user = await env.DB.prepare("SELECT quota_bytes FROM users WHERE username = ?")
    .bind(data.username)
    .first();

  const quota = user?.quota_bytes ?? 0;

  if (quota > 0) {
    const { used } = await getUsage(env, data.username);
    if (used + size > quota) {
      return json(
        {
          error:
            `容量不足：目前已使用 ${formatBytes(used)}／上限 ${formatBytes(quota)}，` +
            `這個檔案 ${formatBytes(size)} 放不下。請先刪除一些檔案，或請管理員調高上限。`,
        },
        413
      );
    }
  }

  await env.DB.prepare(
    "INSERT INTO files (owner, filename, content, size_bytes, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
  )
    .bind(data.username, filename, contentBase64, size)
    .run();

  return json({ ok: true, size });
}
