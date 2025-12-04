"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Employee {
  id: string
  name: string
  email: string
  role: string
  startDate: string
  salaryCurrency: string
  avatarColor: string
  basePay: number
  status: "active" | "terminated"
  employmentCredential: {
    credId: string
    issuedBy: string
    issuedAt: string
    hash: string
  }
}

export interface PayrollEvent {
  ts: string
  text: string
}

export interface PayrollRun {
  runId: string
  orgId: string
  createdBy: string
  createdAt: string
  status: "Draft" | "Committed" | "Settled"
  employeeCount: number
  declaredTotal: string
  currency: string
  payrollRoot: string
  proofHash: string
  notes: string[]
  events: PayrollEvent[]
}

export interface Note {
  noteId: string
  runId: string
  recipientId: string
  ciphertext: string
  maskedAmount: string
  decryptedAmount?: string
  memo?: string
  status: "Unopened" | "Opened"
  deliveredAt: string
}

export interface Auditor {
  auditorId: string
  name: string
  email: string
  pubkeyFingerprint: string
  status: "Registered" | "Pending"
}

interface MockStoreContextType {
  employees: Employee[]
  payrollRuns: PayrollRun[]
  notes: Note[]
  auditors: Auditor[]
  addEmployee: (employee: Employee) => void
  addPayrollRun: (run: PayrollRun) => void
  updatePayrollRun: (runId: string, updates: Partial<PayrollRun>) => void
  addNote: (note: Note) => void
  updateNote: (noteId: string, updates: Partial<Note>) => void
  addAuditor: (auditor: Auditor) => void
}

const MockStoreContext = createContext<MockStoreContextType | undefined>(undefined)

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "emp_001",
    name: "Priya Sharma",
    email: "priya@demo.co",
    role: "Software Engineer",
    startDate: "2023-09-01",
    salaryCurrency: "ZEC",
    avatarColor: "#7C3AED",
    basePay: 1200,
    status: "active",
    employmentCredential: {
      credId: "cred_emp_001",
      issuedBy: "DemoOrg",
      issuedAt: "2025-10-01",
      hash: "0xabc123",
    },
  },
  {
    id: "emp_002",
    name: "Arjun Patel",
    email: "arjun@demo.co",
    role: "Product Manager",
    startDate: "2022-04-15",
    salaryCurrency: "ZEC",
    avatarColor: "#0EA5A4",
    basePay: 1500,
    status: "active",
    employmentCredential: {
      credId: "cred_emp_002",
      issuedBy: "DemoOrg",
      issuedAt: "2025-10-01",
      hash: "0xdef456",
    },
  },
  {
    id: "emp_003",
    name: "Sana Iyer",
    email: "sana@demo.co",
    role: "Designer",
    startDate: "2024-01-10",
    salaryCurrency: "ZEC",
    avatarColor: "#F97316",
    basePay: 1100,
    status: "active",
    employmentCredential: {
      credId: "cred_emp_003",
      issuedBy: "DemoOrg",
      issuedAt: "2025-10-01",
      hash: "0xghi789",
    },
  },
]

const INITIAL_PAYROLL_RUNS: PayrollRun[] = [
  {
    runId: "run_2025_11_01_01",
    orgId: "demo_org",
    createdBy: "employer@demo",
    createdAt: "2025-11-01T09:00:00Z",
    status: "Committed",
    employeeCount: 3,
    declaredTotal: "3800.00",
    currency: "ZEC",
    payrollRoot: "0xrootabc",
    proofHash: "0xproof123",
    notes: ["note_001", "note_002", "note_003"],
    events: [
      { ts: "2025-11-01T09:01:00Z", text: "Compute completed" },
      { ts: "2025-11-01T09:02:00Z", text: "Proof generated" },
      { ts: "2025-11-01T09:03:00Z", text: "Committed to verifier (simulated)" },
      { ts: "2025-11-01T09:05:00Z", text: "Axelar message emitted (simulated)" },
      { ts: "2025-11-01T09:10:00Z", text: "Wrapped ZEC minted on target chain (simulated)" },
    ],
  },
  {
    runId: "run_2025_10_01_01",
    orgId: "demo_org",
    createdBy: "employer@demo",
    createdAt: "2025-10-01T09:00:00Z",
    status: "Settled",
    employeeCount: 3,
    declaredTotal: "3600.00",
    currency: "ZEC",
    payrollRoot: "0xroot789",
    proofHash: "0xproof456",
    notes: ["note_004", "note_005", "note_006"],
    events: [
      { ts: "2025-10-01T09:01:00Z", text: "Compute completed" },
      { ts: "2025-10-01T09:02:00Z", text: "Proof generated" },
      { ts: "2025-10-01T09:03:00Z", text: "Committed to verifier (simulated)" },
      { ts: "2025-10-01T09:05:00Z", text: "Axelar message emitted (simulated)" },
      { ts: "2025-10-01T09:10:00Z", text: "Settlement complete (simulated)" },
    ],
  },
]

