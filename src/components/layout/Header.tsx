import { cn } from "@/lib/utils";
import { Snowflake } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Snowflake className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">Afrost</span>
          </div>
        </div>

        <Button
          className={cn(
            "transition-all duration-200",
            isMenuOpen && "bg-secondary hover:bg-secondary/80"
          )}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          Apply Now
        </Button>
      </div>
    </header>
  );
};

export default Header;