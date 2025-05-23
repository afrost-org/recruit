import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";

// Lazy load pages
const HomePage = lazy(() => import("@/pages/HomePage"));
const JobPage = lazy(() => import("@/pages/JobPage"));

// Fallback loading component
const PageSkeleton = () => (
  <div className="container py-8 md:py-12">
    <div className="mx-auto max-w-3xl space-y-4 text-center">
      <Skeleton className="mx-auto h-10 w-64" />
      <Skeleton className="mx-auto h-4 w-96" />
    </div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="h-64 p-6">
          <Skeleton className="h-full w-full" />
        </Card>
      ))}
    </div>
  </div>
);

function App() {
  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs/:jobId" element={<JobPage />} />
        </Routes>
      </Suspense>
      <Toaster />
    </Layout>
  );
}

export default App;