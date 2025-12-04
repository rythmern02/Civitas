"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useMockStore, type Employee } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { StatusBadge } from "@/components/ui/status-badge"
import { Search, Plus, Upload, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function EmployeesList() {
  const { employees, addEmployee } = useMockStore()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "terminated">("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [showCsvPreview, setShowCsvPreview] = useState(false)

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) || emp.email.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || emp.status === filter
    return matchesSearch && matchesFilter
  })

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const rows = text.split("\n").map((row) => row.split(","))
        setCsvData(rows)
        setShowCsvPreview(true)
      }
      reader.readAsText(file)
    }
  }

  const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newEmployee: Employee = {
      id: `emp_${Date.now()}`,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      startDate: new Date().toISOString().split("T")[0],
      salaryCurrency: "ZEC",
      avatarColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      basePay: Number.parseFloat(formData.get("basePay") as string) || 1000,
      status: "active",
      employmentCredential: {
        credId: `cred_${Date.now()}`,
        issuedBy: "DemoOrg",
        issuedAt: new Date().toISOString().split("T")[0],
        hash: `0x${Math.random().toString(16).slice(2, 10)}`,
      },
    }
    addEmployee(newEmployee)
    setShowAddModal(false)
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Employees from CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input type="file" accept=".csv" onChange={handleCsvUpload} />
                {showCsvPreview && csvData.length > 0 && (
                  <div className="max-h-64 overflow-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          {csvData[0].map((header, i) => (
                            <th key={i} className="px-4 py-2 text-left">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(1).map((row, i) => (
                          <tr key={i} className="border-t border-border">
                            {row.map((cell, j) => (
                              <td key={j} className="px-4 py-2">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Button className="w-full">Save to Mock Store</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@demo.co" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" name="role" placeholder="Software Engineer" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basePay">Base Pay (ZEC)</Label>
                  <Input id="basePay" name="basePay" type="number" placeholder="1000" required />
                </div>
                <Button type="submit" className="w-full">
                  Add Employee
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
          {(["all", "active", "terminated"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-muted/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarInitials name={emp.name} color={emp.avatarColor} size="sm" />
                      <div>
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-sm text-muted-foreground">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{emp.role}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    {new Date(emp.startDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={emp.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link href={`/employer/employees/${emp.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
