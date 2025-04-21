import { Snowflake } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-background py-8">
      <div className="container grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Snowflake className="h-5 w-5" />
            <span className="text-lg font-bold">Afrost</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Pioneering the future of technology through innovation and exceptional talent.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Jobs</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                All Jobs
              </Link>
            </li>
            <li>
              <Link
                to="/?department=Engineering"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Engineering
              </Link>
            </li>
            <li>
              <Link
                to="/?department=Design"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Design
              </Link>
            </li>
            <li>
              <Link
                to="/?department=Product"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Product
              </Link>
            </li>
            <li>
              <Link
                to="/?department=Marketing"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Marketing
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/about"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                to="/culture"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Culture
              </Link>
            </li>
            <li>
              <Link
                to="/benefits"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Benefits
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/privacy"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mt-8 border-t pt-4">
        <p className="text-center text-xs text-muted-foreground">
          © {currentYear} Afrost, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;