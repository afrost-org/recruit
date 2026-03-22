const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
};

function rowToCamelCase(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    title: row.title,
    company: row.company,
    type: row.type,
    location: row.location,
    applicationEmail: row.application_email,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    yearsExperience: row.years_experience,
    currentRole: row.current_role,
    currentCompany: row.current_company,
    linkedin: row.linkedin,
    noticePeriod: row.notice_period,
    resumeFileName: row.resume_file_name,
    resumeType: row.resume_type,
    resumeUrl: row.resume_url,
    jobUrl: row.job_url,
    submittedAt: row.submitted_at,
    status: row.status,
  };
}

async function checkAuth(request, env) {
  const password = request.headers.get('X-Admin-Password');
  const row = await env.DB.prepare("SELECT value FROM config WHERE key = 'admin_password'").first();
  const storedPassword = row?.value;
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
    const { request, env, params } = context;
    const { id } = params;

    const authError = await checkAuth(request, env);
    if (authError) return authError;

    const row = await env.DB.prepare('SELECT * FROM applications WHERE id = ?').bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify(rowToCamelCase(row)), {
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

    const authError = await checkAuth(request, env);
    if (authError) return authError;

    const existing = await env.DB.prepare('SELECT * FROM applications WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = await request.json();

    if (!body.status) {
      return new Response(JSON.stringify({ error: 'Missing status field' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    await env.DB.prepare('UPDATE applications SET status = ? WHERE id = ?').bind(body.status, id).run();

    const updated = { ...existing, status: body.status };
    return new Response(JSON.stringify(rowToCamelCase(updated)), {
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

    const authError = await checkAuth(request, env);
    if (authError) return authError;

    const row = await env.DB.prepare('SELECT resume_file_name FROM applications WHERE id = ?').bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    await env.DB.prepare('DELETE FROM applications WHERE id = ?').bind(id).run();

    // Delete the resume from R2
    if (row.resume_file_name) {
      try {
        await env.R2.delete(row.resume_file_name);
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
