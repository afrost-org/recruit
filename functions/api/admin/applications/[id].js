const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
};

function checkAuth(request, env) {
  const password = request.headers.get('X-Admin-Password');
  if (!password || password !== env.ADMIN_PASSWORD) {
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
    const { request, env, params } = context;
    const { id } = params;

    const authError = checkAuth(request, env);
    if (authError) return authError;

    const value = await env.KV.get(`application:${id}`);
    if (!value) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(value, {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Error fetching application:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function onRequestPatch(context) {
  try {
    const { request, env, params } = context;
    const { id } = params;

    const authError = checkAuth(request, env);
    if (authError) return authError;

    const value = await env.KV.get(`application:${id}`);
    if (!value) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const record = JSON.parse(value);
    const body = await request.json();

    if (!body.status) {
      return new Response(JSON.stringify({ error: 'Missing status field' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    record.status = body.status;

    // Update the main application record
    await env.KV.put(
      `application:${id}`,
      JSON.stringify(record),
      {
        metadata: {
          jobId: record.jobId,
          status: record.status,
          submittedAt: record.submittedAt,
        },
      }
    );

    // Update metadata on the job-specific index key
    await env.KV.put(
      `job:${record.jobId}:application:${id}`,
      id,
      {
        metadata: {
          status: record.status,
          submittedAt: record.submittedAt,
        },
      }
    );

    return new Response(JSON.stringify(record), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Error updating application:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function onRequestDelete(context) {
  try {
    const { request, env, params } = context;
    const { id } = params;

    const authError = checkAuth(request, env);
    if (authError) return authError;

    const value = await env.KV.get(`application:${id}`);
    if (!value) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const record = JSON.parse(value);

    // Delete the main application record
    await env.KV.delete(`application:${id}`);

    // Delete the job-specific index key
    await env.KV.delete(`job:${record.jobId}:application:${id}`);

    // Delete the resume from R2
    if (record.resumeFileName) {
      try {
        await env.R2.delete(record.resumeFileName);
      } catch (r2Error) {
        console.error('Error deleting resume from R2:', r2Error);
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Application deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Error deleting application:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
