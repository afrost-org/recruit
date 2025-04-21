import { useEffect, useState } from "react";
import JobList from "@/components/jobs/JobList";
import jobsData from "@/data/jobs.json";
import { Job } from "@/types/job";

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
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          Join Afrost
        </h1>
        <p className="text-lg text-muted-foreground">
          Be part of our mission to revolutionize technology. Explore our open positions
          and find your next opportunity with us.
        </p>
      </div>

      <div className="mt-8 md:mt-12">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-64 rounded-lg bg-muted p-6 animate-pulse"
              />
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