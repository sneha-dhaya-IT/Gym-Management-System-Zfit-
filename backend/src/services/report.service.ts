/* eslint-disable @typescript-eslint/no-explicit-any */
import puppeteer from 'puppeteer'
import { getAllMemberships } from './membership.service.js'
import { getPaymentsService } from './payment.services.js'
import { getRefundRequestsService } from './refundRequest.services.js'
import { getInvoicesService } from './invoice.services.js'

export interface ReportColumn {
  key: string
  header: string
  type?: 'text' | 'date' | 'currency' | 'status' | 'boolean'
  className?: string
  formatter?: (value: any, row?: any) => string
}

export interface ReportConfig {
  title: string
  companyName?: string
  columns: ReportColumn[]
  data: any[]
  customStyles?: string
}

export interface InventoryReportFilters {
  searchTerm?: string | undefined
  categoryId?: string | undefined
  type?: string | undefined
  lowStockOnly?: boolean | undefined
  supplierId?: string | undefined
  minStock?: number | undefined
  maxStock?: number | undefined
}

export interface UserReportFilters {
  searchTerm?: string | undefined
  status?: string | undefined
}

export interface MembershipReportFilters {
  searchTerm?: string | undefined
  status?: string | undefined
  planId?: string | undefined
}

export interface MembershipPlanReportFilters {
  searchTerm?: string | undefined
  category?: string | undefined
}

export interface PaymentReportFilters {
  searchTerm?: string | undefined
  status?: string | undefined
  type?: string | undefined
  method?: string | undefined
}

export interface InvoiceReportFilters {
  searchTerm?: string | undefined
  status?: string | undefined
}

export interface RefundRequestReportFilters {
  searchTerm?: string | undefined
  status?: string | undefined
}

/**
 * Apply filters to inventory items array
 */
function applyInventoryFilters(items: any[], filters: InventoryReportFilters): any[] {
  let filteredItems = [...items]

  // Filter by search term (item name)
  if (filters.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase()
    filteredItems = filteredItems.filter(item => 
      item.name?.toLowerCase().includes(searchLower) ||
      (typeof item.categoryID === 'object' ? item.categoryID?.name?.toLowerCase().includes(searchLower) : false) ||
      (typeof item.supplierID === 'object' ? item.supplierID?.supplierName?.toLowerCase().includes(searchLower) : false)
    )
  }

  // Filter by category
  if (filters.categoryId) {
    filteredItems = filteredItems.filter(item => {
      const categoryId = typeof item.categoryID === 'object' ? item.categoryID?._id?.toString() : item.categoryID?.toString()
      return categoryId === filters.categoryId
    })
  }

  // Filter by type
  if (filters.type) {
    filteredItems = filteredItems.filter(item => item.type === filters.type)
  }

  // Filter by supplier
  if (filters.supplierId) {
    filteredItems = filteredItems.filter(item => {
      const supplierId = typeof item.supplierID === 'object' ? item.supplierID?._id?.toString() : item.supplierID?.toString()
      return supplierId === filters.supplierId
    })
  }

  // Filter by stock range
  if (filters.minStock !== undefined) {
    filteredItems = filteredItems.filter(item => (item.stock || 0) >= filters.minStock!)
  }

  if (filters.maxStock !== undefined) {
    filteredItems = filteredItems.filter(item => (item.stock || 0) <= filters.maxStock!)
  }

  // Filter by low stock only
  if (filters.lowStockOnly) {
    filteredItems = filteredItems.filter(item => {
      const currentStock = item.stock || 0
      const alertThreshold = item.lowStockAlert || 10
      return currentStock <= alertThreshold
    })
  }

  return filteredItems
}

/**
 * Generate PDF from HTML content
 */
