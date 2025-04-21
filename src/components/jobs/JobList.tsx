import { useState, useEffect } from "react";
import JobCard from "./JobCard";
import { Job } from "@/types/job";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface JobListProps {
  jobs: Job[];
}

const JobList = ({ jobs }: JobListProps) => {
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [uniqueDepartments, setUniqueDepartments] = useState<string[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(jobs);

  // Extract unique departments
  useEffect(() => {
    const departments = ["All", ...new Set(jobs.map((job) => job.department))];
    setUniqueDepartments(departments);
  }, [jobs]);

  // Filter jobs by department
  useEffect(() => {
    if (departmentFilter === "All") {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(
        jobs.filter((job) => job.department === departmentFilter)
      );
    }
  }, [departmentFilter, jobs]);

  return (
    <div className="space-y-6">
      <Tabs
        defaultValue={departmentFilter}
        className="w-full"
        onValueChange={setDepartmentFilter}
      >
        <TabsList
          className={cn(
            "inline-flex h-auto w-full flex-wrap justify-start gap-2 rounded-lg bg-transparent p-0",
            uniqueDepartments.length > 5 && "md:justify-center"
          )}
        >
          {uniqueDepartments.map((department) => (
            <TabsTrigger
              key={department}
              value={department}
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {department}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={departmentFilter} className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobList;