"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Copy } from "lucide-react"
import Link from "next/link"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { validateCredentialFile, type CredentialFile } from "@/lib/identity"

type LoginMethod = "password" | "tag" | "credential"

const DEMO_ACCOUNTS = [
  { label: "Employer demo", username: "employer_demo", password: "demo123!", note: "Full employer dashboard" },
  { label: "Employee demo", username: "employee_priya", password: "demo123!", note: "Voucher wallet" },
  { label: "Auditor demo", username: "auditor_karthik", password: "demo123!", note: "Auditor console" },
]

export function LoginForm() {
  const router = useRouter()
  const { login, refresh } = useAuth()
  const [method, setMethod] = useState<LoginMethod>("password")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [employeeTag, setEmployeeTag] = useState("")
  const [credentialSecret, setCredentialSecret] = useState("")
  const [credentialFile, setCredentialFile] = useState<CredentialFile | null>(null)
  const [credentialFileName, setCredentialFileName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const fillDemoAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setMethod("password")
    setUsername(account.username)
    setPassword(account.password)
  }

  const handleCredentialUpload = async (file: File) => {
    setError("")
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!validateCredentialFile(parsed)) {
        throw new Error("Malformed credential file")
      }
      setCredentialFile(parsed)
      setCredentialFileName(file.name)
    } catch (err: any) {
      setCredentialFile(null)
      setCredentialFileName("")
      setError(err.message || "Unable to load credential")
    }
  }

  const navigateForRole = (role: UserRole, id?: string) => {
    switch (role) {
      case "employer":
        router.push("/employer/dashboard")
        break
      case "auditor":
        router.push("/auditors")
        break
      default:
        router.push(`/employees/${id ?? ""}`)
        break
    }
  }

  const submitZkLogin = async () => {
    const res = await fetch("/api/auth/zk-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "tag",
        employee_tag: employeeTag.trim(),
        proof: { nonce: credentialSecret.trim() },
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "ZK login failed")
    }
    return await refresh()
  }

  const submitCredentialLogin = async () => {
    if (!credentialFile) throw new Error("Select credential file")
    const res = await fetch("/api/auth/zk-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "credential",
        employee_tag: credentialFile.employee_tag,
        credential: credentialFile,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Credential login failed")
    }
    return await refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      if (method === "password") {
        const user = await login(username, password)
        navigateForRole(user.role as UserRole, user.id)
      } else if (method === "tag") {
        const refreshed = await submitZkLogin()
        if (refreshed) navigateForRole(refreshed.role as UserRole, refreshed.id)
      } else {
        const refreshed = await submitCredentialLogin()
        if (refreshed) navigateForRole(refreshed.role as UserRole, refreshed.id)
      }
    } catch (err: any) {
      setError(err.message || "Unable to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  const methodDescription: Record<LoginMethod, string> = {
    password: "Use your provisioned username and one-time password",
    tag: "Present your employee tag + credential secret",
    credential: "Upload the zkPassport credential bundle",
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["password", "tag", "credential"] as LoginMethod[]).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setMethod(opt)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              method === opt ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            }`}
          >
            {opt === "password" && "Username"}
            {opt === "tag" && "Employee Tag"}
            {opt === "credential" && "Credential"}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{methodDescription[method]}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {method === "password" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="emp_priya"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {method === "tag" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="employee_tag">Employee Tag</Label>
              <Input
                id="employee_tag"
                placeholder="0xabc123..."
                value={employeeTag}
                onChange={(e) => setEmployeeTag(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credential_secret">Credential Secret (nonce)</Label>
              <Input
                id="credential_secret"
                placeholder="Paste credential nonce"
                value={credentialSecret}
                onChange={(e) => setCredentialSecret(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {method === "credential" && (
          <div className="space-y-2">
            <Label htmlFor="credential_file">zkPassport Credential (.json)</Label>
            <Input
              id="credential_file"
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleCredentialUpload(file)
              }}
            />
            {credentialFileName && (
              <p className="text-xs text-muted-foreground">Loaded: {credentialFileName}</p>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Need access?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Provision employees
        </Link>
      </p>

      <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Demo accounts</div>
        <div className="grid gap-2">
          {DEMO_ACCOUNTS.map((acct) => (
            <button
              key={acct.username}
              type="button"
              onClick={() => fillDemoAccount(acct)}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-left hover:bg-muted"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{acct.label}</p>
                <p className="text-xs text-muted-foreground">{acct.note}</p>
                <p className="text-xs text-muted-foreground">
                  {acct.username} / <span className="font-mono">{acct.password}</span>
                </p>
              </div>
              <Copy className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
