# Job Application System

A modern, serverless job application system built with React and Cloudflare Pages. The system handles job postings, applications, file uploads, and automated notifications.

## Features

### For Candidates
- View job postings with detailed information
- Submit applications with required information
- Upload resumes (PDF, DOC, DOCX formats supported)
- Instant feedback on submission status
- File size validation (max 5MB)

### For Recruiters
- Instant notifications via Google Chat for new applications
- Direct access to candidate information
- Secure resume download links
- Organized application tracking
- Links back to original job postings

## Technical Architecture

### Frontend
- React-based SPA
- Modern form handling and validation
- File upload with client-side validation
- Toast notifications for user feedback
- Clean and responsive UI

### Backend (Cloudflare Pages Functions)
- Serverless architecture
- Multipart form data handling
- File storage in Cloudflare R2
- Application data in Cloudflare KV
- Google Chat webhook integration

### Storage
- **Cloudflare KV**: Application data and job-application relationships
- **Cloudflare R2**: Resume file storage
- Proper indexing for efficient retrieval

## Setup

### Prerequisites
- Node.js (v22.15.1 or later)
- Wrangler CLI
- Cloudflare account

### Environment Variables
Create a `.dev.vars` file for local development:
```env
BASE_URL=http://127.0.0.1:8788
GOOGLE_CHAT_WEBHOOK=your-google-chat-webhook-url
R2_PUBLIC_URL = "your-r2-public-url"
```

Update `wrangler.toml` with your production values:
```toml
[vars]
BASE_URL = "https://your-production-url"
GOOGLE_CHAT_WEBHOOK = "your-google-chat-webhook-url"
R2_PUBLIC_URL = "your-r2-public-url"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"

[[r2_buckets]]
binding = "R2"
bucket_name = "resumes"
```

### Installation
1. Clone the repository
```bash
git clone <repository-url>
cd recruit
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

## API Endpoints

### Submit Application
`POST /submit`
- Handles job application submissions
- Processes multipart form data
- Stores application data and resume
- Sends notification to Google Chat

### Get Resume
`GET /getResume`
- Secure resume file retrieval
- Requires exact filename
- Returns file with proper content type
- Supports PDF, DOC, DOCX formats

## Data Structure

### Application Record
```typescript
interface ApplicationRecord {
  id: string;
  jobId: string;
  title: string;
  type: string;
  location: string;
  answers: ApplicationAnswer[];
  resumeFileName: string;
  resumeType: string;
  resumeUrl: string;
  jobUrl: string;
  submittedAt: string;
  status: string;
}

interface ApplicationAnswer {
  questionId: string;
  question: string;
  answer: string;
}
```

## Security

- Secure file handling with type and size validation
- No direct R2 URL exposure
- Environment-based configuration
- Proper error handling and validation

## Development

### Local Development
```bash
npm run dev
```

### Production Deployment
```bash
npm run deploy
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 