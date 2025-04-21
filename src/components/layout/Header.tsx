import { Snowflake } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <div className="flex h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <Snowflake className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">Afrost</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;