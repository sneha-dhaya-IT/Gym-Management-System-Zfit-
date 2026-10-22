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
import { FacilityFormModal } from "@/components/FacilityFormModal"
import { 
  Plus, 
  MapPin,
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

interface Facility {
  _id: string
  name: string
  capacity: number
  status: string
  equipments: string[]
  createdAt: string
  updatedAt: string
}

export default function FacilitiesPage() {
  const { isManager } = useAuth()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFacilities, setSelectedFacilities] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  // Modal states
  const [facilityModal, setFacilityModal] = useState<{ isOpen: boolean; facilityData: Facility | null }>({
    isOpen: false,
    facilityData: null
  })

  useEffect(() => {
    fetchFacilities()
  }, [])

  const fetchFacilities = async () => {
    setIsLoading(true)
    try {
      const response = await apiRequest("/bookings/facilities")
      setFacilities(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Failed to fetch bookings/facilities:", error)
      toast.error("Failed to load bookings/facilities")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (facilityId: string) => {
    if (!confirm("Are you sure you want to delete this facility?")) return
    
    try {
      await apiRequest(`/bookings/facilities/${facilityId}`, {
        method: "DELETE"
      })
      
      toast.success("Facility deleted successfully!")
      fetchFacilities()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete facility")
    }
  }

  const handleEdit = (facilityData: Facility) => {
    setFacilityModal({ isOpen: true, facilityData })
  }

  // Bulk selection functions
  const handleSelectAll = () => {
    if (selectedFacilities.size === filteredFacilities.length) {
      setSelectedFacilities(new Set())
    } else {
      setSelectedFacilities(new Set(filteredFacilities.map(facility => facility._id)))
    }
  }

  const handleSelectFacility = (facilityId: string) => {
    const newSelected = new Set(selectedFacilities)
    if (newSelected.has(facilityId)) {
      newSelected.delete(facilityId)
    } else {
      newSelected.add(facilityId)
    }
    setSelectedFacilities(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedFacilities.size === 0) {
      toast.error("Please select bookings/facilities to delete")
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedFacilities.size} facility(ies)? This action cannot be undone.`
    )

    if (!confirmed) return

    setIsBulkDeleting(true)
    try {
      // Delete bookings/facilities one by one
      for (const facilityId of selectedFacilities) {
        await apiRequest(`/bookings/facilities/${facilityId}`, {
          method: "DELETE"
        })
      }
      toast.success(`${selectedFacilities.size} facility(ies) deleted successfully!`)
      setSelectedFacilities(new Set())
      fetchFacilities()
    } catch (error: any) {
      console.error("Failed to delete bookings/facilities:", error)
      toast.error(error.message || "Failed to delete bookings/facilities")
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = 
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.equipments.some(eq => eq.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || facility.status === statusFilter
    
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
          <h1 className="text-3xl font-bold text-white">Facilities Management</h1>
          <p className="text-gray-400">Manage gym bookings/facilities and equipment</p>
        </div>
        <Button
          onClick={() => setFacilityModal({ isOpen: true, facilityData: null })}
          className="bg-[#AAFF69] text-black hover:bg-[#AAFF69]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Facility
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
                  placeholder="Search by facility name or equipment..."
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

      {/* Facilities Table */}
      <Card className="bg-[#202022] border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#AAFF69]" />
              Facilities ({filteredFacilities.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions */}
          {filteredFacilities.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedFacilities.size === filteredFacilities.length && filteredFacilities.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                  />
                  <span className="text-gray-300 text-sm">
                    {selectedFacilities.size === filteredFacilities.length ? "Deselect All" : "Select All"}
                  </span>
                </div>
                {selectedFacilities.size > 0 && (
                  <span className="text-[#AAFF69] text-sm font-medium">
                    {selectedFacilities.size} facility(ies) selected
                  </span>
                )}
              </div>
              {selectedFacilities.size > 0 && (
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
                      Delete Selected ({selectedFacilities.size})
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
                      checked={selectedFacilities.size === filteredFacilities.length && filteredFacilities.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                    />
                  </TableHead>
                  <TableHead className="text-gray-300">Facility Name</TableHead>
                  <TableHead className="text-gray-300">Capacity</TableHead>
                  <TableHead className="text-gray-300">Equipment</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacilities.map((facility) => (
                  <TableRow key={facility._id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell className="text-white">
                      <Checkbox
                        checked={selectedFacilities.has(facility._id)}
                        onCheckedChange={() => handleSelectFacility(facility._id)}
                        className="data-[state=checked]:bg-[#AAFF69] data-[state=checked]:border-[#AAFF69]"
                      />
                    </TableCell>
                    <TableCell className="text-white font-medium">{facility.name}</TableCell>
                    <TableCell className="text-white">{facility.capacity}</TableCell>
                    <TableCell className="text-white">
                      <div className="flex flex-wrap gap-1">
                        {facility.equipments.slice(0, 3).map((equipment, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {equipment}
                          </Badge>
                        ))}
                        {facility.equipments.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{facility.equipments.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(facility.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(facility)}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(facility._id)}
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
          
          {filteredFacilities.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No bookings/facilities found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facility Modal */}
      <FacilityFormModal
        isOpen={facilityModal.isOpen}
        onClose={() => setFacilityModal({ isOpen: false, facilityData: null })}
        onSuccess={fetchFacilities}
        facilityData={facilityModal.facilityData}
      />
    </div>
  )
}
