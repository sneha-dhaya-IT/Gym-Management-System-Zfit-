"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TrainerFormModal } from "@/components/TrainerFormModal"
import { 
  Plus, 
  Users,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckSquare,
  Square,
  RefreshCw
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { apiRequest } from "@/lib/apiRequest"
import { toast } from "sonner"

interface Trainer {
  _id: string
  name: string
  specialization: string
  experience: number
  status: string
  createdAt: string
  updatedAt: string
}

export default function TrainersPage() {
  const { isManager } = useAuth()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTrainers, setSelectedTrainers] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  // Modal states
  const [trainerModal, setTrainerModal] = useState<{ isOpen: boolean; trainerData: Trainer | null }>({
    isOpen: false,
    trainerData: null
  })

  useEffect(() => {
    fetchTrainers()
  }, [])

  const fetchTrainers = async () => {
    setIsLoading(true)
    try {
      const response = await apiRequest("/bookings/trainers")
      setTrainers(response.data || [])
    } catch (error) {
      console.error("Failed to fetch trainers:", error)
      toast.error("Failed to load trainers")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (trainerId: string) => {
    if (!confirm("Are you sure you want to delete this trainer?")) return
    
    try {
      await apiRequest(`/bookings/trainers/${trainerId}`, {
        method: "DELETE"
      })
      
      toast.success("Trainer deleted successfully!")
      fetchTrainers()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete trainer")
    }
  }

  const handleEdit = (trainerData: Trainer) => {
    setTrainerModal({ isOpen: true, trainerData })
  }

  // Bulk selection functions
  const handleSelectAll = () => {
    if (selectedTrainers.size === filteredTrainers.length) {
      setSelectedTrainers(new Set())
    } else {
      setSelectedTrainers(new Set(filteredTrainers.map(trainer => trainer._id)))
    }
  }

  const handleSelectTrainer = (trainerId: string) => {
    const newSelected = new Set(selectedTrainers)
    if (newSelected.has(trainerId)) {
      newSelected.delete(trainerId)
    } else {
      newSelected.add(trainerId)
    }
    setSelectedTrainers(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedTrainers.size === 0) {
      toast.error("Please select trainers to delete")
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedTrainers.size} trainer(s)? This action cannot be undone.`
    )

    if (!confirmed) return

    setIsBulkDeleting(true)
    try {
      // Delete trainers one by one
      for (const trainerId of selectedTrainers) {
        await apiRequest(`/bookings/trainers/${trainerId}`, {
          method: "DELETE"
        })
      }
      toast.success(`${selectedTrainers.size} trainer(s) deleted successfully!`)
      setSelectedTrainers(new Set())
      fetchTrainers()
    } catch (error: any) {
      console.error("Failed to delete trainers:", error)
      toast.error(error.message || "Failed to delete trainers")
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = 
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || trainer.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      inactive: "bg-red-500/20 text-red-400 border-red-500/30"
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.inactive}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Access control removed - all users can access this page

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Trainers Management</h1>
          <p className="text-gray-400">Manage fitness trainers and their specializations</p>
        </div>
        <Button
          onClick={() => setTrainerModal({ isOpen: true, trainerData: null })}
          className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Trainer
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="bg-[#202022] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#AAFF69]" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by trainer name or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#202022] border-gray-700 text-white focus:border-[#AAFF69] focus:ring-[#AAFF69]"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#202022] border border-gray-700 text-white rounded-md focus:border-[#AAFF69] focus:ring-[#AAFF69]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Trainers Table */}
      <Card className="bg-[#202022] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-[#AAFF69]" />
              Trainers ({filteredTrainers.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions */}
          {filteredTrainers.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedTrainers.size === filteredTrainers.length && filteredTrainers.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                  />
                  <span className="text-gray-300 text-sm">
                    {selectedTrainers.size === filteredTrainers.length ? "Deselect All" : "Select All"}
                  </span>
                </div>
                {selectedTrainers.size > 0 && (
                  <span className="text-[#AAFF69] text-sm font-medium">
                    {selectedTrainers.size} trainer(s) selected
                  </span>
                )}
              </div>
              {selectedTrainers.size > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isBulkDeleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedTrainers.size})
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
          
          <div className="bg-[#202022] border border-gray-700 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300 w-12">
                    <Checkbox
                      checked={selectedTrainers.size === filteredTrainers.length && filteredTrainers.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                    />
                  </TableHead>
                  <TableHead className="text-gray-300">Trainer Name</TableHead>
                  <TableHead className="text-gray-300">Specialization</TableHead>
                  <TableHead className="text-gray-300">Experience</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainers.map((trainer) => (
                  <TableRow key={trainer._id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell className="text-white">
                      <Checkbox
                        checked={selectedTrainers.has(trainer._id)}
                        onCheckedChange={() => handleSelectTrainer(trainer._id)}
                        className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                      />
                    </TableCell>
                    <TableCell className="text-white font-medium">{trainer.name}</TableCell>
                    <TableCell className="text-white">{trainer.specialization}</TableCell>
                    <TableCell className="text-white">{trainer.experience} years</TableCell>
                    <TableCell>{getStatusBadge(trainer.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(trainer)}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(trainer._id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredTrainers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No trainers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trainer Modal */}
      <TrainerFormModal
        isOpen={trainerModal.isOpen}
        onClose={() => setTrainerModal({ isOpen: false, trainerData: null })}
        onSuccess={fetchTrainers}
        trainerData={trainerModal.trainerData}
      />
    </div>
  )
}
