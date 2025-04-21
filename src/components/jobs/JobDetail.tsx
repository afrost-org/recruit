import { ArrowLeft, Building2, CalendarDays, Clock, MapPin, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Job } from "@/types/job";
import { useState } from "react";

interface JobDetailProps {
  job: Job;
}

const JobDetail = ({ job }: JobDetailProps) => {
  const [copied, setCopied] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMMM d, yyyy");
  };

  const emailSubject = `Application for ${job.title} Position`;

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
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

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${job.applicationEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(formatEmailBody())}`;
    window.open(mailtoUrl, '_blank');
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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{job.title}</h1>
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
              {job.applicationQuestions && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Application Questions</h3>
                  {job.applicationQuestions.map((question) => (
                    <div key={question.id} className="space-y-2">
                      <Label htmlFor={question.id}>
                        {question.question}
                      </Label>
                      {question.type === 'text' ? (
                        <Textarea
                          id={question.id}
                          rows={3}
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Your answer..."
                        />
                      ) : (
                        <Input
                          id={question.id}
                          type={question.type}
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder={`Enter ${question.type === 'url' ? 'URL' : 'email address'}...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Application Email</h3>
                    <Button
                      onClick={handleCopy}
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          <span>Copy Details</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground break-all">{job.applicationEmail}</p>
                </div>
                <Button
                  onClick={handleApply}
                  className="w-full"
                >
                  Apply Now
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Click Apply Now to open your email client, or copy the details to apply manually
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;