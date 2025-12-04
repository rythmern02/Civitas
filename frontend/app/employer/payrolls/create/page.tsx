import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CreatePayrollWizard } from "@/components/employer/create-payroll-wizard"

export default function CreatePayrollPage() {
  return (
    <DashboardLayout>
      <CreatePayrollWizard />
    </DashboardLayout>
  )
}
