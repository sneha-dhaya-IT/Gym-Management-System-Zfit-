import type { Request, Response, NextFunction } from 'express'
import {
  generateMembershipsReport,
  generateMembershipPlansReport,
  generateMembersReport,
  generateStaffReport,
  generateManagersReport,
  generatePaymentsReport,
  generateInventoryItemsReport,
  generateStockLevelsReport,
  generateSuppliersReport,
  generateCategoriesReport,
  generateRefundsReport,
  generateInvoicesReport,
  generateRefundRequestsReport,
  type InventoryReportFilters,
  type UserReportFilters,
  type MembershipReportFilters,
  type MembershipPlanReportFilters,
  type PaymentReportFilters,
  type InvoiceReportFilters,
  type RefundRequestReportFilters
} from '../services/report.service.js'

export const generateMembershipsReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string
    const searchTerm = req.query.searchTerm as string
    const status = req.query.status as string
    const planId = req.query.planId as string
    
    const filters = {
      searchTerm: searchTerm || undefined,
      status: status || undefined,
      planId: planId || undefined
    }

    const pdfBuffer = await generateMembershipsReport(filters)

    // Generate appropriate filename
    const hasFilters = searchTerm || status || planId
    const filename = hasFilters ? 'memberships-report-filtered.pdf' : 'memberships-report.pdf'

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const generateMembershipPlansReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string
    const searchTerm = req.query.searchTerm as string
    const category = req.query.category as string
    
    const filters = {
      searchTerm: searchTerm || undefined,
      category: category || undefined
    }

    const pdfBuffer = await generateMembershipPlansReport(filters)

    // Generate appropriate filename
    const hasFilters = searchTerm || category
    const filename = hasFilters ? 'membership-plans-report-filtered.pdf' : 'membership-plans-report.pdf'

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const generateMembersReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string
    const searchTerm = req.query.searchTerm as string
    const status = req.query.status as string
    
    const filters = {
      searchTerm: searchTerm || undefined,
      status: status || undefined
    }

    const pdfBuffer = await generateMembersReport(filters)

    // Generate appropriate filename
    const hasFilters = searchTerm || status
    const filename = hasFilters ? 'members-report-filtered.pdf' : 'members-report.pdf'

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const generateStaffReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string
    const searchTerm = req.query.searchTerm as string
    const status = req.query.status as string
    
    const filters = {
      searchTerm: searchTerm || undefined,
      status: status || undefined
    }

    const pdfBuffer = await generateStaffReport(filters)

    // Generate appropriate filename
    const hasFilters = searchTerm || status
    const filename = hasFilters ? 'staff-report-filtered.pdf' : 'staff-report.pdf'

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const generateManagersReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string
    const searchTerm = req.query.searchTerm as string
    const status = req.query.status as string
    
    const filters = {
      searchTerm: searchTerm || undefined,
      status: status || undefined
    }

    const pdfBuffer = await generateManagersReport(filters)

    // Generate appropriate filename
    const hasFilters = searchTerm || status
    const filename = hasFilters ? 'managers-report-filtered.pdf' : 'managers-report.pdf'

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const generateInventoryItemsReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string (GET) or request body (POST)
    const isPostRequest = req.method === 'POST'
    const source = isPostRequest ? req.body : req.query
    
    const filters: InventoryReportFilters = {
      searchTerm: source.searchTerm || undefined,
      categoryId: source.categoryId || undefined,
      type: source.type || undefined,
      lowStockOnly: source.lowStockOnly === 'true' || source.lowStockOnly === true || undefined,
      supplierId: source.supplierId || undefined,
      minStock: source.minStock ? parseInt(source.minStock as string) : undefined,
      maxStock: source.maxStock ? parseInt(source.maxStock as string) : undefined
    }

    const pdfBuffer = await generateInventoryItemsReport(filters)

    // Generate filename with timestamp and filter indication
    const timestamp = new Date().toISOString().split('T')[0]
    const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '')
    const filename = `inventory-items-report${hasFilters ? '-filtered' : ''}-${timestamp}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const generateStockLevelsReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string (GET) or request body (POST)
    const isPostRequest = req.method === 'POST'
    const source = isPostRequest ? req.body : req.query
    
    const filters: InventoryReportFilters = {
      searchTerm: source.searchTerm || undefined,
      categoryId: source.categoryId || undefined,
      lowStockOnly: source.lowStockOnly === 'true' || source.lowStockOnly === true || undefined,
      supplierId: source.supplierId || undefined,
      minStock: source.minStock ? parseInt(source.minStock as string) : undefined,
      maxStock: source.maxStock ? parseInt(source.maxStock as string) : undefined
    }

    const pdfBuffer = await generateStockLevelsReport(filters)

    // Generate filename with timestamp and filter indication
    const timestamp = new Date().toISOString().split('T')[0]
    const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '')
    const filename = `stock-levels-report${hasFilters ? '-filtered' : ''}-${timestamp}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const generateSuppliersReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string
    const filters = {
      searchTerm: req.query.searchTerm as string
    }

    const pdfBuffer = await generateSuppliersReport(filters.searchTerm)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=suppliers-report.pdf')
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const generateCategoriesReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string
    const filters = {
      searchTerm: req.query.searchTerm as string,
      activeOnly: req.query.activeOnly === 'true'
    }

    const pdfBuffer = await generateCategoriesReport(filters)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=categories-report.pdf')
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const generateInvoicesReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string
    const searchTerm = req.query.searchTerm as string
    const status = req.query.status as string
    
    const filters = {
      searchTerm: searchTerm || undefined,
      status: status || undefined
    }

    const pdfBuffer = await generateInvoicesReport(filters)

    // Generate appropriate filename
    const hasFilters = searchTerm || status
    const filename = hasFilters ? 'invoices-report-filtered.pdf' : 'invoices-report.pdf'

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    console.error('Error generating invoice report:', error)
    next(error)
  }
}

export const generatePaymentsReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string
    const searchTerm = req.query.searchTerm as string
    const status = req.query.status as string
    const type = req.query.type as string
    const method = req.query.method as string
    
    const filters = {
      searchTerm: searchTerm || undefined,
      status: status || undefined,
      type: type || undefined,
      method: method || undefined
    }

    const pdfBuffer = await generatePaymentsReport(filters)

    // Generate appropriate filename
    const hasFilters = searchTerm || status || type || method
    const filename = hasFilters ? 'payments-report-filtered.pdf' : 'payments-report.pdf'

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    console.error('Error generating payment report:', error)
    next(error)
  }
}

export const generateRefundsReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pdfBuffer = await generateRefundsReport()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=refunds-report.pdf')
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
}

export const generateRefundRequestsReportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract filter parameters from query string
    const searchTerm = req.query.searchTerm as string
    const status = req.query.status as string
    
    const filters = {
      searchTerm: searchTerm || undefined,
      status: status || undefined
    }

    const pdfBuffer = await generateRefundRequestsReport(filters)

    // Generate appropriate filename
    const hasFilters = searchTerm || status
    const filename = hasFilters ? 'refund-requests-report-filtered.pdf' : 'refund-requests-report.pdf'

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.send(pdfBuffer)
  } catch (error) {
    console.error('Error generating refund requests report:', error)
    next(error)
  }
}