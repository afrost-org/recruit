import { ReactNode } from "react";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;