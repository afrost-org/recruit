import { useEffect, useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Trash2, ChevronDown, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ApplicationDetail, {
  type ApplicationRecord,
  getApplicantEmail,
} from "./ApplicationDetail";
import jobsData from "@/data/jobs.json";

interface AdminDashboardProps {
  password: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  reviewed: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  shortlisted: "bg-green-100 text-green-800 hover:bg-green-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
};

const AdminDashboard = ({ password }: AdminDashboardProps) => {
  const [applicationsByJob, setApplicationsByJob] = useState<
    Record<string, ApplicationRecord[]>
  >({});
  const [loadingJobs, setLoadingJobs] = useState<Record<string, boolean>>({});
  const [loadedJobs, setLoadedJobs] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(
    null
  );
  const { toast } = useToast();

  const authHeaders = { "X-Admin-Password": password };

  const fetchJobApplications = useCallback(
    async (jobId: string) => {
      if (loadedJobs[jobId] || loadingJobs[jobId]) return;
      setLoadingJobs((prev) => ({ ...prev, [jobId]: true }));
      try {
        const res = await fetch(`/api/admin/applications-by-job/${jobId}`, {
          headers: authHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          setApplicationsByJob((prev) => ({ ...prev, [jobId]: data }));
          setLoadedJobs((prev) => ({ ...prev, [jobId]: true }));
        }
      } catch {
        toast({
          title: `Failed to fetch applications for job`,
          variant: "destructive",
        });
      } finally {
        setLoadingJobs((prev) => ({ ...prev, [jobId]: false }));
      }
    },
    [loadedJobs, loadingJobs]
  );

  // Auto-load first few jobs on mount
  useEffect(() => {
    jobsData.jobs.slice(0, 3).forEach((job) => {
      fetchJobApplications(job.id);
    });
  }, []);

  const getFilteredApps = (jobId: string) => {
    const apps = applicationsByJob[jobId] || [];
    return apps.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        const email = getApplicantEmail(app).toLowerCase();
        const matchesAnswers = app.answers.some(
          (a) =>
            a.answer.toLowerCase().includes(term) ||
            a.question.toLowerCase().includes(term)
        );
        return matchesAnswers || email.includes(term);
      }
      return true;
    });
  };

  const handleExportCSV = async (jobId: string) => {
    try {
      const res = await fetch(`/api/admin/export/${jobId}`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `applications-${jobId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, jobId: string) => {
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        setApplicationsByJob((prev) => ({
          ...prev,
          [jobId]: (prev[jobId] || []).filter((a) => a.id !== id),
        }));
        toast({ title: "Application deleted" });
      } else {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    setApplicationsByJob((prev) => {
      const updated = { ...prev };
      for (const jobId in updated) {
        updated[jobId] = updated[jobId].map((a) =>
          a.id === id ? { ...a, status } : a
        );
      }
      return updated;
    });
    if (selectedApp?.id === id) {
      setSelectedApp((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const getResumeDownloadUrl = (app: ApplicationRecord) => {
    if (app.resumeFileName) {
      return `/getResume?file=${app.resumeFileName}`;
    }
    return app.resumeUrl || null;
  };

  return (
    <div className="container py-8 space-y-6">
      <h1 className="font-serif text-3xl font-bold tracking-tight">
        Applications Dashboard
      </h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {jobsData.jobs.map((job) => {
          const apps = getFilteredApps(job.id);
          const isLoading = loadingJobs[job.id];
          const isLoaded = loadedJobs[job.id];
          const allApps = applicationsByJob[job.id] || [];
          const newCount = allApps.filter((a) => a.status === "new").length;

          return (
            <Collapsible
              key={job.id}
              defaultOpen
              onOpenChange={(open) => {
                if (open) fetchJobApplications(job.id);
              }}
            >
              <div className="flex items-center justify-between rounded-lg border p-4">
                <CollapsibleTrigger className="flex items-center gap-2 font-semibold">
                  <ChevronDown className="h-4 w-4" />
                  {job.title}
                  {newCount > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 hover:bg-blue-100 ml-2"
                    >
                      {newCount} new
                    </Badge>
                  )}
                  {isLoaded && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({allApps.length} total)
                    </span>
                  )}
                </CollapsibleTrigger>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExportCSV(job.id)}
                >
                  <Download className="mr-1 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <CollapsibleContent>
                <div className="rounded-b-lg border border-t-0">
                  {isLoading ? (
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : apps.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">
                      {isLoaded
                        ? "No applications found."
                        : "Loading..."}
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Resume</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {apps.map((app) => {
                          const resumeUrl = getResumeDownloadUrl(app);
                          return (
                            <TableRow
                              key={app.id}
                              className="cursor-pointer"
                              onClick={() => setSelectedApp(app)}
                            >
                              <TableCell>
                                {new Date(
                                  app.submittedAt
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell>
                                {getApplicantEmail(app)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    statusColors[app.status] || ""
                                  }
                                >
                                  {app.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {resumeUrl ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <a href={resumeUrl} download>
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete application?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This
                                        will permanently delete this
                                        application.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDelete(app.id, app.jobId)
                                        }
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {selectedApp && (
        <ApplicationDetail
          application={selectedApp}
          password={password}
          open={!!selectedApp}
          onOpenChange={(open) => {
            if (!open) setSelectedApp(null);
          }}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
