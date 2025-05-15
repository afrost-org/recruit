import { ArrowLeft, Building2, CalendarDays, Clock, MapPin, Copy, Check, Upload } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Job } from "@/types/job";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface JobDetailProps {
  job: Job;
}

// Default application questions if none provided
const defaultQuestions = [
  {
    id: "full_name",
    question: "Full Name",
    type: "text"
  },
  {
    id: "email",
    question: "Email Address",
    type: "email"
  },
  {
    id: "phone",
    question: "Phone Number",
    type: "tel"
  },
  {
    id: "years_experience",
    question: "Years of Experience",
    type: "number"
  },
  {
    id: "current_role",
    question: "Current Role",
    type: "text"
  },
  {
    id: "current_company",
    question: "Current Company",
    type: "text"
  },
  {
    id: "resume",
    question: "Resume (PDF, DOC, DOCX)",
    type: "file"
  },
  {
    id: "linkedin",
    question: "LinkedIn Profile URL",
    type: "url"
  },
  {
    id: "notice_period",
    question: "Notice Period (in weeks)",
    type: "number"
  }
];

const JobDetail = ({ job }: JobDetailProps) => {
  const [copied, setCopied] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMMM d, yyyy");
  };

  const emailSubject = `Application for ${job.title} Position`;

  const handleAnswerChange = (questionId: string, value: string) => {
    // For number inputs, ensure value is not negative
    if ((questionId === 'years_experience' || questionId === 'notice_period') && value !== '') {
      const numValue = parseFloat(value);
      if (numValue < 0) return;
    }
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, DOC, or DOCX file",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      setResumeFile(file);
    }
  };

  const formatEmailBody = () => {
    let body = `Hello,\n\nI am interested in applying for the ${job.title} position.\n\n`;
    body += "Please find my responses to the application questions below:\n\n";

    if (job.applicationQuestions) {
      job.applicationQuestions.forEach(q => {
        body += `${q.question}\n`;
        body += `${answers[q.id] || "No response"}\n\n`;
      });
    }

    body += "Please find my resume attached to this email.\n\n";
    body += "Thank you for considering my application.\n\nBest regards,\n[Your Name]";
    return body;
  };

  const handleCopy = async () => {
    try {
      const text = `Email: ${job.applicationEmail}\nSubject: ${emailSubject}\n\n${formatEmailBody()}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get questions to validate (either job-specific or default)
      const questions = job.applicationQuestions || defaultQuestions;
      
      // Validate required answers
      const missingAnswers = questions
        .filter(q => q.type !== 'file')
        .filter(q => !answers[q.id]);

      if (missingAnswers.length > 0) {
        toast({
          title: "Missing Information",
          description: "Please answer all application questions before submitting.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Validate resume
      if (!resumeFile) {
        toast({
          title: "Missing Resume",
          description: "Please upload your resume before submitting.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create form data for multipart submission
      const formData = new FormData();
      formData.append('resume', resumeFile);
      
      // Add application data
      const applicationData = {
        jobId: job.id,
        title: job.title,
        company: job.department,
        type: job.type,
        location: job.location,
        applicationEmail: job.applicationEmail,
        answers: questions
          .filter(q => q.type !== 'file')
          .map(q => ({
            questionId: q.id,
            question: q.question,
            answer: answers[q.id],
          })),
      };
      
      formData.append('application', JSON.stringify(applicationData));

      // Submit to backend
      const response = await fetch('/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      const data = await response.json();

      // Show success message
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
      });

      // Clear form
      setAnswers({});
      setResumeFile(null);
      // Reset file input
      const fileInput = document.getElementById('resume') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all jobs
      </Link>

      {/* Job header */}
      <div className="space-y-4">
        <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{job.title}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{job.department}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Department</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Location</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{job.type}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Employment Type</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>Posted on {formatDate(job.postedDate)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Posted Date</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Description</h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Responsibilities</h2>
            </CardHeader>
            <CardContent>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                {job.responsibilities.map((responsibility, index) => (
                  <li key={index}>{responsibility}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Requirements</h2>
            </CardHeader>
            <CardContent>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                {job.requirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {job.preferred && job.preferred.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Nice to Have</h2>
              </CardHeader>
              <CardContent>
                <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                  {job.preferred.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <h2 className="text-xl font-semibold">Apply for this job</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {job.salary && (
                <div>
                  <h3 className="text-sm font-medium">Salary Range</h3>
                  <Badge variant="secondary" className="mt-1">
                    {job.salary}
                  </Badge>
                </div>
              )}

              {/* Application Questions */}
              <div className="space-y-4">
                <h3 className="font-serif text-sm font-medium">Application Questions</h3>
                {(job.applicationQuestions || defaultQuestions).map((question) => (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={question.id} className="font-medium">
                      {question.question}
                    </Label>
                    {question.type === 'file' ? (
                      <div className="mt-2">
                        <Label
                          htmlFor={question.id}
                          className="relative cursor-pointer rounded-lg border border-dashed border-muted-foreground/20 p-4 hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Upload className="h-4 w-4" />
                            <span>{resumeFile ? resumeFile.name : "Upload Resume"}</span>
                          </div>
                          <Input
                            id={question.id}
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Accepted formats: PDF, DOC, DOCX (max 5MB)
                        </p>
                      </div>
                    ) : (
                      <Input
                        id={question.id}
                        type={question.type}
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder={`Enter ${question.type === 'url' ? 'URL' : question.type}...`}
                        className="border-muted-foreground/20"
                        {...(question.type === 'number' && question.id.match(/years_experience|notice_period/) ? { min: "0" } : {})}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Your application will be reviewed by our hiring team
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;