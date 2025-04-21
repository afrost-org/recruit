import { useEffect, useState } from "react";
import JobList from "@/components/jobs/JobList";
import jobsData from "@/data/jobs.json";
import { Job } from "@/types/job";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const HomePage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setJobs(jobsData.jobs);
      setIsLoading(false);
    };

    loadJobs();
  }, []);

  return (
    <div className="mx-auto max-w-7xl py-8 md:py-12">
      <Card className="mx-auto max-w-3xl space-y-4 border-0 bg-transparent p-0 text-center shadow-none">
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          Find Your Next Opportunity
        </h1>
        <p className="text-lg text-muted-foreground">
          Discover exciting career opportunities at innovative companies hiring through Afrost. 
          Browse our curated job listings and take the next step in your professional journey.
        </p>
      </Card>

      <div className="mt-8 md:mt-12">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="h-64 p-6">
                <Skeleton className="h-full w-full" />
              </Card>
            ))}
          </div>
        ) : (
          <JobList jobs={jobs} />
        )}
      </div>
    </div>
  );
};

export default HomePage;