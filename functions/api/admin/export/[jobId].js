const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
};

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

function escapeCsvField(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  try {
    const { request, env, params } = context;
    const { jobId } = params;

    const authError = await checkAuth(request, env);
    if (authError) return authError;

    const baseUrl = new URL(request.url).origin;

    const { results } = await env.DB.prepare('SELECT * FROM applications WHERE job_id = ? ORDER BY submitted_at DESC').bind(jobId).all();

    // Build CSV header
    const headers = ['Application ID', 'Full Name', 'Email', 'Phone', 'Years Experience', 'Current Role', 'Current Company', 'LinkedIn', 'Notice Period', 'Submitted At', 'Status', 'Resume URL'];
    const rows = [headers.map(escapeCsvField).join(',')];

    // Build CSV rows
    for (const app of results) {
      const resumeUrl = app.resume_file_name
        ? `${baseUrl}/getResume?file=${app.resume_file_name}`
        : '';

      const row = [
        app.id,
        app.full_name,
        app.email,
        app.phone,
        app.years_experience,
        app.current_role,
        app.current_company,
        app.linkedin,
        app.notice_period,
        app.submitted_at,
        app.status,
        resumeUrl,
      ];

      rows.push(row.map(escapeCsvField).join(','));
    }

    const csv = rows.join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="applications-${jobId}.csv"`,
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error('Error exporting applications:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
