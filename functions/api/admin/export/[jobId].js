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

    // Get all application IDs for this job
    const listResult = await env.KV.list({ prefix: `job:${jobId}:application:` });

    const applications = [];
    for (const key of listResult.keys) {
      // The value stored is the application ID
      const applicationId = await env.KV.get(key.name);
      if (applicationId) {
        const value = await env.KV.get(`application:${applicationId}`);
        if (value) {
          try {
            applications.push(JSON.parse(value));
          } catch (e) {
            console.error(`Failed to parse application ${applicationId}:`, e);
          }
        }
      }
    }

    // Sort by submittedAt descending
    applications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Collect all unique question labels across all applications
    const questionColumns = [];
    const seenQuestions = new Set();
    for (const app of applications) {
      if (app.answers && Array.isArray(app.answers)) {
        for (const answer of app.answers) {
          if (!seenQuestions.has(answer.question)) {
            seenQuestions.add(answer.question);
            questionColumns.push(answer.question);
          }
        }
      }
    }

    // Build CSV header
    const headers = ['Application ID', 'Submitted At', 'Status', ...questionColumns, 'Resume URL'];
    const rows = [headers.map(escapeCsvField).join(',')];

    // Build CSV rows
    for (const app of applications) {
      const answerMap = {};
      if (app.answers && Array.isArray(app.answers)) {
        for (const answer of app.answers) {
          answerMap[answer.question] = answer.answer;
        }
      }

      const resumeUrl = app.resumeFileName
        ? `${baseUrl}/getResume?file=${app.resumeFileName}`
        : '';

      const row = [
        app.id,
        app.submittedAt,
        app.status,
        ...questionColumns.map(q => answerMap[q] || ''),
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
