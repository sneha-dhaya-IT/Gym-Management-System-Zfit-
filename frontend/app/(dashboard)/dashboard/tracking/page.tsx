"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { trackingApi, type Workout, type Nutrition, type Goal, type Progress } from "@/lib/api/trackingApi"
import { useAuth } from "@/lib/auth-context"
import { Activity, Target, Apple, Dumbbell, TrendingUp, Calendar, Award, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function TrackingOverviewPage() {
  const { user } = useAuth()
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [recentNutrition, setRecentNutrition] = useState<Nutrition[]>([])
  const [recentGoals, setRecentGoals] = useState<Goal[]>([])
  const [recentProgress, setRecentProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?._id) {
      fetchRecentData()
    }
  }, [user?._id])

  const fetchRecentData = async () => {
    try {
      setLoading(true)
      const [workoutsRes, nutritionRes, goalsRes, progressRes] = await Promise.all([
        trackingApi.getWorkouts(user?._id),
        trackingApi.getNutrition(user?._id),
        trackingApi.getGoals(user?._id),
        trackingApi.getProgress(user?._id)
      ])

      if (workoutsRes.success && workoutsRes.data) {
        setRecentWorkouts(workoutsRes.data.slice(-5))
      }
      if (nutritionRes.success && nutritionRes.data) {
        setRecentNutrition(nutritionRes.data.slice(-5))
      }
      if (goalsRes.success && goalsRes.data) {
        setRecentGoals(goalsRes.data.slice(-5))
      }
      if (progressRes.success && progressRes.data) {
        setRecentProgress(progressRes.data.slice(-5))
      }
    } catch (error) {
      console.error("Failed to fetch recent data:", error)
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
    const completedGoals = recentGoals.filter(g => g.deadline && new Date(g.deadline) <= new Date()).length

    return {
      todayWorkouts,
      todayCalories,
      activeGoals,
      completedGoals
    }
  }

  const stats = getQuickStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tracking overview...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tracking & Progress</h1>
          <p className="text-muted-foreground">
            Monitor your fitness journey and track your progress
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Workouts</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayWorkouts}</div>
            <p className="text-xs text-muted-foreground">
              workouts completed today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Calories</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCalories}</div>
            <p className="text-xs text-muted-foreground">
              calories consumed today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeGoals}</div>
            <p className="text-xs text-muted-foreground">
              goals in progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Goals</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedGoals}</div>
            <p className="text-xs text-muted-foreground">
              goals achieved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Dumbbell className="h-5 w-5 mr-2 text-blue-500" />
              Workout Tracking
            </CardTitle>
            <CardDescription>
              Log your exercises, sets, reps, and weights
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/dashboard/tracking/workouts">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Workout
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Apple className="h-5 w-5 mr-2 text-green-500" />
              Nutrition Tracking
            </CardTitle>
            <CardDescription>
              Track your meals, calories, and macros
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/dashboard/tracking/nutrition">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Meal
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-500" />
              Goal Management
            </CardTitle>
            <CardDescription>
              Set and track your fitness goals
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/dashboard/tracking/goals">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Set Goal
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
              Progress Overview
            </CardTitle>
            <CardDescription>
              View detailed analytics and charts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/dashboard/tracking/progress">
              <Button className="w-full" variant="outline">
                <ArrowRight className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Dumbbell className="h-5 w-5 mr-2" />
              Recent Workouts
            </CardTitle>
            <CardDescription>Your latest workout sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentWorkouts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent workouts</p>
                <Link href="/dashboard/tracking/workouts">
                  <Button variant="outline" size="sm" className="mt-2">
                    Add your first workout
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentWorkouts.map((workout) => (
                  <div key={workout._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{workout.exercise}</p>
                      <p className="text-sm text-muted-foreground">
                        {workout.sets} sets × {workout.reps} reps @ {workout.weight}kg
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {new Date(workout.date).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
                <Link href="/dashboard/tracking/workouts">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Workouts
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Apple className="h-5 w-5 mr-2" />
              Recent Meals
            </CardTitle>
            <CardDescription>Your latest nutrition entries</CardDescription>
          </CardHeader>
          <CardContent>
            {recentNutrition.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Apple className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent meals</p>
                <Link href="/dashboard/tracking/nutrition">
                  <Button variant="outline" size="sm" className="mt-2">
                    Add your first meal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentNutrition.map((meal) => (
                  <div key={meal._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{meal.mealType}</p>
                      <p className="text-sm text-muted-foreground">
                        {meal.calories} calories
                        {meal.macros && (
                          <span className="ml-2">
                            • P: {meal.macros.protein || 0}g • C: {meal.macros.carbs || 0}g • F: {meal.macros.fats || 0}g
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {new Date(meal.date).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
                <Link href="/dashboard/tracking/nutrition">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Meals
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Goals Overview
          </CardTitle>
          <CardDescription>Your current and completed goals</CardDescription>
        </CardHeader>
        <CardContent>
          {recentGoals.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No goals set yet</p>
              <Link href="/dashboard/tracking/goals">
                <Button variant="outline" size="sm" className="mt-2">
                  Set your first goal
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentGoals.map((goal) => {
                const isOverdue = goal.deadline && new Date(goal.deadline) < new Date()
                const isUrgent = goal.deadline && new Date(goal.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                
                return (
                  <div key={goal._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{goal.goalType.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{goal.target}</p>
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                      {isUrgent && !isOverdue && <Badge variant="secondary" className="bg-orange-100 text-orange-800">Urgent</Badge>}
                      {!isOverdue && !isUrgent && <Badge variant="secondary">Active</Badge>}
                    </div>
                  </div>
                )
              })}
              <Link href="/dashboard/tracking/goals">
                <Button variant="outline" size="sm" className="w-full">
                  View All Goals
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
