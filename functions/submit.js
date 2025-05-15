/**
 * @typedef {Object} ApplicationAnswer
 * @property {string} questionId
 * @property {string} question
 * @property {string} answer
 */

/**
 * @typedef {Object} JobApplication
 * @property {string} jobId
 * @property {string} title
 * @property {string} company
 * @property {string} type
 * @property {string} location
 * @property {string} applicationEmail
 * @property {ApplicationAnswer[]} answers
 */

/**
 * Handle job application submissions with file upload
 * @param {Request} request
 * @param {Object} env - Contains KV and R2 bindings
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

    // Prepare application data for KV
    const applicationRecord = {
      id: applicationId,
      jobId: applicationData.jobId,
      title: applicationData.title,
      company: applicationData.company,
      type: applicationData.type,
      location: applicationData.location,
      applicationEmail: applicationData.applicationEmail,
      answers: applicationData.answers,
      resumeFileName: resumeFileName,
      resumeType: resumeFile.type,
      resumeUrl: resumeUrl,
      submittedAt: timestamp,
      status: 'new'
    };

    // Store in KV namespace
    try {
      await env.KV.put(
        `application:${applicationId}`,
        JSON.stringify(applicationRecord),
        {
          metadata: {
            jobId: applicationData.jobId,
            status: 'new',
            submittedAt: timestamp
          }
        }
      );

      // Also store a job-specific index
      await env.KV.put(
        `job:${applicationData.jobId}:application:${applicationId}`,
        applicationId,
        {
          metadata: {
            status: 'new',
            submittedAt: timestamp
          }
        }
      );
    } catch (error) {
      console.error('Error storing in KV:', error);
      // Try to cleanup R2 file if KV storage fails
      try {
        await env.R2.delete(resumeFileName);
      } catch (cleanupError) {
        console.error('Error cleaning up R2 file:', cleanupError);
      }
      return new Response('Failed to store application data', { status: 500 });
    }

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