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

export async function onRequestGet(context) {
  try {
    const { env, params } = context;
    const { id } = params;

    const row = await env.DB.prepare('SELECT * FROM applications WHERE id = ?').bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rowToCamelCase(row)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching application:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPatch(context) {
  try {
    const { request, env, params } = context;
    const { id } = params;

    const existing = await env.DB.prepare('SELECT * FROM applications WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    if (!body.status) {
      return new Response(JSON.stringify({ error: 'Missing status field' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await env.DB.prepare('UPDATE applications SET status = ? WHERE id = ?').bind(body.status, id).run();

    const updated = { ...existing, status: body.status };
    return new Response(JSON.stringify(rowToCamelCase(updated)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error updating application:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestDelete(context) {
  try {
    const { env, params } = context;
    const { id } = params;

    const row = await env.DB.prepare('SELECT resume_file_name FROM applications WHERE id = ?').bind(id).first();
    if (!row) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error deleting application:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
