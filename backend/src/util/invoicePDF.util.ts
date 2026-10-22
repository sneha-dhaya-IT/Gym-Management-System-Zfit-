import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads/invoices directory exists
const invoicesDir = path.join(__dirname, '../../uploads/invoices');
if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
}

export interface InvoicePDFData {
    number: string;
    generatedAt: string;
    dueDate?: string;
    userName: string;
    userEmail: string;
    userContactNo?: string;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
        tax: number;
    }>;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
    status: string;
}

/**
 * Generate HTML template for invoice PDF
 */
const generateInvoiceHTML = (data: InvoicePDFData): string => {
    const itemsHTML = data.items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${data.currency} ${item.unitPrice.toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${data.currency} ${item.total.toFixed(2)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Invoice ${data.number}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .company-name {
                    font-size: 28px;
                    font-weight: bold;
                    color: #007bff;
                    margin-bottom: 5px;
                }
                .company-tagline {
                    font-size: 14px;
                    color: #666;
                }
                .invoice-details {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }
                .invoice-info, .customer-info {
                    flex: 1;
                }
                .invoice-info h3, .customer-info h3 {
                    margin-top: 0;
                    color: #007bff;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .status-sent { background-color: #28a745; color: white; }
                .status-paid { background-color: #007bff; color: white; }
                .status-overdue { background-color: #dc3545; color: white; }
                .status-draft { background-color: #6c757d; color: white; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th {
                    background-color: #f8f9fa;
                    padding: 12px 8px;
                    text-align: left;
                    border-bottom: 2px solid #dee2e6;
                    font-weight: bold;
                }
                th:first-child { text-align: left; }
                th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
                .totals {
                    float: right;
                    width: 300px;
                }
                .totals table {
                    margin-bottom: 0;
                }
                .totals td {
                    padding: 8px;
                    border: none;
                }
                .totals .total-row {
                    border-top: 2px solid #007bff;
                    font-weight: bold;
                    font-size: 16px;
                }
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">ZFit</div>
                <div class="company-tagline">Your Fitness Journey Starts Here</div>
            </div>

            <div class="invoice-details">
                <div class="invoice-info">
                    <h3>Invoice Details</h3>
                    <p><strong>Invoice Number:</strong> ${data.number}</p>
                    <p><strong>Generated Date:</strong> ${data.generatedAt}</p>
                    ${data.dueDate ? `<p><strong>Due Date:</strong> ${data.dueDate}</p>` : ''}
                    <p><strong>Status:</strong> <span class="status-badge status-${data.status.toLowerCase()}">${data.status}</span></p>
                </div>
                <div class="customer-info">
                    <h3>Bill To</h3>
                    <p><strong>Name:</strong> ${data.userName}</p>
                    <p><strong>Email:</strong> ${data.userEmail}</p>
                    ${data.userContactNo ? `<p><strong>Phone:</strong> ${data.userContactNo}</p>` : ''}
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: center;">Unit Price</th>
                        <th style="text-align: center;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>

            <div class="totals">
                <table>
                    <tr>
                        <td><strong>Subtotal:</strong></td>
                        <td style="text-align: right;">${data.currency} ${data.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Tax:</strong></td>
                        <td style="text-align: right;">${data.currency} ${data.tax.toFixed(2)}</td>
                    </tr>
                    ${data.discount > 0 ? `
                    <tr>
                        <td><strong>Discount:</strong></td>
                        <td style="text-align: right;">- ${data.currency} ${data.discount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td><strong>Total:</strong></td>
                        <td style="text-align: right;">${data.currency} ${data.total.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <div style="clear: both;"></div>

            <div class="footer">
                <p>Thank you for choosing ZFit! We appreciate your business.</p>
                <p>For any questions regarding this invoice, please contact our support team.</p>
            </div>
        </body>
        </html>
    `;
};

/**
 * Generate PDF for invoice and save to file system
 */
export const generateInvoicePDF = async (invoiceData: InvoicePDFData): Promise<string> => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Generate HTML content
        const htmlContent = generateInvoiceHTML(invoiceData);

        // Set content and wait for loading
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generate filename
        const fileName = `invoice-${invoiceData.number.replace(/\//g, '-')}.pdf`;
        const filePath = path.join(invoicesDir, fileName);

        // Generate PDF
        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        await browser.close();

        // Return relative URL path for storage
        const relativePath = `/uploads/invoices/${fileName}`;
        console.log(`Invoice PDF generated: ${relativePath}`);

        return relativePath;
    } catch (error) {
        console.error('Error generating invoice PDF:', error);
        throw new Error(`Failed to generate invoice PDF: ${(error as Error).message}`);
    }
};

/**
 * Delete invoice PDF file
 */
export const deleteInvoicePDF = async (pdfUrl: string): Promise<void> => {
    try {
        // Extract filename from URL
        const fileName = path.basename(pdfUrl);
        const filePath = path.join(invoicesDir, fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Invoice PDF deleted: ${fileName}`);
        }
    } catch (error) {
        console.error('Error deleting invoice PDF:', error);
        // Don't throw error for cleanup failures
    }
};