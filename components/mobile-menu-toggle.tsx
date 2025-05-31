"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MobileMenuToggle() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="bg-background absolute top-full right-0 left-0 border-t py-4 md:hidden">
          <div className="container mx-auto px-4">
            <nav className="flex flex-col gap-4">
              <Link
                href="#features"
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#security"
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Security
              </Link>

              <div className="flex flex-col gap-2 pt-4">
                <SignedOut>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/auth/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild className="justify-start">
                    <Link href="/auth/sign-up">Get Started</Link>
                  </Button>
                </SignedOut>

                <SignedIn>
                  <Button variant="outline" asChild className="justify-start">
                    <Link href="/app">Dashboard</Link>
                  </Button>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "h-8 w-8",
                        },
                      }}
                    />
                    <span className="text-sm">Account</span>
                  </div>
                </SignedIn>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
