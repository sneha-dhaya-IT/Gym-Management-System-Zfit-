"use client"

import * as React from "react"
import {
  User,
  Home,
  Users,
  ShoppingBag,
  Calendar,
  ShoppingCart,
  CreditCard,
  BookOpen,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useAuth } from "@/lib/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Member-specific navigation data
const data = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    avatar: "/avatars/john-doe.jpg",
  },
  teams: [
    {
      name: "ZFit Member",
      logo: "/logo.png",
      plan: "Member Portal",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/memberDashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "My Profile",
      url: "/memberDashboard/profile",
      icon: User,
    },
    {
      title: "Reservation",
      url: "/memberDashboard/reservations",
      icon: BookOpen,
    },
    {
      title: "Memberships",
      url: "/memberDashboard/memberships",
      icon: Users,
      items: [
        {
          title: "My Memberships",
          url: "/memberDashboard/memberships/my-memberships",
        },
        {
          title: "Browse Memberships",
          url: "/memberDashboard/memberships/browse",
        },
      ],
    },
    {
      title: "Store",
      url: "/memberDashboard/store",
      icon: ShoppingBag,
    },
    {
      title: "Shopping Cart",
      url: "/memberDashboard/cart",
      icon: ShoppingCart,
    },
    {
      title: "Attendance",
      url: "/memberDashboard/attendance",
      icon: Calendar,
    },
    {
      title: "Payment History",
      url: "/memberDashboard/payments/history",
      icon: CreditCard,
    },
  ],
}

export function MemberSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const userData = {
    name: user?.name || "Member",
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
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}