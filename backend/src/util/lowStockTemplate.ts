export interface LowStockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  shortfall: number;
}

export interface LowStockAlertData {
  managerName: string;
  totalItems: number;
  criticalItems: number;
  items: LowStockItem[];
  alertDate: string;
  dashboardUrl?: string;
}

export const getLowStockAlertTemplate = (data: LowStockAlertData) => ({
  subject: `🚨 ZFit Gym - Low Stock Alert (${data.totalItems} Items Need Attention)`,
  text: `Hi ${data.managerName || 'Manager'}, this is an automated alert from ZFit Gym inventory system. We have ${data.totalItems} items running low on stock${data.criticalItems > 0 ? ` (${data.criticalItems} critical)` : ''}. Items needing attention: ${data.items.map(item => `${item.name} - Current: ${item.currentStock}, Minimum: ${item.minimumStock}`).join(', ')}. Please log into your dashboard to review and restock these items immediately.`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Low Stock Alert - ZFit Gym</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
          color: #ffffff;
        }
        .container {
          max-width: 650px;
          margin: 0 auto;
          background: linear-gradient(145deg, #2a2a2a 0%, #1e1e1e 100%);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .email-body {
          padding: 30px;
        }
        .header-section {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #404040;
          position: relative;
        }
        .header-section::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #ff6b6b 0%, #ff8e8e 100%);
        }
        .logo-area {
          font-size: 28px;
          font-weight: 800;
          color: #AAFF69;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(170, 255, 105, 0.3);
          letter-spacing: 2px;
        }
        .alert-icon {
          font-size: 48px;
          margin: 15px 0;
          color: #ff6b6b;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        .main-title {
          font-size: 26px;
          font-weight: 700;
          margin: 12px 0;
          color: #ff6b6b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .greeting {
          font-size: 18px;
          color: #cccccc;
          margin: 20px 0 12px 0;
          font-weight: 400;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          color: #e0e0e0;
          margin: 12px 0;
        }
        .alert-summary {
          background: linear-gradient(135deg, #ff6b6b15, #ff8e8e15);
          border: 2px solid #ff6b6b55;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
        }
        .summary-item {
          display: inline-block;
          margin: 0 15px;
          text-align: center;
        }
        .summary-number {
          font-size: 32px;
          font-weight: 800;
          color: #ff6b6b;
          display: block;
        }
        .summary-label {
          font-size: 12px;
          color: #cccccc;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: #333333;
          border-radius: 8px;
          overflow: hidden;
        }
        .items-table th {
          background: #404040;
          color: #ffffff;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
        }
        .items-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #444444;
          font-size: 14px;
        }
        .items-table tr:last-child td {
          border-bottom: none;
        }
        .stock-critical {
          color: #ff6b6b;
          font-weight: 600;
        }
        .stock-low {
          color: #ffa726;
          font-weight: 600;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #AAFF69, #7BC96F);
          color: #000000;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 20px 0;
          box-shadow: 0 4px 15px rgba(170, 255, 105, 0.4);
          transition: transform 0.2s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(170, 255, 105, 0.6);
        }
        .footer {
          background: #1a1a1a;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #404040;
          font-size: 12px;
          color: #888888;
        }
        .footer a {
          color: #AAFF69;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-body">
          <div class="header-section">
            <div class="logo-area">ZFIT GYM</div>
            <div class="alert-icon">⚠️</div>
            <h1 class="main-title">Low Stock Alert</h1>
          </div>

          <div class="greeting">Dear ${data.managerName || 'Manager'},</div>
          
          <div class="message">
            This is an automated alert from the ZFit Gym Inventory Management System. We have detected ${data.totalItems} item${data.totalItems > 1 ? 's' : ''} that ${data.totalItems > 1 ? 'are' : 'is'} currently at or below the minimum stock threshold and require${data.totalItems > 1 ? '' : 's'} immediate attention to prevent service disruptions.
          </div>

          <div class="alert-summary">
            <div class="summary-item">
              <span class="summary-number">${data.totalItems}</span>
              <span class="summary-label">Items Low</span>
            </div>
            <div class="summary-item">
              <span class="summary-number">${data.criticalItems}</span>
              <span class="summary-label">Critical</span>
            </div>
            <div class="summary-item">
              <span class="summary-number">${data.alertDate}</span>
              <span class="summary-label">Alert Date</span>
            </div>
          </div>

          <div class="message">
            <strong>Items requiring immediate attention:</strong>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current</th>
                <th>Minimum</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td style="padding: 12px 8px; border-bottom: 1px solid #444444; font-size: 14px;"><strong style="color: #ffffff;">${item.name}</strong></td>
                  <td style="padding: 12px 8px; border-bottom: 1px solid #444444; font-size: 14px; color: #e0e0e0;">${item.category}</td>
                  <td style="padding: 12px 8px; border-bottom: 1px solid #444444; font-size: 14px; text-align: center;">
                    <span style="color: ${item.currentStock === 0 ? '#ff6b6b' : '#ffa726'}; font-weight: 600;">${item.currentStock}</span>
                  </td>
                  <td style="padding: 12px 8px; border-bottom: 1px solid #444444; font-size: 14px; text-align: center; color: #e0e0e0;">${item.minimumStock}</td>
                  <td style="padding: 12px 8px; border-bottom: 1px solid #444444; font-size: 14px; text-align: center;">
                    <span style="color: ${item.currentStock === 0 ? '#ff6b6b' : '#ffa726'}; font-weight: 600; background: ${item.currentStock === 0 ? '#ff6b6b22' : '#ffa72622'}; padding: 4px 8px; border-radius: 4px;">
                      ${item.currentStock === 0 ? '🚨 OUT OF STOCK' : `⚠️ Need ${item.shortfall} more`}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardUrl || 'http://localhost:3000/dashboard/inventory/items'}" 
               class="cta-button" 
               target="_blank" 
               style="display: inline-block; background: linear-gradient(135deg, #AAFF69, #7BC96F); color: #000000; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0; box-shadow: 0 4px 15px rgba(170, 255, 105, 0.4);">
              🔗 View Inventory Items
            </a>
          </div>

          <div class="message">
            <strong>Recommended Actions:</strong>
          </div>
          <ul style="color: #e0e0e0; line-height: 1.8;">
            <li>Review and place orders for out-of-stock items immediately</li>
            <li>Contact suppliers for expedited delivery if possible</li>
            <li>Update minimum stock levels if needed</li>
            <li>Consider alternative suppliers for critical items</li>
          </ul>

          <div class="message" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #404040;">
            This is an automated alert. Please take action as soon as possible to avoid service disruptions.
          </div>
        </div>

        <div class="footer">
          <div style="margin-bottom: 15px;">
            <strong style="color: #AAFF69; font-size: 16px;">ZFit Gym Management System</strong>
          </div>
          <div style="margin: 10px 0;">
            <span style="color: #888888;">Inventory Management • Stock Monitoring • Alert System</span>
          </div>
          <div style="margin: 15px 0; padding: 10px; background: #252525; border-radius: 6px;">
            <div style="margin-bottom: 5px; color: #cccccc; font-weight: 500;">Need Help?</div>
            <div style="font-size: 12px; color: #888888;">
              Contact your IT administrator or visit the dashboard for more options
            </div>
          </div>
          <div style="margin-top: 15px; font-size: 11px; color: #666; border-top: 1px solid #404040; padding-top: 10px;">
            This is an automated alert generated on ${data.alertDate} based on your inventory settings.<br>
            Please do not reply to this email - it is sent from an unmonitored address.
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
});