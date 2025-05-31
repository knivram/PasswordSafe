import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Shield } from "lucide-react";
import Link from "next/link";
import { MobileMenuToggle } from "@/components/mobile-menu-toggle";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Shield className="text-primary h-6 w-6" />
            <span className="text-xl font-bold">PasswordSafe</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Features
            </Link>
            <Link
              href="#security"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Security
            </Link>
          </nav>

          {/* Authentication Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <SignedOut>
              <Button variant="ghost" asChild>
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </SignedOut>

            <SignedIn>
              <Button variant="outline" asChild>
                <Link href="/app">Dashboard</Link>
              </Button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </SignedIn>
          </div>

          {/* Mobile Menu Toggle */}
          <MobileMenuToggle />
        </div>
      </div>
    </header>
  );
}
