"use client"

import { useState, useEffect } from "react"
import { Plus, Apple, Calendar, Edit, Trash2, Search, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { trackingApi, type Nutrition, type NutritionData } from "@/lib/api/trackingApi"
import { useAuth } from "@/lib/auth-context"

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
]

export default function NutritionTrackingPage() {
  const { user } = useAuth()
  const [nutrition, setNutrition] = useState<Nutrition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNutrition, setEditingNutrition] = useState<Nutrition | null>(null)
  const [formData, setFormData] = useState<NutritionData>({
    memberId: user?._id || "",
    mealType: "breakfast",
    calories: 0,
    macros: {
      protein: 0,
      carbs: 0,
      fats: 0
    },
    notes: "",
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (user?._id) {
      fetchNutrition()
    }
  }, [user?._id])

  const fetchNutrition = async () => {
    try {
      setLoading(true)
      const response = await trackingApi.getNutrition(user?._id)
      if (response.success && response.data) {
        setNutrition(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch nutrition:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingNutrition) {
        await trackingApi.updateNutrition(editingNutrition._id, formData)
        console.log("Nutrition entry updated successfully")
      } else {
        await trackingApi.createNutrition(formData)
        console.log("Nutrition entry added successfully")
      }
      setIsDialogOpen(false)
      setEditingNutrition(null)
      resetForm()
      fetchNutrition()
    } catch (error) {
      console.error("Failed to save nutrition:", error)
    }
  }

  const handleEdit = (nutrition: Nutrition) => {
    setEditingNutrition(nutrition)
    setFormData({
      memberId: nutrition.memberId,
      mealType: nutrition.mealType,
      calories: nutrition.calories,
      macros: nutrition.macros || { protein: 0, carbs: 0, fats: 0 },
      notes: nutrition.notes || "",
      date: new Date(nutrition.date).toISOString().split('T')[0]
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this nutrition entry?")) {
      try {
        await trackingApi.deleteNutrition(id)
        console.log("Nutrition entry deleted successfully")
        fetchNutrition()
      } catch (error) {
        console.error("Failed to delete nutrition:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      memberId: user?._id || "",
      mealType: "breakfast",
      calories: 0,
      macros: {
        protein: 0,
        carbs: 0,
        fats: 0
      },
      notes: "",
      date: new Date().toISOString().split('T')[0]
    })
  }

  const filteredNutrition = nutrition.filter(entry =>
    entry.mealType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const groupedNutrition = filteredNutrition.reduce((acc, entry) => {
    const date = new Date(entry.date).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(entry)
    return acc
  }, {} as Record<string, Nutrition[]>)

  const getTotalCalories = (entries: Nutrition[]) => {
    return entries.reduce((total, entry) => total + entry.calories, 0)
  }

  const getTotalMacros = (entries: Nutrition[]) => {
    return entries.reduce((total, entry) => ({
      protein: total.protein + (entry.macros?.protein || 0),
      carbs: total.carbs + (entry.macros?.carbs || 0),
      fats: total.fats + (entry.macros?.fats || 0)
    }), { protein: 0, carbs: 0, fats: 0 })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading nutrition data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nutrition Tracking</h1>
          <p className="text-muted-foreground">
            Track your meals, calories, and macronutrients
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingNutrition ? "Edit Nutrition Entry" : "Add New Meal"}
              </DialogTitle>
              <DialogDescription>
                {editingNutrition ? "Update your nutrition details" : "Add a new meal to your nutrition log"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mealType">Meal Type</Label>
                  <Select
                    value={formData.mealType}
                    onValueChange={(value) => setFormData({ ...formData, mealType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  min="0"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Macronutrients (grams)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="protein" className="text-sm">Protein</Label>
                    <Input
                      id="protein"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.macros?.protein || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        macros: { ...formData.macros, protein: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs" className="text-sm">Carbs</Label>
                    <Input
                      id="carbs"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.macros?.carbs || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        macros: { ...formData.macros, carbs: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fats" className="text-sm">Fats</Label>
                    <Input
                      id="fats"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.macros?.fats || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        macros: { ...formData.macros, fats: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about this meal..."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNutrition ? "Update" : "Add"} Meal
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
            placeholder="Search meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {Object.keys(groupedNutrition).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Apple className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No nutrition entries found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? "No meals match your search criteria" : "Start tracking your nutrition to see your data here"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Meal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNutrition)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dateEntries]) => {
              const totalCalories = getTotalCalories(dateEntries)
              const totalMacros = getTotalMacros(dateEntries)
              
              return (
                <div key={date} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-lg font-semibold">{date}</h2>
                      <Badge variant="secondary">{dateEntries.length} meal{dateEntries.length !== 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">{totalCalories} cal</span>
                      <span className="mx-2">•</span>
                      <span>P: {totalMacros.protein.toFixed(1)}g</span>
                      <span className="mx-1">•</span>
                      <span>C: {totalMacros.carbs.toFixed(1)}g</span>
                      <span className="mx-1">•</span>
                      <span>F: {totalMacros.fats.toFixed(1)}g</span>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {dateEntries.map((entry) => (
                      <Card key={entry._id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Utensils className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold capitalize">{entry.mealType}</h3>
                                <Badge variant="outline">{entry.calories} cal</Badge>
                              </div>
                              {entry.macros && (
                                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                  <span>P: {entry.macros.protein || 0}g</span>
                                  <span>C: {entry.macros.carbs || 0}g</span>
                                  <span>F: {entry.macros.fats || 0}g</span>
                                </div>
                              )}
                              {entry.notes && (
                                <p className="text-sm text-muted-foreground">{entry.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(entry)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(entry._id)}
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
              )
            })}
        </div>
      )}
    </div>
  )
}
