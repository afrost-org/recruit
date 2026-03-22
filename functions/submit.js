/**
 * Handle job application submissions with file upload
 * @param {Request} request
 * @param {Object} env - Contains DB and R2 bindings
 * @param {Object} ctx
 * @returns {Promise<Response>}
 */
export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response('Invalid content type. Expected multipart/form-data', {
        status: 415,
      });
    }

    // Get the form data
    const formData = await request.formData();

    // Get the resume file
    const resumeFile = formData.get('resume');
    if (!resumeFile) {
      return new Response('Missing resume file', {
        status: 400,
      });
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(resumeFile.type)) {
      return new Response('Invalid file type. Accepted formats: PDF, DOC, DOCX', {
        status: 400,
      });
    }

    // Validate file size (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (resumeFile.size > MAX_FILE_SIZE) {
      return new Response('File too large. Maximum size: 5MB', {
        status: 400,
      });
    }

    // Get the application data
    const applicationJson = formData.get('application');
    if (!applicationJson) {
      return new Response('Missing application data', {
        status: 400,
      });
    }

    // Parse the application data
    let applicationData;
    try {
      applicationData = JSON.parse(applicationJson);
    } catch (error) {
      return new Response('Invalid application data format', {
        status: 400,
      });
    }

    // Basic validation
    if (!applicationData.jobId || !applicationData.title || !applicationData.company) {
      return new Response('Missing required fields', {
        status: 400,
      });
    }

    // Validate answers
    if (!applicationData.answers || !Array.isArray(applicationData.answers)) {
      return new Response('Invalid answers format', {
        status: 400,
      });
    }

    if (applicationData.answers.some(answer => !answer.answer.trim())) {
      return new Response('All questions must be answered', {
        status: 400,
      });
    }

    // Extract individual fields from the answers array by questionId
    const answerMap = {};
    for (const a of applicationData.answers) {
      answerMap[a.questionId] = a.answer;
    }

    // Generate unique IDs
    const applicationId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Generate a unique filename for R2
    const fileExtension = resumeFile.name.split('.').pop().toLowerCase();
    const resumeFileName = `${applicationId}-${timestamp}.${fileExtension}`;

    // Upload file to R2
    const fileBuffer = await resumeFile.arrayBuffer();

    try {
      await env.R2.put(resumeFileName, fileBuffer, {
        httpMetadata: {
          contentType: resumeFile.type,
        },
      });
    } catch (error) {
      console.error('Error uploading to R2:', error);
      return new Response('Failed to upload resume', { status: 500 });
    }

    // Construct the public R2 URL
    const resumeUrl = `${env.R2_PUBLIC_URL}/${resumeFileName}`;
    const jobUrl = `${new URL(request.url).origin}/jobs/${applicationData.jobId}`;

    // Store in D1
    await env.DB.prepare(
      'INSERT INTO applications (id, job_id, title, company, type, location, application_email, full_name, email, phone, years_experience, current_role, current_company, linkedin, notice_period, resume_file_name, resume_type, resume_url, job_url, submitted_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      applicationId,
      applicationData.jobId,
      applicationData.title,
      applicationData.company,
      applicationData.type || null,
      applicationData.location || null,
      applicationData.applicationEmail || null,
      answerMap.full_name || null,
      answerMap.email || null,
      answerMap.phone || null,
      answerMap.years_experience || null,
      answerMap.current_role || null,
      answerMap.current_company || null,
      answerMap.linkedin || null,
      answerMap.notice_period || null,
      resumeFileName,
      resumeFile.type,
      resumeUrl,
      jobUrl,
      timestamp,
      'new'
    ).run();

    // TODO: Re-enable Telegram notifications once bot is configured
    // Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Application submitted successfully',
      applicationId: applicationId,
      jobId: applicationData.jobId,
      resumeUrl: resumeUrl
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (err) {
    console.error('Error processing job application:', err);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
