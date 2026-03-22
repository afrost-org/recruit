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

// Lightweight summary from KV metadata
interface AppSummary {
  id: string;
  jobId: string;
  status: string;
  submittedAt: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  reviewed: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  shortlisted: "bg-green-100 text-green-800 hover:bg-green-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
};

const jobTitleMap: Record<string, string> = {};
for (const job of jobsData.jobs) {
  jobTitleMap[job.id] = job.title;
}

const AdminDashboard = ({ password }: AdminDashboardProps) => {
  const [summaries, setSummaries] = useState<AppSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { toast } = useToast();

  const authHeaders = { "X-Admin-Password": password };

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await fetch("/api/admin/applications", {
          headers: authHeaders,
        });
        if (res.ok) {
          const data = await res.json();
          setSummaries(data);
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
    fetchSummaries();
  }, []);

  const filtered = useMemo(() => {
    return summaries.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      return true;
    });
  }, [summaries, statusFilter]);

  const grouped = useMemo(() => {
    const groups: Record<
      string,
      { title: string; apps: AppSummary[] }
    > = {};
    for (const app of filtered) {
      if (!groups[app.jobId]) {
        groups[app.jobId] = {
          title: jobTitleMap[app.jobId] || app.jobId,
          apps: [],
        };
      }
      groups[app.jobId].apps.push(app);
    }
    return groups;
  }, [filtered]);

  const handleViewDetail = async (appId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/applications/${appId}`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedApp(data);
      } else {
        toast({ title: "Failed to load application", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to load application", variant: "destructive" });
    } finally {
      setLoadingDetail(false);
    }
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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        setSummaries((prev) => prev.filter((a) => a.id !== id));
        toast({ title: "Application deleted" });
      } else {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    setSummaries((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    if (selectedApp?.id === id) {
      setSelectedApp((prev) => (prev ? { ...prev, status } : null));
    }
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
    <div className="container py-8 space-y-6">
      <h1 className="font-serif text-3xl font-bold tracking-tight">
        Applications Dashboard
      </h1>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
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
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <CollapsibleTrigger className="flex items-center gap-2 font-semibold">
                    <ChevronDown className="h-4 w-4" />
                    {group.title}
                    {newCount > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800 hover:bg-blue-100 ml-2"
                      >
                        {newCount} new
                      </Badge>
                    )}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({group.apps.length} total)
                    </span>
                  </CollapsibleTrigger>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExportCSV(jobId)}
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
                <CollapsibleContent>
                  <div className="rounded-b-lg border border-t-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.apps.map((app) => (
                          <TableRow
                            key={app.id}
                            className="cursor-pointer"
                            onClick={() => handleViewDetail(app.id)}
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
                              <Badge
                                variant="outline"
                                className={statusColors[app.status] || ""}
                              >
                                {app.status}
                              </Badge>
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
                                      onClick={() => handleDelete(app.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
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