const INITIAL_NOTES: Note[] = [
  {
    noteId: "note_001",
    runId: "run_2025_11_01_01",
    recipientId: "emp_001",
    ciphertext: btoa(JSON.stringify({ amount: 1200, memo: "November Salary", nullifier: "null_001" })),
    maskedAmount: "*** ZEC",
    status: "Unopened",
    deliveredAt: "2025-11-01T09:05:00Z",
  },
  {
    noteId: "note_002",
    runId: "run_2025_11_01_01",
    recipientId: "emp_002",
    ciphertext: btoa(JSON.stringify({ amount: 1500, memo: "November Salary", nullifier: "null_002" })),
    maskedAmount: "*** ZEC",
    status: "Unopened",
    deliveredAt: "2025-11-01T09:05:00Z",
  },
  {
    noteId: "note_003",
    runId: "run_2025_11_01_01",
    recipientId: "emp_003",
    ciphertext: btoa(JSON.stringify({ amount: 1100, memo: "November Salary", nullifier: "null_003" })),
    maskedAmount: "*** ZEC",
    status: "Unopened",
    deliveredAt: "2025-11-01T09:05:00Z",
  },
]

const INITIAL_AUDITORS: Auditor[] = [
  {
    auditorId: "aud_001",
    name: "Karthik Rao",
    email: "karthik@audit.example",
    pubkeyFingerprint: "AA:BB:CC:11",
    status: "Registered",
  },
]

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES)
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(INITIAL_PAYROLL_RUNS)
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES)
  const [auditors, setAuditors] = useState<Auditor[]>(INITIAL_AUDITORS)

  useEffect(() => {
    const storedEmployees = localStorage.getItem("civitas_employees")
    const storedRuns = localStorage.getItem("civitas_payroll_runs")
    const storedNotes = localStorage.getItem("civitas_notes")
    const storedAuditors = localStorage.getItem("civitas_auditors")

    if (storedEmployees) setEmployees(JSON.parse(storedEmployees))
    if (storedRuns) setPayrollRuns(JSON.parse(storedRuns))
    if (storedNotes) setNotes(JSON.parse(storedNotes))
    if (storedAuditors) setAuditors(JSON.parse(storedAuditors))
  }, [])

  useEffect(() => {
    localStorage.setItem("civitas_employees", JSON.stringify(employees))
  }, [employees])

  useEffect(() => {
    localStorage.setItem("civitas_payroll_runs", JSON.stringify(payrollRuns))
  }, [payrollRuns])

  useEffect(() => {
    localStorage.setItem("civitas_notes", JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    localStorage.setItem("civitas_auditors", JSON.stringify(auditors))
  }, [auditors])

  const addEmployee = (employee: Employee) => {
    setEmployees((prev) => [...prev, employee])
  }

  const addPayrollRun = (run: PayrollRun) => {
    setPayrollRuns((prev) => [...prev, run])
  }

  const updatePayrollRun = (runId: string, updates: Partial<PayrollRun>) => {
    setPayrollRuns((prev) => prev.map((run) => (run.runId === runId ? { ...run, ...updates } : run)))
  }

  const addNote = (note: Note) => {
    setNotes((prev) => [...prev, note])
  }

  const updateNote = (noteId: string, updates: Partial<Note>) => {
    setNotes((prev) => prev.map((note) => (note.noteId === noteId ? { ...note, ...updates } : note)))
  }

  const addAuditor = (auditor: Auditor) => {
    setAuditors((prev) => [...prev, auditor])
  }

  return (
    <MockStoreContext.Provider
      value={{
        employees,
        payrollRuns,
        notes,
        auditors,
        addEmployee,
        addPayrollRun,
        updatePayrollRun,
        addNote,
        updateNote,
        addAuditor,
      }}
    >
      {children}
    </MockStoreContext.Provider>
  )
}

export function useMockStore() {
  const context = useContext(MockStoreContext)
  if (context === undefined) {
    throw new Error("useMockStore must be used within a MockStoreProvider")
  }
  return context
}
