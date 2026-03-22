import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ApplicationRecord {
  id: string;
  jobId: string;
  title: string;
  type: string;
  location: string;
  email: string;
  submittedAt: string;
  status: string;
  resumeUrl?: string;
  answers: { question: string; answer: string }[];
}

interface ApplicationDetailProps {
  application: ApplicationRecord;
  password: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewed: "bg-yellow-100 text-yellow-800",
  shortlisted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const ApplicationDetail = ({
  application,
  password,
  open,
  onOpenChange,
  onStatusChange,
}: ApplicationDetailProps) => {
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Password": password,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onStatusChange(application.id, newStatus);
        toast({ title: "Status updated" });
      } else {
        toast({ title: "Failed to update status", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleCopyAll = () => {
    const questionsText = application.answers
      .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
      .join("\n\n");

    const text = `Position: ${application.title}
Type: ${application.type}
Location: ${application.location}
Email: ${application.email}
Status: ${application.status}
Submitted: ${new Date(application.submittedAt).toLocaleDateString()}

Questions:
${questionsText}

Resume: ${application.resumeUrl || "N/A"}`;

    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{application.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Type</span>
              <p>{application.type}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Location</span>
              <p>{application.location}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Email</span>
              <p>{application.email}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Submitted</span>
              <p>{new Date(application.submittedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Status</span>
              <Badge className={statusColors[application.status] || ""}>
                {application.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Answers</h3>
            {application.answers.map((a, i) => (
              <div key={i} className="rounded-md border p-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {a.question}
                </p>
                <p className="mt-1 text-sm">{a.answer}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={application.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {application.resumeUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={application.resumeUrl} download>
                  <Download className="mr-1 h-4 w-4" />
                  Resume
                </a>
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={handleCopyAll}>
              <Copy className="mr-1 h-4 w-4" />
              Copy All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetail;
