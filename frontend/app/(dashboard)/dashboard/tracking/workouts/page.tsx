"use client"

import { useState, useEffect } from "react"
import { Plus, Dumbbell, Calendar, Edit, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { trackingApi, type Workout, type WorkoutData } from "@/lib/api/trackingApi"
import { useAuth } from "@/lib/auth-context"

export default function WorkoutTrackingPage() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [formData, setFormData] = useState<WorkoutData>({
    memberId: user?._id || "",
    exercise: "",
    sets: 1,
    reps: 1,
    weight: 0,
    notes: "",
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (user?._id) {
      fetchWorkouts()
    }
  }, [user?._id])

  const fetchWorkouts = async () => {
    try {
      setLoading(true)
      const response = await trackingApi.getWorkouts(user?._id)
      if (response.success && response.data) {
        setWorkouts(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch workouts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingWorkout) {
        await trackingApi.updateWorkout(editingWorkout._id, formData)
        console.log("Workout updated successfully")
      } else {
        await trackingApi.createWorkout(formData)
        console.log("Workout added successfully")
      }
      setIsDialogOpen(false)
      setEditingWorkout(null)
      resetForm()
      fetchWorkouts()
    } catch (error) {
      console.error("Failed to save workout:", error)
    }
  }

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout)
    setFormData({
      memberId: workout.memberId,
      exercise: workout.exercise,
      sets: workout.sets,
      reps: workout.reps,
      weight: workout.weight,
      notes: workout.notes || "",
      date: new Date(workout.date).toISOString().split('T')[0]
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this workout?")) {
      try {
        await trackingApi.deleteWorkout(id)
        console.log("Workout deleted successfully")
        fetchWorkouts()
      } catch (error) {
        console.error("Failed to delete workout:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      memberId: user?._id || "",
      exercise: "",
      sets: 1,
      reps: 1,
      weight: 0,
      notes: "",
      date: new Date().toISOString().split('T')[0]
    })
  }

  const filteredWorkouts = workouts.filter(workout =>
    workout.exercise.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedWorkouts = filteredWorkouts.reduce((acc, workout) => {
    const date = new Date(workout.date).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(workout)
    return acc
  }, {} as Record<string, Workout[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading workouts...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workout Tracking</h1>
          <p className="text-muted-foreground">
            Track your exercises, sets, reps, and weights
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingWorkout ? "Edit Workout" : "Add New Workout"}
              </DialogTitle>
              <DialogDescription>
                {editingWorkout ? "Update your workout details" : "Add a new workout to your log"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exercise">Exercise</Label>
                <Input
                  id="exercise"
                  value={formData.exercise}
                  onChange={(e) => setFormData({ ...formData, exercise: e.target.value })}
                  placeholder="e.g., Bench Press, Squats"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    min="1"
                    value={formData.sets}
                    onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    min="1"
                    value={formData.reps}
                    onChange={(e) => setFormData({ ...formData, reps: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about this workout..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingWorkout ? "Update" : "Add"} Workout
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
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {Object.keys(groupedWorkouts).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workouts found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No workouts match your search criteria" : "Start tracking your workouts to see them here"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Workout
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedWorkouts)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dateWorkouts]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{date}</h2>
                  <Badge variant="secondary">{dateWorkouts.length} workout{dateWorkouts.length !== 1 ? 's' : ''}</Badge>
                </div>
                <div className="grid gap-3">
                  {dateWorkouts.map((workout) => (
                    <Card key={workout._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{workout.exercise}</h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{workout.sets} sets</span>
                              <span>{workout.reps} reps</span>
                              <span>{workout.weight} kg</span>
                            </div>
                            {workout.notes && (
                              <p className="text-sm text-muted-foreground">{workout.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(workout)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(workout._id)}
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
