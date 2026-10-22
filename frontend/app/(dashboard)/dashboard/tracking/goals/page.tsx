"use client"

import { useState, useEffect } from "react"
import { Plus, Target, Calendar, Edit, Trash2, Search, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { trackingApi, type Goal, type GoalData } from "@/lib/api/trackingApi"
import { useAuth } from "@/lib/auth-context"

const GOAL_TYPES = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "weight_gain", label: "Weight Gain" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "endurance", label: "Endurance" },
  { value: "strength", label: "Strength" },
  { value: "flexibility", label: "Flexibility" },
  { value: "nutrition", label: "Nutrition" },
  { value: "attendance", label: "Attendance" },
  { value: "other", label: "Other" },
]

export default function GoalManagementPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState<Omit<GoalData, 'deadline'> & { deadline?: string }>({
    memberId: user?._id || "",
    goalType: "weight_loss",
    target: "",
    deadline: undefined,
    assignedBy: undefined
  })

  useEffect(() => {
    if (user?._id) {
      fetchGoals()
    }
  }, [user?._id])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const response = await trackingApi.getGoals(user?._id)
      if (response.success && response.data) {
        setGoals(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingGoal) {
        await trackingApi.updateGoal(editingGoal._id, formData)
        console.log("Goal updated successfully")
      } else {
        await trackingApi.createGoal(formData)
        console.log("Goal created successfully")
      }
      setIsDialogOpen(false)
      setEditingGoal(null)
      resetForm()
      fetchGoals()
    } catch (error) {
      console.error("Failed to save goal:", error)
    }
  }

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      memberId: goal.memberId,
      goalType: goal.goalType,
      target: goal.target,
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : undefined,
      assignedBy: goal.assignedBy
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      try {
        await trackingApi.deleteGoal(id)
        console.log("Goal deleted successfully")
        fetchGoals()
      } catch (error) {
        console.error("Failed to delete goal:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      memberId: user?._id || "",
      goalType: "weight_loss",
      target: "",
      deadline: undefined,
      assignedBy: undefined
    })
  }

  const filteredGoals = goals.filter(goal =>
    goal.goalType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.target.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getGoalStatus = (goal: Goal) => {
    if (!goal.deadline) return "ongoing"
    const deadline = new Date(goal.deadline)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return "overdue"
    if (diffDays <= 7) return "urgent"
    return "on_track"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "urgent":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "on_track":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>
      case "urgent":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Urgent</Badge>
      case "on_track":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">On Track</Badge>
      default:
        return <Badge variant="secondary">Ongoing</Badge>
    }
  }

  const groupedGoals = filteredGoals.reduce((acc, goal) => {
    const status = getGoalStatus(goal)
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(goal)
    return acc
  }, {} as Record<string, Goal[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading goals...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goal Management</h1>
          <p className="text-muted-foreground">
            Set and track your fitness and health goals
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Edit Goal" : "Add New Goal"}
              </DialogTitle>
              <DialogDescription>
                {editingGoal ? "Update your goal details" : "Set a new fitness or health goal"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goalType">Goal Type</Label>
                <Select
                  value={formData.goalType}
                  onValueChange={(value) => setFormData({ ...formData, goalType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target</Label>
                <Input
                  id="target"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  placeholder="e.g., Lose 10kg, Run 5km, Bench press 100kg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline || ""}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    deadline: e.target.value || undefined 
                  })}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGoal ? "Update" : "Add"} Goal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {Object.keys(groupedGoals).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No goals match your search criteria" : "Start setting goals to track your progress"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Set Your First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedGoals)
            .sort(([a], [b]) => {
              const order = { overdue: 0, urgent: 1, on_track: 2, ongoing: 3 }
              return order[a as keyof typeof order] - order[b as keyof typeof order]
            })
            .map(([status, statusGoals]) => (
              <div key={status} className="space-y-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status)}
                  <h2 className="text-lg font-semibold capitalize">
                    {status.replace('_', ' ')} Goals
                  </h2>
                  <Badge variant="secondary">{statusGoals.length} goal{statusGoals.length !== 1 ? 's' : ''}</Badge>
                </div>
                <div className="grid gap-3">
                  {statusGoals.map((goal) => (
                    <Card key={goal._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold capitalize">
                                {GOAL_TYPES.find(t => t.value === goal.goalType)?.label || goal.goalType}
                              </h3>
                              {getStatusBadge(getGoalStatus(goal))}
                            </div>
                            <p className="text-sm text-muted-foreground">{goal.target}</p>
                            {goal.deadline && (
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Created: {new Date(goal.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(goal)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(goal._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
