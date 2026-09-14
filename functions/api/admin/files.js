// functions/api/admin/files.js

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, owner, filename, created_at FROM files ORDER BY created_at DESC"
  ).all();

  return new Response(JSON.stringify({ files: results }), {
    headers: { "Content-Type": "application/json" },
  });
}
