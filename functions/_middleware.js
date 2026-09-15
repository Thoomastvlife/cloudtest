// functions/_middleware.js
// 保護需要登入才能使用的路由（見下方 PROTECTED_PATHS）
// 沒有有效登入 session 就直接擋下來，回傳 401
// /api/setup 與 /api/public-download 刻意不在清單內，兩者本來就給未登入者使用

import { verifySessionToken, getCookie, SESSION_COOKIE_NAME } from "./_lib/auth.js";

const PROTECTED_PATHS = [
  "/api/upload",
  "/api/download",
  "/api/list",
  "/api/logout",
  "/api/delete",
  "/api/share",
  "/api/me",
  "/api/change-password",
];
const ADMIN_PATHS = ["/api/admin"];

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  const needsAuth = PROTECTED_PATHS.some((p) => url.pathname.startsWith(p));
  const needsAdmin = ADMIN_PATHS.some((p) => url.pathname.startsWith(p));

  if (needsAuth || needsAdmin) {
    const token = getCookie(request, SESSION_COOKIE_NAME);
    const payload = token ? await verifySessionToken(token, env.SESSION_SECRET) : null;

    if (!payload) {
      return new Response(JSON.stringify({ error: "請先登入" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 把登入使用者的資訊往下傳給實際的 API handler
    context.data.username = payload.username;

    if (needsAdmin) {
      const user = await env.DB.prepare("SELECT is_admin FROM users WHERE username = ?")
        .bind(payload.username)
        .first();

      if (!user || !user.is_admin) {
        return new Response(JSON.stringify({ error: "沒有管理員權限" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  return next();
}
