import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JobDetail from "@/components/jobs/JobDetail";
import jobsData from "@/data/jobs.json";
import { Job } from "@/types/job";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const JobPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching a specific job
    const loadJob = async () => {
      setIsLoading(true);
      // Add an artificial delay to simulate API loading
      await new Promise((resolve) => setTimeout(resolve, 800));
      const foundJob = jobsData.jobs.find((j) => j.id === jobId);

      if (foundJob) {
        setJob(foundJob);
      } else {
        // Redirect to homepage if job not found
        navigate("/", { replace: true });
      }
      setIsLoading(false);
    };

    loadJob();
  }, [jobId, navigate]);

  return (
    <div className="container py-12 md:py-16">
      {isLoading ? (
        <JobDetailSkeleton />
      ) : job ? (
        <JobDetail job={job} />
      ) : null}
    </div>
  );
};

const JobDetailSkeleton = () => {
  return (
    <div className="space-y-8">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobPage;