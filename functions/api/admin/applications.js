const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
};

async function checkAuth(request, env) {
  const password = request.headers.get('X-Admin-Password');
  const storedPassword = await env.KV.get('config:admin_password');
  if (!password || !storedPassword || password !== storedPassword) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  return null;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;

    const authError = await checkAuth(request, env);
    if (authError) return authError;

    // List all application keys — metadata has jobId, status, submittedAt
    let allKeys = [];
    let cursor = undefined;
    do {
      const listResult = await env.KV.list({ prefix: 'application:', cursor });
      allKeys = allKeys.concat(listResult.keys);
      cursor = listResult.list_complete ? undefined : listResult.cursor;
    } while (cursor);

    // Return lightweight summaries from metadata (no full record fetches)
    const applications = allKeys
      .filter((key) => key.metadata)
      .map((key) => ({
        id: key.name.replace('application:', ''),
        jobId: key.metadata.jobId,
        status: key.metadata.status,
        submittedAt: key.metadata.submittedAt,
      }))
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    return new Response(JSON.stringify(applications), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Error fetching applications:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
