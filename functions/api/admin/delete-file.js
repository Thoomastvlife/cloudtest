// functions/api/admin/delete-file.js
// POST { "id": 5 }

export async function onRequestPost({ request, env }) {
  const { id } = await request.json();

  await env.DB.prepare("DELETE FROM files WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
