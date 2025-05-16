/**
 * Handle secure resume file downloads
 * @param {Request} request
 * @param {Object} env - Contains KV and R2 bindings
 * @param {Object} ctx
 * @returns {Promise<Response>}
 */
export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    
    // Get the filename from URL parameters - this should be the exact filename stored in R2
    const filename = url.searchParams.get('file');

    // Validate required parameter
    if (!filename) {
      return new Response('Missing filename parameter', {
        status: 400,
      });
    }

    // Get the file from R2 using the exact stored filename
    const file = await env.R2.get(filename);
    
    if (!file) {
      return new Response('Resume file not found', {
        status: 404,
      });
    }

    // Return the file with appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', file.httpMetadata.contentType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    return new Response(file.body, {
      headers,
    });

  } catch (error) {
    console.error('Error retrieving resume:', error);
    return new Response('Internal server error', {
      status: 500,
    });
  }
} 