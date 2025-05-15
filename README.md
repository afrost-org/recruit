# Cloudflare Pages Functions

This directory contains serverless functions that run on Cloudflare Pages.

## Job Submission Function

The `submit.js` function handles job submissions through a POST endpoint.

### Endpoint

```
POST /functions/submit
```

### Request Body

```javascript
{
  "jobId": "string",
  "title": "string",
  "company": "string",
  "type": "string",
  "location": "string",
  "applicationEmail": "string",
  "answers": [
    {
      "questionId": "string",
      "question": "string",
      "answer": "string"
    }
  ]
}
```

### Response

Success (201):
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "applicationId": "uuid",
  "jobId": "string"
}
```

Error (400, 415, 500):
```json
{
  "success": false,
  "message": "Error message"
}
```

### Example Usage

```javascript
const response = await fetch('/functions/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jobId: "123",
    title: "Senior Software Engineer",
    company: "Tech Corp",
    type: "full-time",
    location: "Remote",
    applicationEmail: "jobs@techcorp.com",
    answers: [
      {
        questionId: "q1",
        question: "Why do you want to work here?",
        answer: "I'm passionate about technology..."
      }
    ]
  })
});

const data = await response.json();
```

## Development

1. Make sure you have Wrangler installed:
```bash
npm install -g wrangler
```

2. Run the development server:
```bash
npm run dev
```

3. Test the function locally:
```bash
wrangler pages dev
``` 