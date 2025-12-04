"use client"
import { LoginForm } from "@/components/auth/login-form"
import { Shield } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary-foreground">Civitas</span>
        </Link>

        <div>
          <blockquote className="space-y-4">
            <p className="text-lg leading-relaxed text-primary-foreground/90">
              "Privacy isn't about hiding something. It's about protecting the dignity and autonomy of individuals in an
              increasingly transparent world."
            </p>
            <footer className="text-sm text-primary-foreground/70">— Privacy First Manifesto</footer>
          </blockquote>
        </div>

        <p className="text-sm text-primary-foreground/70">Zero-knowledge payroll for the decentralized era</p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Civitas</span>
            </Link>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mb-8 text-muted-foreground">Sign in to your account to continue</p>
          

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
