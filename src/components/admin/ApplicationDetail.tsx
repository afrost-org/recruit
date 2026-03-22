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
  applicationEmail?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  yearsExperience?: string;
  currentRole?: string;
  currentCompany?: string;
  linkedin?: string;
  noticePeriod?: string;
  submittedAt: string;
  status: string;
  resumeUrl?: string;
  resumeFileName?: string;
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

  const resumeDownloadUrl = application.resumeFileName
    ? `/getResume?file=${application.resumeFileName}`
    : application.resumeUrl || null;

  const handleCopyAll = () => {
    const text = `Position: ${application.title}
Type: ${application.type}
Location: ${application.location}

Name: ${application.fullName || "—"}
Email: ${application.email || "—"}
Phone: ${application.phone || "—"}
Years of Experience: ${application.yearsExperience || "—"}
Current Role: ${application.currentRole || "—"}
Current Company: ${application.currentCompany || "—"}
LinkedIn: ${application.linkedin || "—"}
Notice Period: ${application.noticePeriod || "—"} weeks

Status: ${application.status}
Submitted: ${new Date(application.submittedAt).toLocaleDateString()}
Resume: ${resumeDownloadUrl ? window.location.origin + resumeDownloadUrl : "N/A"}`;

    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const fields = [
    { label: "Full Name", value: application.fullName },
    { label: "Email", value: application.email },
    { label: "Phone", value: application.phone },
    { label: "Years of Experience", value: application.yearsExperience },
    { label: "Current Role", value: application.currentRole },
    { label: "Current Company", value: application.currentCompany },
    {
      label: "LinkedIn",
      value: application.linkedin,
      isLink: true,
    },
    { label: "Notice Period", value: application.noticePeriod ? `${application.noticePeriod} weeks` : undefined },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{application.fullName || application.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{application.title} &middot; {application.location}</p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {fields.map((f) => (
              <div key={f.label}>
                <span className="font-medium text-muted-foreground">
                  {f.label}
                </span>
                {f.isLink && f.value ? (
                  <p>
                    <a
                      href={f.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {f.value}
                    </a>
                  </p>
                ) : (
                  <p>{f.value || "—"}</p>
                )}
              </div>
            ))}
            <div>
              <span className="font-medium text-muted-foreground">
                Submitted
              </span>
              <p>
                {new Date(application.submittedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Status</span>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={statusColors[application.status] || ""}
                >
                  {application.status}
                </Badge>
              </div>
            </div>
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

            {resumeDownloadUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={resumeDownloadUrl} download>
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
