"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Truck, Search, Download } from 'lucide-react'
import { supplierApiService } from '@/lib/api/supplierApi'
import type { SupplierData } from '@/lib/api/supplierApi'
import { SupplierFormModal, SupplierFormData, UpdateSupplierFormData } from '@/components/SupplierFormModal'

interface Supplier {
  _id: string
  supplierName: string
  supplierEmail: string
  supplierPhone: string
  supplierAddress: string
  createdAt: string
  updatedAt?: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await supplierApiService.getSuppliers()
      setSuppliers(response.data as Supplier[])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      setError('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSupplier = () => {
    setEditingSupplier(null)
    setModalOpen(true)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setModalOpen(true)
  }

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return

    try {
      await supplierApiService.deleteSupplier(supplierId)
      setSuppliers(suppliers.filter(supplier => supplier._id !== supplierId))
    } catch (error) {
      console.error('Error deleting supplier:', error)
      setError('Failed to delete supplier')
    }
  }

  const handleModalSubmit = async (formData: SupplierFormData | UpdateSupplierFormData) => {
    try {
      if (editingSupplier) {
        // Update existing supplier
        await supplierApiService.updateSupplier(editingSupplier._id, formData)
      } else {
        // Create new supplier
        await supplierApiService.createSupplier(formData as SupplierData)
      }
      fetchSuppliers() // Refresh the list
    } catch (error) {
      console.error('Error saving supplier:', error)
      setError('Failed to save supplier')
      throw error
    }
  }

  const handleGenerateReport = async () => {
    try {
      // Build query parameters based on current filters
      const queryParams = new URLSearchParams()
      
      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm)
      }
      
      const url = `http://localhost:5000/api/v1/reports/suppliers/pdf${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Include filter info in filename if filters are applied
      const filterSuffix = searchTerm ? '-filtered' : ''
      link.download = `suppliers-report${filterSuffix}-${new Date().toISOString().split('T')[0]}.pdf`
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Error generating report:', error)
      setError('Failed to generate suppliers report')
    }
  }

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(supplier => {
    const searchLower = searchTerm.toLowerCase()
    
    return (
      supplier.supplierName.toLowerCase().includes(searchLower) ||
      supplier.supplierEmail.toLowerCase().includes(searchLower) ||
      supplier.supplierPhone.toLowerCase().includes(searchLower) ||
      supplier.supplierAddress.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
            <p className="text-muted-foreground">Manage inventory suppliers</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading suppliers...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-muted-foreground">Manage inventory suppliers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddSupplier}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
          <Button variant="outline" onClick={handleGenerateReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            All Suppliers
          </CardTitle>
          <CardDescription>
            View and manage all inventory suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier._id}>
                  <TableCell className="font-medium">{supplier.supplierName}</TableCell>
                  <TableCell>{supplier.supplierEmail}</TableCell>
                  <TableCell>{supplier.supplierPhone}</TableCell>
                  <TableCell>{supplier.supplierAddress}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSupplier(supplier._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSuppliers.length === 0 && suppliers.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No suppliers found matching your search</p>
              <p className="text-sm">Try adjusting your search terms</p>
            </div>
          )}

          {suppliers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No suppliers found</p>
              <p className="text-sm">Add your first supplier to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SupplierFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingSupplier ? {
          supplierName: editingSupplier.supplierName,
          supplierEmail: editingSupplier.supplierEmail,
          supplierPhone: editingSupplier.supplierPhone,
          supplierAddress: editingSupplier.supplierAddress,
        } : undefined}
        mode={editingSupplier ? 'edit' : 'add'}
        title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
      />
    </div>
  )
}