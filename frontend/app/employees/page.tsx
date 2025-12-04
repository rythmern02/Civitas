import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SESSION_COOKIE, verifySession } from "@/lib/server/session"

export default async function EmployeesIndexPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) redirect("/login")
  const session = await verifySession(token)
  if (!session) redirect("/login")
  redirect(`/employees/${session.sub}`)
}

