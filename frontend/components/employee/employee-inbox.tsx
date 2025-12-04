"use client"

import { useState } from "react"
import Link from "next/link"
import { useMockStore } from "@/lib/mock-store"
import { StatusBadge } from "@/components/ui/status-badge"
import { Lock, Eye, Calendar, ArrowRight, Inbox } from "lucide-react"

const TABS = ["All", "Unopened", "Opened"]

export function EmployeeInbox() {
  const [activeTab, setActiveTab] = useState("All")
  const { notes, payrollRuns } = useMockStore()

  const employeeId = "emp_001"
  const myNotes = notes.filter((n) => n.recipientId === employeeId)

  const filteredNotes = activeTab === "All" ? myNotes : myNotes.filter((n) => n.status === activeTab)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
        <p className="text-muted-foreground">Your encrypted payroll notes</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/50 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {tab !== "All" && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {myNotes.filter((n) => n.status === tab).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notes List */}
      <div className="rounded-xl border border-border bg-card">
        {filteredNotes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Inbox className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No notes found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotes.map((note) => {
              const run = payrollRuns.find((r) => r.runId === note.runId)
              return (
                <Link
                  key={note.noteId}
                  href={`/employee/inbox/${note.noteId}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      note.status === "Unopened" ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    {note.status === "Unopened" ? (
                      <Lock className="h-6 w-6 text-primary" />
                    ) : (
                      <Eye className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">Payroll Note</p>
                      <StatusBadge status={note.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(note.deliveredAt).toLocaleDateString()}
                      </span>
                      <span>Run: {note.runId.slice(-8)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {note.status === "Opened" && note.decryptedAmount
                        ? `${note.decryptedAmount} ZEC`
                        : note.maskedAmount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {note.status === "Unopened" ? "Tap to reveal" : "Revealed"}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
