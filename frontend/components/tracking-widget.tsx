"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { trackingApi, type Workout, type Nutrition, type Goal } from "@/lib/api/trackingApi"
import { useAuth } from "@/lib/auth-context"
import { Activity, Target, Apple, Dumbbell, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

export function TrackingWidget() {
  const { user } = useAuth()
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [recentNutrition, setRecentNutrition] = useState<Nutrition[]>([])
  const [recentGoals, setRecentGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?._id && user._id.length === 24) {
      fetchRecentData()
    }
  }, [user?._id])

  const fetchRecentData = async () => {
    try {
      setLoading(true)
      const [workoutsRes, nutritionRes, goalsRes] = await Promise.all([
        trackingApi.getWorkouts(user?._id),
        trackingApi.getNutrition(user?._id),
        trackingApi.getGoals(user?._id)
      ])

      if (workoutsRes.success && workoutsRes.data) {
        setRecentWorkouts(workoutsRes.data.slice(-3))
      }
      if (nutritionRes.success && nutritionRes.data) {
        setRecentNutrition(nutritionRes.data.slice(-3))
      }
      if (goalsRes.success && goalsRes.data) {
        setRecentGoals(goalsRes.data.slice(-3))
      }
    } catch (error) {
      console.error("Failed to fetch recent data:", error)
      // Set empty arrays on error to prevent UI issues
      setRecentWorkouts([])
      setRecentNutrition([])
      setRecentGoals([])
    } finally {
      setLoading(false)
    }
  }

  const getQuickStats = () => {
    const today = new Date().toDateString()
    const todayWorkouts = recentWorkouts.filter(w => new Date(w.date).toDateString() === today).length
    const todayCalories = recentNutrition
      .filter(n => new Date(n.date).toDateString() === today)
      .reduce((sum, n) => sum + n.calories, 0)
    const activeGoals = recentGoals.filter(g => !g.deadline || new Date(g.deadline) > new Date()).length

    return {
      todayWorkouts,
      todayCalories,
      activeGoals
    }
  }

  const stats = getQuickStats()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Tracking & Progress
          </CardTitle>
          <CardDescription>Loading your fitness data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Tracking & Progress
        </CardTitle>
        <CardDescription>
          Monitor your fitness journey and track your progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.todayWorkouts}</div>
            <div className="text-xs text-muted-foreground">Workouts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.todayCalories}</div>
            <div className="text-xs text-muted-foreground">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.activeGoals}</div>
            <div className="text-xs text-muted-foreground">Active Goals</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Recent Activity</h4>
          
          {recentWorkouts.length > 0 && (
            <div className="flex items-center space-x-3 p-2 border rounded-lg">
              <Dumbbell className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Latest Workout</p>
                <p className="text-xs text-muted-foreground">
                  {recentWorkouts[0].exercise} • {new Date(recentWorkouts[0].date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {recentNutrition.length > 0 && (
            <div className="flex items-center space-x-3 p-2 border rounded-lg">
              <Apple className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Latest Meal</p>
                <p className="text-xs text-muted-foreground">
                  {recentNutrition[0].mealType} • {recentNutrition[0].calories} cal
                </p>
              </div>
            </div>
          )}

          {recentGoals.length > 0 && (
            <div className="flex items-center space-x-3 p-2 border rounded-lg">
              <Target className="h-4 w-4 text-purple-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Active Goal</p>
                <p className="text-xs text-muted-foreground">
                  {recentGoals[0].goalType.replace('_', ' ')} • {recentGoals[0].target}
                </p>
              </div>
            </div>
          )}

          {recentWorkouts.length === 0 && recentNutrition.length === 0 && recentGoals.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs">Start tracking your fitness journey!</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Link href="/dashboard/tracking/workouts" className="flex-1">
            <Button size="sm" className="w-full">
              <Plus className="h-3 w-3 mr-1" />
              Workout
            </Button>
          </Link>
          <Link href="/dashboard/tracking/nutrition" className="flex-1">
            <Button size="sm" variant="outline" className="w-full">
              <Plus className="h-3 w-3 mr-1" />
              Meal
            </Button>
          </Link>
          <Link href="/dashboard/tracking">
            <Button size="sm" variant="ghost">
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
