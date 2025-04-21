import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";

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
        <div
          key={index}
          className="h-64 rounded-lg bg-muted p-6 animate-pulse"
        />
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
    </Layout>
  );
}

export default App;