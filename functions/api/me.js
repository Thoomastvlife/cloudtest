// functions/api/me.js
// 回傳目前登入者的帳號與是否為管理員
// 已通過 _middleware.js 驗證，未登入會被擋在外面（401）

export async function onRequestGet({ env, data }) {
  const user = await env.DB.prepare("SELECT username, is_admin FROM users WHERE username = ?")
    .bind(data.username)
    .first();

  if (!user) {
    return new Response(JSON.stringify({ error: "找不到使用者" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ username: user.username, isAdmin: !!user.is_admin }),
    { headers: { "Content-Type": "application/json" } }
  );
}
