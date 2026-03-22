import { useEffect, useState, useMemo } from "react";
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
import { Download, Trash2, ChevronDown, Search, Archive } from "lucide-react";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";
import ApplicationDetail, {
  type ApplicationRecord,
} from "./ApplicationDetail";

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
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(
    null
  );
  const { toast } = useToast();

  const authHeaders = { "X-Admin-Password": password };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch("/api/admin/applications", {
          headers: authHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          setApplications(data);
        }
      } catch {
        toast({
          title: "Failed to fetch applications",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        const searchFields = [
          app.fullName,
          app.email,
          app.phone,
          app.currentRole,
          app.currentCompany,
        ];
        return searchFields.some(
          (f) => f && f.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [applications, search, statusFilter]);

  const grouped = useMemo(() => {
    const groups: Record<
      string,
      { title: string; apps: ApplicationRecord[] }
    > = {};
    for (const app of filtered) {
      if (!groups[app.jobId]) {
        groups[app.jobId] = { title: app.title, apps: [] };
      }
      groups[app.jobId].apps.push(app);
    }
    return groups;
  }, [filtered]);

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

  const [exportingJobs, setExportingJobs] = useState<Record<string, boolean>>({});

  const handleExportBundle = async (jobId: string, apps: ApplicationRecord[]) => {
    setExportingJobs((prev) => ({ ...prev, [jobId]: true }));
    try {
      const zip = new JSZip();

      // Fetch CSV
      const csvRes = await fetch(`/api/admin/export/${jobId}`, {
        headers: authHeaders,
      });
      if (csvRes.ok) {
        const csvBlob = await csvRes.blob();
        zip.file(`applications-${jobId}.csv`, csvBlob);
      }

      // Fetch all resumes in parallel
      const resumePromises = apps
        .filter((app) => app.resumeFileName)
        .map(async (app) => {
          try {
            const res = await fetch(`/getResume?file=${app.resumeFileName}`);
            if (res.ok) {
              const blob = await res.blob();
              const name = app.fullName
                ? `${app.fullName.replace(/[^a-zA-Z0-9]/g, "_")}_${app.resumeFileName}`
                : app.resumeFileName!;
              zip.file(`resumes/${name}`, blob);
            }
          } catch {
            // Skip failed downloads
          }
        });

      await Promise.all(resumePromises);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `applications-${jobId}-bundle.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Bundle downloaded" });
    } catch {
      toast({ title: "Bundle export failed", variant: "destructive" });
    } finally {
      setExportingJobs((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== id));
        toast({ title: "Application deleted" });
      } else {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
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

  if (isLoading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 space-y-6">
      <h1 className="font-serif text-3xl font-bold tracking-tight">
        Applications Dashboard
      </h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <div className="overflow-x-auto w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No applications found.
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([jobId, group]) => {
            const newCount = group.apps.filter(
              (a) => a.status === "new"
            ).length;
            return (
              <Collapsible key={jobId} defaultOpen>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4">
                  <CollapsibleTrigger className="flex items-center gap-2 font-semibold text-left">
                    <ChevronDown className="h-4 w-4 shrink-0" />
                    <span className="truncate">{group.title}</span>
                    {newCount > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800 hover:bg-blue-100 ml-2 shrink-0"
                      >
                        {newCount} new
                      </Badge>
                    )}
                    <span className="text-sm font-normal text-muted-foreground shrink-0">
                      ({group.apps.length} total)
                    </span>
                  </CollapsibleTrigger>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 sm:flex-initial"
                      onClick={() => handleExportCSV(jobId)}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 sm:flex-initial"
                      disabled={exportingJobs[jobId]}
                      onClick={() => handleExportBundle(jobId, group.apps)}
                    >
                      <Archive className="mr-1 h-4 w-4" />
                      {exportingJobs[jobId] ? "Bundling..." : "CSV + Resumes"}
                    </Button>
                  </div>
                </div>
                <CollapsibleContent>
                  {/* Mobile card layout */}
                  <div className="sm:hidden space-y-3 p-3 border border-t-0 rounded-b-lg">
                    {group.apps.map((app) => {
                      const resumeUrl = getResumeDownloadUrl(app);
                      return (
                        <div
                          key={app.id}
                          className="rounded-lg border p-4 space-y-2 cursor-pointer active:bg-muted/50"
                          onClick={() => setSelectedApp(app)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{app.fullName || "—"}</span>
                            <Badge
                              variant="outline"
                              className={statusColors[app.status] || ""}
                            >
                              {app.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{app.email || "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(app.submittedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <div className="flex gap-2 pt-1">
                            {resumeUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <a href={resumeUrl} download>
                                  <Download className="mr-1 h-4 w-4" />
                                  Resume
                                </a>
                              </Button>
                            )}
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
                                  <AlertDialogTitle>Delete application?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    className="border-input bg-secondary hover:bg-secondary/80"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(app.id);
                                    }}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Desktop table layout */}
                  <div className="hidden sm:block rounded-b-lg border border-t-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Experience</TableHead>
                          <TableHead>Current Role</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Resume</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.apps.map((app) => {
                          const resumeUrl = getResumeDownloadUrl(app);
                          return (
                            <TableRow
                              key={app.id}
                              className="cursor-pointer"
                              onClick={() => setSelectedApp(app)}
                            >
                              <TableCell className="font-medium">
                                {app.fullName || "—"}
                              </TableCell>
                              <TableCell>
                                {app.email || "—"}
                              </TableCell>
                              <TableCell>
                                {app.phone || "—"}
                              </TableCell>
                              <TableCell>
                                {app.yearsExperience ? `${app.yearsExperience} yrs` : "—"}
                              </TableCell>
                              <TableCell>
                                {app.currentRole || "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {new Date(
                                  app.submittedAt
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
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
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel
                                        className="border-input bg-secondary hover:bg-secondary/80"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(app.id);
                                        }}
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
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

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
