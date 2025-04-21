import { ArrowLeft, Building2, CalendarDays, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Job } from "@/types/job";

interface JobDetailProps {
  job: Job;
}

const JobDetail = ({ job }: JobDetailProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMMM d, yyyy");
  };

  const handleApply = () => {
    window.location.href = `mailto:${job.applicationEmail}?subject=Application for ${job.title} Position&body=Hello,%0D%0A%0D%0AI am interested in applying for the ${job.title} position. Please find my resume attached.%0D%0A%0D%0AThank you,%0D%0A[Your Name]`;
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
        <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{job.department}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{job.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Posted on {formatDate(job.postedDate)}</span>
          </div>
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
              <p className="text-muted-foreground">{job.description}</p>
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
            <CardContent className="space-y-4">
              {job.salary && (
                <div>
                  <h3 className="text-sm font-medium">Salary Range</h3>
                  <p className="text-muted-foreground">{job.salary}</p>
                </div>
              )}
              <Button className="w-full" size="lg" onClick={handleApply}>
                Apply Now
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                You'll be redirected to send an email application
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;