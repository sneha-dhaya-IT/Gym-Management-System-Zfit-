"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  Users,
  Package,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Banknote,
  Search
} from "lucide-react"
import { MetricCard } from "@/components/charts/MetricCard"
import { RevenueChart } from "@/components/charts/RevenueChart"
import { CustomBarChart } from "@/components/charts/BarChart"
import { CustomPieChart } from "@/components/charts/PieChart"
import {
  getDashboardOverview,
  getFinanceAnalytics,
  getUserAnalytics,
  getInventoryAnalytics,
  DashboardOverview,
  FinanceAnalytics,
  UserAnalytics,
  InventoryAnalytics
} from "@/lib/api/analytics"

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [financeData, setFinanceData] = useState<FinanceAnalytics | null>(null)
  const [userData, setUserData] = useState<UserAnalytics | null>(null)
  const [inventoryData, setInventoryData] = useState<InventoryAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('Q4 11.23 - 02.10.25')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [overviewRes, financeRes, userRes, inventoryRes] = await Promise.all([
          getDashboardOverview(),
          getFinanceAnalytics(),
          getUserAnalytics(),
          getInventoryAnalytics()
        ])

        setOverview(overviewRes)
        setFinanceData(financeRes)
        setUserData(userRes)
        setInventoryData(inventoryRes)
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error('Dashboard data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              {error}
              <Button
                onClick={() => window.location.reload()}
                className="ml-4"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          </div>
          
          {/* Date Range Picker */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted rounded-lg text-sm text-foreground transition-colors">
              <Calendar className="h-4 w-4" />
              {dateRange}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">+15%</span>
            </div>
            <div>
              <h3 className="text-foreground font-medium text-sm mb-1">Total Revenue</h3>
              <div className="text-3xl font-bold text-foreground mb-2">LKR 29,000</div>
              <p className="text-muted-foreground text-xs">vs last month</p>
            </div>
          </div>

          {/* Active Members */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">+8%</span>
            </div>
            <div>
              <h3 className="text-foreground font-medium text-sm mb-1">Active Members</h3>
              <div className="text-3xl font-bold text-foreground mb-2">40</div>
              <p className="text-muted-foreground text-xs">7 total members</p>
            </div>
          </div>

          {/* Monthly Visits */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">+12%</span>
            </div>
            <div>
              <h3 className="text-foreground font-medium text-sm mb-1">Monthly Visits</h3>
              <div className="text-3xl font-bold text-foreground mb-2">1</div>
              <p className="text-muted-foreground text-xs">sessions this month</p>
            </div>
          </div>

          {/* Active Memberships */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">+12%</span>
            </div>
            <div>
              <h3 className="text-foreground font-medium text-sm mb-1">Active Memberships</h3>
              <div className="text-3xl font-bold text-foreground mb-2">
                {userData?.membershipStats.active || 342}
              </div>
              <p className="text-muted-foreground text-xs">out of {userData?.totalUsers || 400} total members</p>
            </div>
          </div>
        </div>
        {/* Header with Search */}
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Monthly Revenue Trend</h3>
            <RevenueChart 
              data={[
                { month: 'Jan', revenue: 25000 },
                { month: 'Feb', revenue: 28000 },
                { month: 'Mar', revenue: 24000 },
                { month: 'Apr', revenue: 31000 },
                { month: 'May', revenue: 27000 },
                { month: 'Jun', revenue: 29000 },
                { month: 'Jul', revenue: 32000 },
                { month: 'Aug', revenue: 26000 },
                { month: 'Sep', revenue: 29000 },
                { month: 'Oct', revenue: 29000 },
                { month: 'Nov', revenue: 30000 },
                { month: 'Dec', revenue: 29000 }
              ]}
              title=""
            />
          </div>

          {/* Member Activity Bar Chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Weekly Member Activity</h3>
            <CustomBarChart
              data={[
                { name: 'Mon', value: 45 },
                { name: 'Tue', value: 52 },
                { name: 'Wed', value: 48 },
                { name: 'Thu', value: 61 },
                { name: 'Fri', value: 55 },
                { name: 'Sat', value: 67 },
                { name: 'Sun', value: 43 }
              ]}
              title=""
              color="#AAFF69"
            />
          </div>

          {/* Membership Plans Distribution */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Membership Plans</h3>
            <CustomPieChart
              data={[
                { name: 'Basic', value: 15 },
                { name: 'Premium', value: 20 },
                { name: 'VIP', value: 5 }
              ]}
              title=""
              colors={['#AAFF69', '#202022', '#A0A0A0']}
            />
          </div>

          {/* Inventory Stock Overview */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Inventory Stock Status</h3>
            <CustomBarChart
              data={[
                { name: 'In Stock', value: inventoryData?.inStock || 156 },
                { name: 'Low Stock', value: inventoryData?.lowStock || 23 },
                { name: 'Out of Stock', value: inventoryData?.outOfStock || 8 },
                { name: 'Supplements', value: 89 },
                { name: 'Equipment', value: 67 }
              ]}
              title=""
              color="#AAFF69"
            />
          </div>
        </div>

        {/* Performance Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-foreground font-medium">Peak Hours</h4>
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">6-8 AM</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-foreground text-sm">75%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">6-8 PM</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-foreground text-sm">95%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">12-2 PM</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-foreground text-sm">60%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-foreground font-medium">Member Retention</h4>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">89.2%</div>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '89.2%' }}></div>
              </div>
              <p className="text-muted-foreground text-sm">Annual retention rate</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-foreground font-medium">Class Popularity</h4>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Yoga</span>
                <span className="text-foreground text-sm font-medium">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">HIIT</span>
                <span className="text-foreground text-sm font-medium">18</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Pilates</span>
                <span className="text-foreground text-sm font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Spin</span>
                <span className="text-foreground text-sm font-medium">15</span>
              </div>
            </div>
          </div>
        </div>
        {/* Additional Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-foreground font-medium">New Signups</h4>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-2">247</div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-primary">+18.2%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-foreground font-medium">Avg Session Time</h4>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-2">89min</div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-primary">+7min</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-foreground font-medium">Membership Status</h4>
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-2">
              {userData?.membershipStats.active || 342}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-primary">+12</span>
              <span className="text-muted-foreground">new this month</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-foreground font-medium">Inventory Value</h4>
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground mb-2">LKR 2.4M</div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">-2.3%</span>
              <span className="text-muted-foreground">stock level</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions Panel */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
              <Zap className="h-4 w-4 text-primary" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors group">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <span className="text-foreground font-medium text-xs">Add Member</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors group">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <span className="text-foreground font-medium text-xs">Book Class</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors group">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <span className="text-foreground font-medium text-xs">Inventory</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors group">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-foreground font-medium text-xs">Reports</span>
              </button>
            </div>
          </div>

          {/* System Alerts & Notifications */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">System Alerts</h3>
              <button className="text-muted-foreground hover:text-foreground text-xs">Manage</button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                <div className="flex-1">
                  <div className="text-foreground text-xs font-medium">Low Stock Alert</div>
                  <div className="text-muted-foreground text-xs">
                    {inventoryData?.lowStock || 23} items below stock threshold
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">5 minutes ago</div>
                </div>
                <button className="text-primary hover:text-primary/80 text-xs">View Inventory</button>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/10 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5"></div>
                <div className="flex-1">
                  <div className="text-foreground text-xs font-medium">Membership Expiry</div>
                  <div className="text-muted-foreground text-xs">
                    {userData?.membershipStats.expiringSoon || 15} memberships expiring this week
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">1 hour ago</div>
                </div>
                <button className="text-primary hover:text-primary/80 text-xs">Notify Members</button>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/10 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5"></div>
                <div className="flex-1">
                  <div className="text-foreground text-xs font-medium">Payment Status</div>
                  <div className="text-muted-foreground text-xs">
                    New payments processed: LKR {(financeData?.monthlyRevenue ?? 125000).toLocaleString()}
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">2 hours ago</div>
                </div>
                <button className="text-primary hover:text-primary/80 text-xs">View Payments</button>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/10 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5"></div>
                <div className="flex-1">
                  <div className="text-foreground text-xs font-medium">Today's Attendance</div>
                  <div className="text-muted-foreground text-xs">
                    {overview?.monthlyAttendance || 847} check-ins recorded today
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">3 hours ago</div>
                </div>
                <button className="text-primary hover:text-primary/80 text-xs">View Details</button>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Activity Summary */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Today's Activity Summary</h3>
            <button className="text-muted-foreground hover:text-foreground text-xs">View All Activity</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground font-medium text-xs">Total Check-ins</span>
                <span className="text-primary text-xs">{overview?.monthlyAttendance || 847}</span>
              </div>
              <div className="text-muted-foreground text-xs mb-2">Active members today</div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Peak: 2:00 PM</span>
                <div className="w-12 bg-muted rounded-full h-1">
                  <div className="bg-primary h-1 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground font-medium text-xs">New Members</span>
                <span className="text-primary text-xs">{userData?.newUsersThisMonth || 24}</span>
              </div>
              <div className="text-muted-foreground text-xs mb-2">Joined this month</div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Growth: +12%</span>
                <div className="w-12 bg-muted rounded-full h-1">
                  <div className="bg-primary h-1 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground font-medium text-xs">Revenue Today</span>
                <span className="text-primary text-xs">LKR {((financeData?.monthlyRevenue ?? 125000) / 30).toLocaleString()}</span>
              </div>
              <div className="text-muted-foreground text-xs mb-2">Daily average</div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Target: 95%</span>
                <div className="w-12 bg-muted rounded-full h-1">
                  <div className="bg-primary h-1 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground font-medium text-xs">Inventory Alerts</span>
                <span className="text-primary text-xs">{inventoryData?.lowStock || 23}</span>
              </div>
              <div className="text-muted-foreground text-xs mb-2">Items need restocking</div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Urgent: {inventoryData?.outOfStock || 8}</span>
                <div className="w-12 bg-muted rounded-full h-1">
                  <div className="bg-primary h-1 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reservation Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <a href="/dashboard/reservations/bookings" className="block rounded-lg border p-4 hover:shadow-sm transition-shadow">
          <div className="text-sm font-medium">Bookings</div>
          <div className="text-xs text-muted-foreground">View and manage all bookings</div>
        </a>
        <a href="/dashboard/reservations/classes" className="block rounded-lg border p-4 hover:shadow-sm transition-shadow">
          <div className="text-sm font-medium">Classes</div>
          <div className="text-xs text-muted-foreground">Create and edit classes</div>
        </a>
        <a href="/dashboard/reservations/trainers" className="block rounded-lg border p-4 hover:shadow-sm transition-shadow">
          <div className="text-sm font-medium">Trainers</div>
          <div className="text-xs text-muted-foreground">Manage trainers</div>
        </a>
        <a href="/dashboard/reservations/facilities" className="block rounded-lg border p-4 hover:shadow-sm transition-shadow">
          <div className="text-sm font-medium">Facilities</div>
          <div className="text-xs text-muted-foreground">Manage facilities</div>
        </a>
      </div>
    </div>
  )
}