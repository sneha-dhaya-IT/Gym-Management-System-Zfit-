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
import { ClassModal } from "@/components/ClassModal"
import { 
  Plus, 
  Dumbbell,
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


interface Class {
  _id: string
  name: string
  type: string
  duration: number
  maxCapacity: number
  price: number
  status: string
  createdAt: string
  updatedAt: string
}

export default function ClassesPage() {
  const { isManager } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  // Modal states
  const [classModal, setClassModal] = useState<{ isOpen: boolean; classData: Class | null }>({
    isOpen: false,
    classData: null
  })

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    setIsLoading(true)
    try {
      const response = await apiRequest<{ data: Class[] }>("/bookings/classes")
      setClasses(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Failed to fetch classes:", error)
      toast.error("Failed to load classes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return
    
    try {
      await apiRequest(`/bookings/classes/${classId}`, {
        method: "DELETE"
      })
      
      toast.success("Class deleted successfully!")
      fetchClasses()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete class")
    }
  }

  const handleEdit = (classData: Class) => {
    setClassModal({ isOpen: true, classData })
  }

  // Bulk selection functions
  const handleSelectAll = () => {
    if (selectedClasses.size === filteredClasses.length) {
      setSelectedClasses(new Set())
    } else {
      setSelectedClasses(new Set(filteredClasses.map(cls => cls._id)))
    }
  }

  const handleSelectClass = (classId: string) => {
    const newSelected = new Set(selectedClasses)
    if (newSelected.has(classId)) {
      newSelected.delete(classId)
    } else {
      newSelected.add(classId)
    }
    setSelectedClasses(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedClasses.size === 0) {
      toast.error("Please select classes to delete")
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedClasses.size} class(es)? This action cannot be undone.`
    )

    if (!confirmed) return

    setIsBulkDeleting(true)
    try {
      // Delete classes one by one
      for (const classId of selectedClasses) {
        await apiRequest(`/bookings/classes/${classId}`, {
          method: "DELETE"
        })
      }
      toast.success(`${selectedClasses.size} class(es) deleted successfully!`)
      setSelectedClasses(new Set())
      fetchClasses()
    } catch (error: any) {
      console.error("Failed to delete classes:", error)
      toast.error(error.message || "Failed to delete classes")
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || cls.status === statusFilter
    
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
          <h1 className="text-3xl font-bold text-white">Classes Management</h1>
          <p className="text-gray-400">Manage fitness classes and their details</p>
        </div>
        <Button
          onClick={() => setClassModal({ isOpen: true, classData: null })}
          className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Class
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
                  placeholder="Search by class name or type..."
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

      {/* Classes Table */}
      <Card className="bg-[#202022] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-[#AAFF69]" />
              Classes ({filteredClasses.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions */}
          {filteredClasses.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedClasses.size === filteredClasses.length && filteredClasses.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                  />
                  <span className="text-gray-300 text-sm">
                    {selectedClasses.size === filteredClasses.length ? "Deselect All" : "Select All"}
                  </span>
                </div>
                {selectedClasses.size > 0 && (
                  <span className="text-[#AAFF69] text-sm font-medium">
                    {selectedClasses.size} class(es) selected
                  </span>
                )}
              </div>
              {selectedClasses.size > 0 && (
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
                      Delete Selected ({selectedClasses.size})
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
                      checked={selectedClasses.size === filteredClasses.length && filteredClasses.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                    />
                  </TableHead>
                  <TableHead className="text-gray-300">Class Name</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Duration</TableHead>
                  <TableHead className="text-gray-300">Capacity</TableHead>
                  <TableHead className="text-gray-300">Price</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow key={cls._id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell className="text-white">
                      <Checkbox
                        checked={selectedClasses.has(cls._id)}
                        onCheckedChange={() => handleSelectClass(cls._id)}
                        className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                      />
                    </TableCell>
                    <TableCell className="text-white font-medium">{cls.name}</TableCell>
                    <TableCell className="text-white capitalize">{cls.type}</TableCell>
                    <TableCell className="text-white">{cls.duration} min</TableCell>
                    <TableCell className="text-white">{cls.maxCapacity}</TableCell>
                    <TableCell className="text-white">LKR {cls.price}</TableCell>
                    <TableCell>{getStatusBadge(cls.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(cls)}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cls._id)}
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
          
          {filteredClasses.length === 0 && (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No classes found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Class Modal */}
      <ClassModal
        isOpen={classModal.isOpen}
        onClose={() => setClassModal({ isOpen: false, classData: null })}
        onSuccess={fetchClasses}
        classData={classModal.classData}
      />
    </div>
  )
}