async function generatePDF(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

/**
 * Generate HTML content for a generic report
 */
function generateGenericHTML(config: ReportConfig): string {
  const { title, companyName = 'ZFit Gym Management System', columns, data, customStyles = '' } = config

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          background-color: #ffffff;
          color: #000000;
          line-height: 1.5;
        }

        .container {
          padding: 20px;
          background-color: #ffffff;
        }

        .header {
          background: linear-gradient(135deg, #AAFF69 0%, #7BC96F 100%);
          color: #000000;
          padding: 24px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(170, 255, 105, 0.2);
          position: relative;
          overflow: hidden;
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23000000" opacity="0.03"/><circle cx="75" cy="75" r="1" fill="%23000000" opacity="0.03"/><circle cx="50" cy="10" r="0.5" fill="%23000000" opacity="0.02"/><circle cx="10" cy="50" r="0.5" fill="%23000000" opacity="0.02"/><circle cx="90" cy="30" r="0.5" fill="%23000000" opacity="0.02"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          pointer-events: none;
        }

        .header-content {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          flex: 1;
        }

        .company-name {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          letter-spacing: 1px;
          text-transform: uppercase;
          opacity: 0.9;
        }

        .report-title {
          font-size: 32px;
          font-weight: 800;
          margin: 8px 0 0 0;
          line-height: 1.1;
          letter-spacing: -0.5px;
        }

        .header-right {
          text-align: right;
          min-width: 200px;
        }

        .report-meta {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 4px;
        }

        .report-date {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }

        .header-accent {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #AAFF69, #7BC96F, #AAFF69);
          border-radius: 0 0 12px 12px;
        }

        .table-container {
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          background-color: #AAFF69;
        }

        thead th {
          color: #000000;
          font-weight: 600;
          font-size: 12px;
          padding: 12px 8px;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        tbody tr {
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 0.2s ease;
        }

        tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }

        tbody tr:hover {
          background-color: #f3f4f6;
        }

        tbody td {
          padding: 10px 8px;
          color: #000000;
          font-size: 11px;
          vertical-align: middle;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 500;
          color: #000000;
          font-size: 11px;
          margin-bottom: 2px;
        }

        .user-email {
          font-size: 10px;
          color: #666666;
        }

        .plan-info {
          display: flex;
          flex-direction: column;
        }

        .plan-name {
          font-weight: 500;
          color: #000000;
          font-size: 11px;
          margin-bottom: 2px;
        }

        .plan-price {
          font-size: 10px;
          color: #666666;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 6px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-active {
          background-color: #AAFF69;
          color: #000000;
        }

        .status-expired {
          background-color: #EF4444;
          color: #ffffff;
        }

        .status-cancelled {
          background-color: #6c757d;
          color: #ffffff;
        }

        .status-paused {
          background-color: #f59e0b;
          color: #000000;
        }

        .status-completed {
          background-color: #AAFF69;
          color: #000000;
        }

        .status-pending {
          background-color: #f59e0b;
          color: #000000;
        }

        .status-failed {
          background-color: #EF4444;
          color: #ffffff;
        }

        .status-refunded {
          background-color: #6c757d;
          color: #ffffff;
        }

        .auto-renew-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 6px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .auto-renew-yes {
          background-color: #AAFF69;
          color: #000000;
        }

        .auto-renew-no {
          background-color: #404040;
          color: #A0A0A0;
        }

        .date-cell {
          font-family: 'Inter', monospace;
          font-size: 11px;
          color: #000000;
        }

        .transaction-id {
          font-family: 'Inter', monospace;
          font-size: 10px;
          color: #666666;
          font-weight: 500;
        }

        .user-name-cell {
          font-weight: 500;
          color: #000000;
        }

        .currency-cell {
          font-family: 'Inter', monospace;
          text-align: center;
          font-weight: 500;
        }

        .date-cell {
          font-family: 'Inter', monospace;
          font-size: 13px;
          color: #000000;
        }

        ${customStyles}

        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
          color: #666666;
          font-size: 12px;
        }

        .footer-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .footer p {
          margin: 4px 0;
        }

        .footer .copyright {
          font-weight: 500;
        }

        .footer .generated-notice {
          font-style: italic;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-content">
            <div class="header-left">
              <h2 class="company-name">${companyName}</h2>
              <h1 class="report-title">${title}</h1>
            </div>
            <div class="header-right">
              <div class="report-meta">Report Generated</div>
              <p class="report-date">${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p class="report-date">${new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
          </div>
          <div class="header-accent"></div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${columns.map(col => {
                    const value = (row as Record<string, unknown>)[col.key]
                    let displayValue = ''

                    if (col.formatter) {
                      displayValue = col.formatter(value, row as Record<string, unknown>)
                    } else if (col.type === 'date' && value) {
                      displayValue = new Date(value as string).toLocaleDateString()
                    } else if (col.type === 'currency' && typeof value === 'number') {
                      displayValue = 'LKR ' + value.toFixed(2)
                    } else if (col.type === 'boolean') {
                      displayValue = value ? 'Yes' : 'No'
                    } else {
                      displayValue = String(value || 'N/A')
                    }

                    const className = col.className ? ` class="${col.className}"` : ''
                    return `<td${className}>${displayValue}</td>`
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div class="footer-content">
            <p class="copyright">© ${new Date().getFullYear()} ZFit Gym Management System. All rights reserved.</p>
            <p class="generated-notice">This report was generated online by ZFit Gym Management System</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate a generic PDF report
 */
export async function generateGenericReport(config: ReportConfig): Promise<Buffer> {
  const htmlContent = generateGenericHTML(config)
  return generatePDF(htmlContent)
}

/**
 * Generate memberships report
 */
export async function generateMembershipsReport(filters?: MembershipReportFilters): Promise<Buffer> {
  // Get all memberships data
  let memberships = await getAllMemberships()

  // Apply filters if provided
  if (filters) {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      memberships = memberships.filter((membership: any) => 
        membership.userId?.name?.toLowerCase().includes(searchLower) ||
        membership.userId?.email?.toLowerCase().includes(searchLower) ||
        membership.membershipPlanId?.name?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status) {
      memberships = memberships.filter((membership: any) => 
        membership.status?.toLowerCase() === filters.status?.toLowerCase()
      )
    }

    if (filters.planId) {
      memberships = memberships.filter((membership: any) => 
        membership.membershipPlanId?._id === filters.planId ||
        membership.membershipPlanId === filters.planId
      )
    }
  }

  const config: ReportConfig = {
    title: filters?.searchTerm || filters?.status || filters?.planId ? 'Memberships Report (Filtered)' : 'Memberships Report',
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'user',
        header: 'User',
        formatter: (value, row) => `
          <div class="user-info">
            <div class="user-name">${(row as any)?.userId?.name || 'N/A'}</div>
            <div class="user-email">${(row as any)?.userId?.email || 'N/A'}</div>
          </div>
        `
      },
      {
        key: 'membershipPlan',
        header: 'Membership Plan',
        formatter: (value, row) => `
          <div class="plan-info">
            <div class="plan-name">${(row as any)?.membershipPlanId?.name || 'N/A'}</div>
            <div class="plan-price">${(row as any)?.membershipPlanId?.price ? 'LKR ' + (row as any).membershipPlanId.price : 'N/A'}</div>
          </div>
        `
      },
      {
        key: 'status',
        header: 'Status',
        type: 'status',
        formatter: (value) => `<span class="status-badge status-${value}">${value}</span>`
      },
      {
        key: 'startDate',
        header: 'Start Date',
        type: 'date',
        className: 'date-cell'
      },
      {
        key: 'endDate',
        header: 'End Date',
        type: 'date',
        className: 'date-cell'
      },
      {
        key: 'autoRenew',
        header: 'Auto Renew',
        type: 'boolean',
        formatter: (value) => `<span class="auto-renew-badge ${value ? 'auto-renew-yes' : 'auto-renew-no'}">${value ? 'Yes' : 'No'}</span>`
      },
      {
        key: 'transactionId',
        header: 'Transaction ID',
        className: 'transaction-id'
      }
    ],
    data: memberships as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate membership plans report
 */
export async function generateMembershipPlansReport(filters?: MembershipPlanReportFilters): Promise<Buffer> {
  // Get all membership plans data
  const { getAllMembershipPlans } = await import('./membershipPlan.service.js')
  let membershipPlans = await getAllMembershipPlans()

  // Apply filters if provided
  if (filters) {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      membershipPlans = membershipPlans.filter((plan: any) => 
        plan.name?.toLowerCase().includes(searchLower) ||
        plan.description?.toLowerCase().includes(searchLower) ||
        plan.category?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.category) {
      membershipPlans = membershipPlans.filter((plan: any) => 
        plan.category?.toLowerCase() === filters.category?.toLowerCase()
      )
    }
  }

  const config: ReportConfig = {
    title: filters?.searchTerm || filters?.category ? 'Membership Plans Report (Filtered)' : 'Membership Plans Report',
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'name',
        header: 'Plan Name'
      },
      {
        key: 'description',
        header: 'Description',
        formatter: (value) => value || 'No description'
      },
      {
        key: 'price',
        header: 'Price',
        type: 'currency',
        formatter: (value, row) => `${(row as any)?.currency || 'USD'} ${(value as number)?.toLocaleString() || '0'}`
      },
      {
        key: 'durationInDays',
        header: 'Duration',
        formatter: (value) => {
          const days = value as number
          if (days === 30) return '1 Month'
          if (days === 90) return '3 Months'
          if (days === 180) return '6 Months'
          if (days === 365) return '1 Year'
          return `${days} Days`
        }
      },
      {
        key: 'category',
        header: 'Category',
        formatter: (value) => `<span class="category-badge category-${value}">${value.charAt(0).toUpperCase() + value.slice(1)}</span>`
      },
      {
        key: 'createdAt',
        header: 'Created Date',
        type: 'date',
        className: 'date-cell'
      }
    ],
    data: membershipPlans as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate members report
 */
export async function generateMembersReport(filters?: UserReportFilters): Promise<Buffer> {
  // Get all members data
  const { getAllMembers } = await import('./user.service.js')
  let members = await getAllMembers()

  // Apply filters if provided
  if (filters) {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      members = members.filter((member: any) => 
        member.name?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.contactNo?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status) {
      members = members.filter((member: any) => 
        member.status?.toLowerCase() === filters.status?.toLowerCase()
      )
    }
  }

  const config: ReportConfig = {
    title: filters?.searchTerm || filters?.status ? 'Members Report (Filtered)' : 'Members Report',
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'name',
        header: 'Name'
      },
      {
        key: 'email',
        header: 'Email'
      },
      {
        key: 'contactNo',
        header: 'Contact Number'
      },
      {
        key: 'status',
        header: 'Status',
        formatter: (value) => `<span class="status-badge status-${value}">${value.charAt(0).toUpperCase() + value.slice(1)}</span>`
      },
      {
        key: 'createdAt',
        header: 'Created Date',
        type: 'date',
        className: 'date-cell'
      }
    ],
    data: members as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate staff report
 */
export async function generateStaffReport(filters?: UserReportFilters): Promise<Buffer> {
  // Get all staff data
  const { getAllStaff } = await import('./user.service.js')
  let staff = await getAllStaff()

  // Apply filters if provided
  if (filters) {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      staff = staff.filter((member: any) => 
        member.name?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.contactNo?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status) {
      staff = staff.filter((member: any) => 
        member.status?.toLowerCase() === filters.status?.toLowerCase()
      )
    }
  }

  const config: ReportConfig = {
    title: filters?.searchTerm || filters?.status ? 'Staff Report (Filtered)' : 'Staff Report',
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'name',
        header: 'Name'
      },
      {
        key: 'email',
        header: 'Email'
      },
      {
        key: 'contactNo',
        header: 'Contact Number'
      },
      {
        key: 'status',
        header: 'Status',
        formatter: (value) => `<span class="status-badge status-${value}">${value.charAt(0).toUpperCase() + value.slice(1)}</span>`
      },
      {
        key: 'createdAt',
        header: 'Created Date',
        type: 'date',
        className: 'date-cell'
      }
    ],
    data: staff as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate managers report
 */
export async function generateManagersReport(filters?: UserReportFilters): Promise<Buffer> {
  // Get all managers data
  const { getAllManagers } = await import('./user.service.js')
  let managers = await getAllManagers()

  // Apply filters if provided
  if (filters) {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      managers = managers.filter((member: any) => 
        member.name?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.contactNo?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status) {
      managers = managers.filter((member: any) => 
        member.status?.toLowerCase() === filters.status?.toLowerCase()
      )
    }
  }

  const config: ReportConfig = {
    title: filters?.searchTerm || filters?.status ? 'Managers Report (Filtered)' : 'Managers Report',
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'name',
        header: 'Name'
      },
      {
        key: 'email',
        header: 'Email'
      },
      {
        key: 'contactNo',
        header: 'Contact Number'
      },
      {
        key: 'status',
        header: 'Status',
        formatter: (value) => `<span class="status-badge status-${value}">${value.charAt(0).toUpperCase() + value.slice(1)}</span>`
      },
      {
        key: 'createdAt',
        header: 'Created Date',
        type: 'date',
        className: 'date-cell'
      }
    ],
    data: managers as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate Inventory Items Report with optional filters
 */
export async function generateInventoryItemsReport(filters?: InventoryReportFilters): Promise<Buffer> {
  const inventoryService = new (await import('./inventoryItem.service.js')).default()
  let items = await inventoryService.getAllItems()

  // Apply filters if provided
  if (filters) {
    items = applyInventoryFilters(items, filters)
  }

  const reportTitle = filters && Object.values(filters).some(v => v !== undefined && v !== '') 
    ? 'Filtered Inventory Items Report' 
    : 'Inventory Items Report'

  const config: ReportConfig = {
    title: reportTitle,
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'name',
        header: 'Item Name',
        className: 'item-name-cell'
      },
      {
        key: 'categoryID',
        header: 'Category',
        formatter: (value) => typeof value === 'object' ? value?.name || 'Unknown Category' : value || 'Unknown Category'
      },
      {
        key: 'supplierID',
        header: 'Supplier',
        formatter: (value) => typeof value === 'object' ? value?.supplierName || 'No Supplier' : 'No Supplier'
      },
      {
        key: 'stock',
        header: 'Current Stock',
        className: 'quantity-cell',
        formatter: (value) => value || '0'
      },
      {
        key: 'price',
        header: 'Price (LKR)',
        formatter: (value) => value ? `LKR ${value.toFixed(2)}` : 'N/A'
      },
      {
        key: 'lowStockAlert',
        header: 'Low Stock Alert',
        className: 'threshold-cell',
        formatter: (value) => value || 'Not Set'
      },
      {
        key: 'type',
        header: 'Type',
        formatter: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'
      }
    ],
    data: items as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate Stock Levels Report
 */
export async function generateStockLevelsReport(filters?: InventoryReportFilters): Promise<Buffer> {
  const inventoryService = new (await import('./inventoryItem.service.js')).default()
  let items = await inventoryService.getAllItems()

  // Filter only sellable items for stock report
  items = items.filter((item: any) => item.type === 'sellable')

  // Apply additional filters if provided
  if (filters) {
    items = applyInventoryFilters(items, filters)
  }

  // Transform data for stock report
  const stockData = items.map((item: any) => ({
    name: item.name,
    category: typeof item.categoryID === 'object' ? item.categoryID?.name : 'Unknown Category',
    supplier: typeof item.supplierID === 'object' ? item.supplierID?.supplierName : 'No Supplier',
    quantity: item.stock || 0,
    lowStock: (item.stock || 0) < (item.lowStockAlert || 10),
    lowStockAlert: item.lowStockAlert || 'Not Set',
    price: item.price || 0
  }))

  const reportTitle = filters && Object.values(filters).some(v => v !== undefined && v !== '') 
    ? 'Filtered Stock Levels Report' 
    : 'Stock Levels Report'

  const config: ReportConfig = {
    title: reportTitle,
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'name',
        header: 'Item Name',
        className: 'item-name-cell'
      },
      {
        key: 'category',
        header: 'Category',
        className: 'category-cell'
      },
      {
        key: 'supplier',
        header: 'Supplier'
      },
      {
        key: 'quantity',
        header: 'Current Stock',
        className: 'quantity-cell'
      },
      {
        key: 'lowStockAlert',
        header: 'Low Stock Alert',
        className: 'threshold-cell'
      },
      {
        key: 'price',
        header: 'Price (LKR)',
        formatter: (value) => value ? `LKR ${value.toFixed(2)}` : 'N/A'
      },
      {
        key: 'lowStock',
        header: 'Stock Status',
        formatter: (value) => value ? 
          '<span class="status-badge status-warning">LOW STOCK</span>' : 
          '<span class="status-badge status-good">GOOD</span>'
      }
    ],
    data: stockData as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate Suppliers Report
 */
export async function generateSuppliersReport(searchTerm?: string): Promise<Buffer> {
  const supplierService = new (await import('./inventorySupplier.service.js')).default()
  let suppliers = await supplierService.getAllSuppliers()

  // Apply search filter if provided
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase()
    suppliers = suppliers.filter((supplier: any) => 
      supplier.supplierName?.toLowerCase().includes(searchLower) ||
      supplier.supplierEmail?.toLowerCase().includes(searchLower) ||
      supplier.supplierPhone?.toLowerCase().includes(searchLower) ||
      supplier.supplierAddress?.toLowerCase().includes(searchLower)
    )
  }

  const reportTitle = searchTerm 
    ? 'Filtered Suppliers Report' 
    : 'Suppliers Report'

  const config: ReportConfig = {
    title: reportTitle,
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'supplierName',
        header: 'Supplier Name',
        className: 'supplier-name-cell'
      },
      {
        key: 'supplierEmail',
        header: 'Email',
        className: 'email-cell'
      },
      {
        key: 'supplierPhone',
        header: 'Phone',
        className: 'phone-cell'
      },
      {
        key: 'supplierAddress',
        header: 'Address',
        className: 'address-cell'
      },
      {
        key: 'createdAt',
        header: 'Added Date',
        type: 'date',
        className: 'date-cell'
      }
    ],
    data: suppliers as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate Categories Report
 */
export async function generateCategoriesReport(filters?: { searchTerm?: string; activeOnly?: boolean }): Promise<Buffer> {
  const Category = (await import('../models/category.model.js')).default
  const query: any = {}

  // Filter by active status if specified
  if (filters?.activeOnly) {
    query.isActive = true
  }

  let categories = await Category.find(query).sort({ name: 1 })

  // Apply search filter if provided
  if (filters?.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase()
    categories = categories.filter((category: any) => 
      category.name?.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower)
    )
  }

  const reportTitle = (filters?.searchTerm || filters?.activeOnly) 
    ? 'Filtered Categories Report' 
    : 'Categories Report'

  const config: ReportConfig = {
    title: reportTitle,
    columns: [
      {
        key: 'name',
        header: 'Category Name',
        className: 'name-cell'
      },
      {
        key: 'description',
        header: 'Description',
        className: 'description-cell',
        formatter: (value) => value || 'No description'
      },
      {
        key: 'isActive',
        header: 'Status',
        formatter: (value) => value ? 
          '<span class="status-badge status-good">ACTIVE</span>' : 
          '<span class="status-badge status-inactive">INACTIVE</span>'
      },
      {
        key: 'createdAt',
        header: 'Created Date',
        type: 'date',
        className: 'date-cell'
      }
    ],
    data: categories as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate Refunds Report
 */
export async function generateRefundsReport(): Promise<Buffer> {
  const { getRefundsService } = await import('./refund.services.js')
  const refunds = await getRefundsService()

  const config: ReportConfig = {
    title: 'Refunds Report',
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'refundId',
        header: 'Refund ID',
        className: 'refund-id-cell'
      },
      {
        key: 'userId',
        header: 'User ID',
        className: 'user-id-cell'
      },
      {
        key: 'paymentId',
        header: 'Payment ID',
        className: 'payment-id-cell'
      },
      {
        key: 'refundAmount',
        header: 'Refund Amount',
        formatter: (value) => `LKR ${value?.toFixed(2) || '0.00'}`
      },
      {
        key: 'originalAmount',
        header: 'Original Amount',
        formatter: (value) => `LKR ${value?.toFixed(2) || '0.00'}`
      },
      {
        key: 'reason',
        header: 'Reason',
        formatter: (value) => value ? value.replace('_', ' ').toUpperCase() : 'N/A'
      },
      {
        key: 'status',
        header: 'Status',
        formatter: (value) => `<span class="status-badge status-${value}">${value.toUpperCase()}</span>`
      },
      {
        key: 'createdAt',
        header: 'Created Date',
        type: 'date',
        className: 'date-cell'
      },
      {
        key: 'notes',
        header: 'Notes',
        className: 'notes-cell'
      }
    ],
    data: refunds as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate Invoices Report
 */
export async function generateInvoicesReport(filters?: InvoiceReportFilters): Promise<Buffer> {
  let invoices = await getInvoicesService()

  // Apply filters if provided (matching frontend logic exactly)
  if (filters) {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      invoices = invoices.filter((invoice: any) => 
        invoice.number?.toLowerCase().includes(searchLower) ||
        invoice.status?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.status && filters.status !== 'all') {
      invoices = invoices.filter((invoice: any) => 
        invoice.status === filters.status
      )
    }
  }

  // Format the invoices data for clean display
  const formattedInvoices = invoices.map(invoice => ({
    number: invoice.number || 'N/A',
    paymentId: typeof invoice.paymentId === 'object' && invoice.paymentId !== null
      ? (invoice.paymentId as any).transactionId || (invoice.paymentId as any)._id || 'N/A'
      : invoice.paymentId || 'N/A',
    userId: typeof invoice.userId === 'object' && invoice.userId !== null
      ? (invoice.userId as any).name || 'N/A'
      : 'N/A',
    subtotal: invoice.subtotal || 0,
    tax: invoice.tax || 0,
    discount: invoice.discount || 0,
    total: invoice.total || 0,
    status: invoice.status || 'N/A',
    dueDate: invoice.dueDate || invoice.createdAt || new Date(),
    generatedAt: invoice.generatedAt || invoice.createdAt || new Date()
  }))

  const config: ReportConfig = {
    title: filters?.searchTerm || filters?.status ? 'Invoices Report (Filtered)' : 'Invoices Report',
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'number',
        header: 'Invoice Number',
        className: 'invoice-number-cell'
      },
      {
        key: 'paymentId',
        header: 'Payment ID',
        className: 'payment-id-cell'
      },
      {
        key: 'userId',
        header: 'User Name',
        className: 'user-name-cell'
      },
      {
        key: 'subtotal',
        header: 'Subtotal',
        formatter: (value) => `LKR ${Number(value)?.toFixed(2) || '0.00'}`
      },
      {
        key: 'tax',
        header: 'Tax',
        formatter: (value) => `LKR ${Number(value)?.toFixed(2) || '0.00'}`
      },
      {
        key: 'discount',
        header: 'Discount',
        formatter: (value) => `LKR ${Number(value)?.toFixed(2) || '0.00'}`
      },
      {
        key: 'total',
        header: 'Total Amount',
        formatter: (value) => `LKR ${Number(value)?.toFixed(2) || '0.00'}`
      },
      {

        key: 'status',
        header: 'Status',
        formatter: (value) => `<span class="status-badge status-${String(value).toLowerCase()}">${String(value).toUpperCase()}</span>`
      },
      {

        key: 'dueDate',
        header: 'Due Date',
        type: 'date',
        className: 'date-cell'
      },
      {
        key: 'generatedAt',
        header: 'Generated Date',
        type: 'date',
        className: 'date-cell'
      }
    ],
    data: formattedInvoices as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate Payments Report
 */
export async function generatePaymentsReport(filters?: PaymentReportFilters): Promise<Buffer> {
  let payments = await getPaymentsService('')

  // Get refund requests to calculate effective payment status (matching frontend logic)
  let refundRequests: any[] = []
  try {
    refundRequests = await getRefundRequestsService()
  } catch (error) {
    console.warn('Could not fetch refund requests for payment status calculation:', error)
    refundRequests = []
  }

  // Helper function to get effective payment status (matching frontend logic exactly)
  const getEffectivePaymentStatus = (payment: any) => {
    const hasApprovedRefund = refundRequests.some((refund: any) => {
      const refundPaymentId = typeof refund.paymentId === 'string' 
        ? refund.paymentId 
        : refund.paymentId?._id || refund.paymentId
      return refundPaymentId === payment._id && refund.status === 'approved'
    })
    
    return hasApprovedRefund ? 'refunded' : payment.status
  }

  // Apply filters if provided (matching frontend logic exactly)
  if (filters) {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      payments = payments.filter((payment: any) => 
        payment.transactionId?.toLowerCase().includes(searchLower) ||
        payment._id?.toString().toLowerCase().includes(searchLower)
      )
    }

    if (filters.status && filters.status !== 'all') {
      payments = payments.filter((payment: any) => 
        getEffectivePaymentStatus(payment) === filters.status
      )
    }

    if (filters.type && filters.type !== 'all') {
      payments = payments.filter((payment: any) => 
        payment.type === filters.type
      )
    }

    if (filters.method && filters.method !== 'all') {
      payments = payments.filter((payment: any) => 
        payment.method === filters.method
      )
    }
  }

  // Helper function to get effective payment status (reuse the function defined above)
  const getEffectivePaymentStatusForReport = (payment: any) => {
    const hasApprovedRefund = refundRequests.some((refund: any) => {
      const refundPaymentId = typeof refund.paymentId === 'string' 
        ? refund.paymentId 
        : refund.paymentId?._id || refund.paymentId
      return refundPaymentId === payment._id && refund.status === 'approved'
    })
    
    return hasApprovedRefund ? 'refunded' : payment.status
  }

  // Format the payments data for clean display
  const formattedPayments = payments.map(payment => ({
    transactionId: payment.transactionId || 'N/A',
    userName: typeof payment.userId === 'object' && payment.userId !== null
      ? (payment.userId as any).name || 'N/A'
      : 'N/A',
    amount: payment.amount || 0,
    type: payment.type || 'N/A',
    method: payment.method || 'N/A',
    status: getEffectivePaymentStatusForReport(payment) || 'N/A',
    date: payment.date || payment.createdAt || new Date()
  }))

  const config: ReportConfig = {
    title: filters?.searchTerm || filters?.status || filters?.type || filters?.method ? 'Payments Report (Filtered)' : 'Payments Report',
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'transactionId',
        header: 'Transaction ID',
        className: 'transaction-id-cell'
      },
      {
        key: 'userName',
        header: 'User Name',
        className: 'user-name-cell'
      },
      {
        key: 'amount',
        header: 'Amount',
        formatter: (value) => `LKR ${Number(value)?.toFixed(2) || '0.00'}`
      },
      {
        key: 'type',
        header: 'Type',
        formatter: (value) => value ? String(value).toUpperCase().replace('_', ' ') : 'N/A'
      },
      {
        key: 'method',
        header: 'Method',
        formatter: (value) => value ? String(value).toUpperCase().replace('_', ' ').replace('-', ' ') : 'N/A'
      },
      {
        key: 'status',
        header: 'Status',
        formatter: (value) => `<span class="status-badge status-${String(value).toLowerCase()}">${String(value).toUpperCase()}</span>`
      },
      {
        key: 'date',
        header: 'Date',
        type: 'date',
        className: 'date-cell'
      }
    ],
    data: formattedPayments as any[]
  }

  return generateGenericReport(config)
}

/**
 * Generate Refund Requests Report
 */
export async function generateRefundRequestsReport(filters?: RefundRequestReportFilters): Promise<Buffer> {
  let refundRequests = await getRefundRequestsService()

  // Apply filters if provided (matching frontend logic exactly)
  if (filters) {
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      refundRequests = refundRequests.filter((request: any) => {
        const userName = typeof request.userId === 'object' ? request.userId?.name : ''
        const userEmail = typeof request.userId === 'object' ? request.userId?.email : ''
        
        return request.requestId?.toLowerCase().includes(searchLower) ||
               userName?.toLowerCase().includes(searchLower) ||
               userEmail?.toLowerCase().includes(searchLower) ||
               request.notes?.toLowerCase().includes(searchLower) ||
               request.status?.toLowerCase().includes(searchLower)
      })
    }

    if (filters.status && filters.status !== 'all') {
      refundRequests = refundRequests.filter((request: any) => 
        request.status === filters.status
      )
    }
  }

  // Format the refund requests data for clean display
  const formattedRefundRequests = refundRequests.map(request => ({
    requestId: request.requestId || 'N/A',
    userName: typeof request.userId === 'object' && request.userId !== null
      ? (request.userId as any).name || 'N/A'
      : 'N/A',
    userEmail: typeof request.userId === 'object' && request.userId !== null
      ? (request.userId as any).email || 'N/A'
      : 'N/A',
    requestedAmount: request.requestedAmount || 0,
    originalAmount: typeof request.paymentId === 'object' && request.paymentId !== null
      ? (request.paymentId as any).amount || 0
      : 0,
    status: request.status || 'N/A',
    notes: request.notes || 'N/A',
    adminNotes: request.adminNotes || 'N/A',
    createdAt: request.createdAt || new Date()
  }))

  const config: ReportConfig = {
    title: filters?.searchTerm || filters?.status ? 'Refund Requests Report (Filtered)' : 'Refund Requests Report',
    companyName: 'ZFit Gym Management System',
    columns: [
      {
        key: 'requestId',
        header: 'Request ID',
        className: 'request-id-cell'
      },
      {
        key: 'userName',
        header: 'User Name',
        className: 'user-name-cell'
      },
      {
        key: 'userEmail',
        header: 'User Email',
        className: 'user-email-cell'
      },
      {
        key: 'requestedAmount',
        header: 'Requested Amount',
        formatter: (value) => `LKR ${Number(value)?.toFixed(2) || '0.00'}`
      },
      {
        key: 'originalAmount',
        header: 'Original Amount',
        formatter: (value) => `LKR ${Number(value)?.toFixed(2) || '0.00'}`
      },
      {
        key: 'status',
        header: 'Status',
        formatter: (value) => `<span class="status-badge status-${String(value).toLowerCase()}">${String(value).toUpperCase()}</span>`
      },
      {
        key: 'notes',
        header: 'Notes',
        className: 'notes-cell'
      },
      {
        key: 'adminNotes',
        header: 'Admin Notes',
        className: 'admin-notes-cell'
      },
      {
        key: 'createdAt',
        header: 'Request Date',
        type: 'date',
        className: 'date-cell'
      }
    ],
    data: formattedRefundRequests as any[]
  }

  return generateGenericReport(config)
}