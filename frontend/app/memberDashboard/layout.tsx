import { MemberSidebar } from "@/components/member-sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { VoiceSupportWidget } from "@/components/VoiceSupportWidget"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function MemberDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <MemberSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-sidebar-border" />
              <h1 className="text-lg font-semibold">Member Dashboard</h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
        <VoiceSupportWidget />
      </SidebarProvider>
    </ProtectedRoute>
  )
}