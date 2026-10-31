export async function onRequestPost(context) {
  // If the request reaches this handler, authentication in the middleware succeeded
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
