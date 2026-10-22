import { ProtectedRoute } from "@/components/protected-route"

export default function FrontDeskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}