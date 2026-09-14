// functions/api/logout.js

import { SESSION_COOKIE_NAME } from "../_lib/auth.js";

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=0`,
    },
  });
}
