import {
  Shield,
  Lock,
  Key,
  Globe,
  Eye,
  Users,
  Zap,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { LandingHeader } from "@/components/landing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4">
              Zero-Knowledge Architecture
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Secure Your Digital Life with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                PasswordSafe
              </span>
            </h1>
            <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg sm:text-xl">
              The only password manager you&apos;ll ever need. Enterprise-grade
              encryption, zero-knowledge architecture, and seamless user
              experience.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">Get Started for Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 mx-0 max-w-none overflow-hidden">
          <div className="absolute top-0 left-1/2 ml-[-38rem] h-[25rem] w-[81.25rem] dark:[mask-image:linear-gradient(white,transparent)]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-300/30 to-purple-300/30 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-40 dark:from-blue-400/30 dark:to-purple-400/30" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Enterprise-Grade Security
            </h2>
            <p className="text-muted-foreground mb-16 text-lg">
              Built with the most advanced cryptographic standards to protect
              your sensitive data.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Zero-Knowledge Architecture</CardTitle>
                <CardDescription>
                  Your master password and secrets never leave your device. Even
                  we can&apos;t access your data.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <CardTitle>4096-bit RSA Encryption</CardTitle>
                <CardDescription>
                  Military-grade encryption with RSA key pairs generated locally
                  using Web Crypto API.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-600">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Advanced Key Management</CardTitle>
                <CardDescription>
                  PBKDF2 with 100,000 iterations and AES-GCM encryption for
                  maximum security.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-600">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Secure Vaults</CardTitle>
                <CardDescription>
                  Organize your secrets in encrypted vaults with granular access
                  control.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-600">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Privacy by Design</CardTitle>
                <CardDescription>
                  No tracking, no analytics, no data mining. Your privacy is our
                  priority.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
              <CardHeader>
                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Secure Authentication</CardTitle>
                <CardDescription>
                  Multi-layered authentication with Clerk and your master
                  password.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="text-muted-foreground mb-16 text-lg">
              Simple steps to ultimate security
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-white">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Create Your Account
              </h3>
              <p className="text-muted-foreground">
                Sign up with secure authentication and create your master
                password
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-white">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Generate Key Pair</h3>
              <p className="text-muted-foreground">
                Your device generates a unique 4096-bit RSA key pair locally
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-white">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Store Securely</h3>
              <p className="text-muted-foreground">
                Add your passwords and secrets to encrypted vaults
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section id="security" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
                Built for Security Professionals
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Every aspect of PasswordSafe is designed with security-first
                principles, following industry best practices and cryptographic
                standards.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-semibold">Client-Side Encryption</h4>
                    <p className="text-muted-foreground text-sm">
                      All encryption happens in your browser using Web Crypto
                      API
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-semibold">PBKDF2 Key Derivation</h4>
                    <p className="text-muted-foreground text-sm">
                      100,000 iterations with SHA-256 for brute force resistance
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-semibold">AES-GCM Encryption</h4>
                    <p className="text-muted-foreground text-sm">
                      256-bit authenticated encryption for data protection
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-semibold">Memory Security</h4>
                    <p className="text-muted-foreground text-sm">
                      Sensitive data is cleared from memory when not needed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mb-4 text-2xl font-bold">Enterprise Ready</h3>
                <p className="mb-6 text-blue-100">
                  Built with modern security features and designed to scale,
                  making it perfect for both individuals and growing teams.
                </p>
                <Button variant="secondary" asChild>
                  <Link href="/auth/sign-up">Sign Up</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Secure Your Digital Life?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join thousands of users who trust PasswordSafe with their most
              sensitive data.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Shield className="text-primary h-6 w-6" />
              <span className="text-xl font-bold">PasswordSafe</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 PasswordSafe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
