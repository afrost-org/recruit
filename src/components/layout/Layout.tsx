import { ReactNode } from "react";
import Header from "./Header";
import { Card } from "@/components/ui/card";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Card className="mx-auto max-w-[1200px] border-0 shadow-none">
          <div className="px-4 py-8 md:px-6 md:py-12">
            {children}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Layout;