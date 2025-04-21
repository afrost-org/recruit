import { ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
}

const JobCard = ({ job }: JobCardProps) => {
  const navigate = useNavigate();
  const postedDate = new Date(job.postedDate);
  const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });

  const handleApply = () => {
    navigate(`/jobs/${job.id}`);
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex-none p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-semibold tracking-tight">{job.title}</h3>
          <Badge variant="outline">{job.type}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>{job.location}</span>
          <span>·</span>
          <span>{job.department}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-6 pt-0">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {job.shortDescription}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t p-6">
        <span className="text-xs text-muted-foreground">Posted {timeAgo}</span>
        <Button
          className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
          onClick={handleApply}
        >
          Apply Now <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JobCard;