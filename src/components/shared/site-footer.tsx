// ============================================================
// Shared Site Footer — Trust Links & Legal Pages
// Used across all public pages for consistent navigation
// ============================================================
import Link from "next/link";

interface SiteFooterProps {
  /** Variant for different page contexts */
  variant?: "default" | "store";
  /** Creator display name (for store variant) */
  creatorName?: string;
  /** Creator username (for store variant back-link) */
  username?: string;
}

export function SiteFooter({ variant = "default", creatorName, username }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === "store") {
    return (
      <footer className="border-t mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Powered by{" "}
                <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Keevan Store
                </Link>
              </span>
              {creatorName && username && (
                <span>
                  <Link
                    href={`/store/${username}`}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Visit {creatorName}&apos;s store
                  </Link>
                </span>
              )}
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legal">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact Us
              </Link>
            </nav>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            &copy; {currentYear} Keevan Store. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Top row: Brand + Legal links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2" aria-label="Keevan Store Home">
                <div className="h-6 w-6 rounded-md bg-emerald-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">K</span>
                </div>
                <span className="text-sm font-medium text-foreground">Keevan Store</span>
              </Link>
            </div>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" aria-label="Footer navigation">
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </Link>
            </nav>
          </div>

          {/* Bottom row: Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              &copy; {currentYear} Keevan Store. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Payments processed securely by Pesapal. All prices in UGX.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
