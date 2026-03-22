const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    const { request, env } = context;

    const authError = await checkAuth(request, env);
    if (authError) return authError;

    const { results } = await env.DB.prepare('SELECT * FROM applications ORDER BY submitted_at DESC').all();

    const applications = results.map(rowToCamelCase);

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
