"use client"

import {
  SquareTerminal,
  Users,
  Calendar,
  TrendingUp,
  Activity,
  Package,
  BookOpen,
  UserCheck,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useAuth } from "@/lib/auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    avatar: "/avatars/john-doe.jpg",
  },
  teams: [
    {
      name: "ZFit",
      logo: "/logo.png",
      plan: "Gym Management Portal",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "My Profile",
      url: "/dashboard/profile",
      icon: Users,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: Users,
      items: [
        {
          title: "Members",
          url: "/dashboard/users/members",
        },
        {
          title: "Staff",
          url: "/dashboard/users/staff",
        },
        {
          title: "Managers",
          url: "/dashboard/users/managers",
        },
      ],
    },
    {
      title: "Memberships",
      url: "/dashboard/memberships",
      icon: Users,
      items: [
        {
          title: "Membership Plans",
          url: "/dashboard/memberships/plans",
        },
        {
          title: "Memberships",
          url: "/dashboard/memberships/memberships",
        },
      ],
    },
    {
      title: "Reservation",
      icon: BookOpen,
      items: [
        {
          title: "Bookings",
          url: "/dashboard/reservations/bookings",
        },
        {
          title: "Classes",
          url: "/dashboard/reservations/classes",
        },
        {
          title: "Trainers",
          url: "/dashboard/reservations/trainers",
        },
        {
          title: "Facilities",
          url: "/dashboard/reservations/facilities",
        },
      ],
    },
    {
      title: "Attendance",
      icon: Calendar,
      items: [
        {
          title: "Attendance History",
          url: "/dashboard/attendance/history",
        },
        {
          title: "QR Code Scanner",
          url: "/dashboard/attendance/scan",
        },
      ],
    },
   
    {
      title: "Tracking & Progress",
      url: "/dashboard/tracking",
      icon: Activity,
      items: [
        {
          title: "Workout Tracking",
          url: "/dashboard/tracking/workouts",
        },
        {
          title: "Nutrition Tracking",
          url: "/dashboard/tracking/nutrition",
        },
        {
          title: "Goal Management",
          url: "/dashboard/tracking/goals",
        },
        {
          title: "Progress Overview",
          url: "/dashboard/tracking/progress",
        },
      ],
    },
    {
      title: "Finance",
      icon: TrendingUp,
      items: [
        {
          title: "Payment",
          url: "/dashboard/finance/overview",
        },
        {
          title: "Bank Transfers",
          url: "/dashboard/finance/bank-transfers",
        },
        {
          title: "Refunds",
          url: "/dashboard/finance/refund/requests",
        },
        {
          title: "Invoices",
          url: "/dashboard/finance/invoice",
        },
      ],
    },
    {
      title: "Inventory",
      url: "/dashboard/inventory",
      icon: Package,
      items: [
        {
          title: "Categories",
          url: "/dashboard/inventory/categories",
        },
        {
          title: "Items",
          url: "/dashboard/inventory/items",
        },
        {
          title: "Stock Management",
          url: "/dashboard/inventory/stock",
        },
        {
          title: "Suppliers",
          url: "/dashboard/inventory/suppliers",
        },
       /* {
          title: "Transaction History",
          url: "/dashboard/inventory/transactions",
        },*/
      ],
    },
  ],
  projects: [
    {
      name: "Front Desk Mode",
      url: "/frontdesk",
      icon: UserCheck,
      target: "_blank",
    },
    {
      name: "QR Code Scanner",
      url: "/dashboard/attendance/scan",
      icon: Activity,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const userData = {
    name: user?.name || "User",
    email: user?.email || "",
    avatar: "/avatars/default.svg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}