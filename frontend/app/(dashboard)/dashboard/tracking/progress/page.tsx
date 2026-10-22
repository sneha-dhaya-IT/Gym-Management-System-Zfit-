"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { trackingApi, type Progress, type Workout, type Nutrition, type Goal } from "@/lib/api/trackingApi"
import { useAuth } from "@/lib/auth-context"
import { Activity, Target, Apple, Dumbbell, TrendingUp, Calendar, Award } from "lucide-react"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function ProgressOverviewPage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<Progress[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [nutrition, setNutrition] = useState<Nutrition[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    if (user?._id) {
      fetchAllData()
    }
  }, [user?._id, timeRange])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [progressRes, workoutsRes, nutritionRes, goalsRes] = await Promise.all([
        trackingApi.getProgress(user?._id),
        trackingApi.getWorkouts(user?._id),
        trackingApi.getNutrition(user?._id),
        trackingApi.getGoals(user?._id)
      ])

      if (progressRes.success && progressRes.data) {
        setProgress(progressRes.data)
      }
      if (workoutsRes.success && workoutsRes.data) {
        setWorkouts(workoutsRes.data)
      }
      if (nutritionRes.success && nutritionRes.data) {
        setNutrition(nutritionRes.data)
      }
      if (goalsRes.success && goalsRes.data) {
        setGoals(goalsRes.data)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    const days = parseInt(timeRange)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)
    return { startDate, endDate }
  }

  const filterDataByDateRange = (data: any[]) => {
    const { startDate, endDate } = getDateRange()
    return data.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate >= startDate && itemDate <= endDate
    })
  }

  const getWorkoutChartData = () => {
    const filteredWorkouts = filterDataByDateRange(workouts)
    const groupedByDate = filteredWorkouts.reduce((acc, workout) => {
      const date = new Date(workout.date).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { date, workouts: 0, totalWeight: 0 }
      }
      acc[date].workouts += 1
      acc[date].totalWeight += workout.weight * workout.sets * workout.reps
      return acc
    }, {} as Record<string, any>)

    return Object.values(groupedByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getNutritionChartData = () => {
    const filteredNutrition = filterDataByDateRange(nutrition)
    const groupedByDate = filteredNutrition.reduce((acc, entry) => {
      const date = new Date(entry.date).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { date, calories: 0, protein: 0, carbs: 0, fats: 0 }
      }
      acc[date].calories += entry.calories
      acc[date].protein += entry.macros?.protein || 0
      acc[date].carbs += entry.macros?.carbs || 0
      acc[date].fats += entry.macros?.fats || 0
      return acc
    }, {} as Record<string, any>)

    return Object.values(groupedByDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getProgressChartData = () => {
    const filteredProgress = filterDataByDateRange(progress)
    return filteredProgress
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(p => ({
        date: new Date(p.date).toLocaleDateString(),
        workoutsCompleted: p.workoutsCompleted,
        attendance: p.attendance,
        goalsAchieved: p.goalsAchieved
      }))
  }

  const getGoalStatusData = () => {
    const now = new Date()
    const goalStatuses = goals.reduce((acc, goal) => {
      if (!goal.deadline) {
        acc.ongoing = (acc.ongoing || 0) + 1
      } else {
        const deadline = new Date(goal.deadline)
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays < 0) {
          acc.overdue = (acc.overdue || 0) + 1
        } else if (diffDays <= 7) {
          acc.urgent = (acc.urgent || 0) + 1
        } else {
          acc.onTrack = (acc.onTrack || 0) + 1
        }
      }
      return acc
    }, {} as Record<string, number>)

    return Object.entries(goalStatuses).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace(/([A-Z])/g, ' $1'),
      value: count,
      color: status === 'overdue' ? '#FF8042' : status === 'urgent' ? '#FFBB28' : status === 'onTrack' ? '#00C49F' : '#0088FE'
    }))
  }

  const getStats = () => {
    const filteredWorkouts = filterDataByDateRange(workouts)
    const filteredNutrition = filterDataByDateRange(nutrition)
    
    const totalWorkouts = filteredWorkouts.length
    const totalCalories = filteredNutrition.reduce((sum, entry) => sum + entry.calories, 0)
    const avgCaloriesPerDay = filteredNutrition.length > 0 ? totalCalories / Math.max(1, new Set(filteredNutrition.map(n => new Date(n.date).toDateString())).size) : 0
    const totalGoals = goals.length
    const completedGoals = goals.filter(goal => {
      if (!goal.deadline) return false
      const deadline = new Date(goal.deadline)
      const now = new Date()
      return deadline < now
    }).length

    return {
      totalWorkouts,
      totalCalories: Math.round(totalCalories),
      avgCaloriesPerDay: Math.round(avgCaloriesPerDay),
      totalGoals,
      completedGoals,
      goalCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
    }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading progress data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Overview</h1>
          <p className="text-muted-foreground">
            Track your fitness journey and analyze your progress
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">
              in the last {timeRange} days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calories</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalories.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgCaloriesPerDay} avg per day
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedGoals} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal Completion</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.goalCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workout Activity</CardTitle>
            <CardDescription>Daily workout count and total weight lifted</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getWorkoutChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="workouts" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nutrition Intake</CardTitle>
            <CardDescription>Daily calorie and macronutrient consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getNutritionChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calories" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Tracking</CardTitle>
            <CardDescription>Workouts completed, attendance, and goals achieved</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getProgressChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="workoutsCompleted" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="attendance" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="goalsAchieved" stroke="#ffc658" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal Status</CardTitle>
            <CardDescription>Distribution of goals by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getGoalStatusData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getGoalStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest workouts, meals, and goal updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...workouts.slice(-3), ...nutrition.slice(-3), ...goals.slice(-3)]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {'exercise' in item ? (
                      <Dumbbell className="h-5 w-5 text-blue-500" />
                    ) : 'mealType' in item ? (
                      <Apple className="h-5 w-5 text-green-500" />
                    ) : (
                      <Target className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {'exercise' in item ? (
                        `Workout: ${item.exercise}`
                      ) : 'mealType' in item ? (
                        `Meal: ${item.mealType} (${item.calories} cal)`
                      ) : (
                        `Goal: ${item.goalType} - ${item.target}`
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
