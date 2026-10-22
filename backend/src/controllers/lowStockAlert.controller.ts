import type { Request, Response } from 'express';
import { checkLowStockItems, getLowStockItemsReport, triggerLowStockAlert } from '../services/lowStockAlert.service.js';
import { OK, INTERNAL_SERVER_ERROR } from '../constants/http.js';

// Get low stock items report
export const getLowStockReport = async (req: Request, res: Response) => {
    try {
        const report = await getLowStockItemsReport();
        
        res.status(OK).json({
            success: true,
            message: 'Low stock report generated successfully',
            data: report
        });
    } catch (error) {
        console.error('Error getting low stock report:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to generate low stock report',
            error: (error as Error).message
        });
    }
};

// Manually trigger low stock alert emails
export const sendLowStockAlerts = async (req: Request, res: Response) => {
    try {
        const result = await triggerLowStockAlert();
        
        if (result.itemCount === 0) {
            return res.status(OK).json({
                success: true,
                message: 'No low stock items found - no alerts sent',
                data: result
            });
        }

        res.status(OK).json({
            success: true,
            message: `Low stock alerts sent successfully for ${result.itemCount} items to ${result.managersNotified} managers`,
            data: result
        });
    } catch (error) {
        console.error('Error sending low stock alerts:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to send low stock alerts',
            error: (error as Error).message
        });
    }
};

// Check for low stock items without sending emails
export const checkLowStock = async (req: Request, res: Response) => {
    try {
        const report = await getLowStockItemsReport();
        
        res.status(OK).json({
            success: true,
            message: 'Low stock check completed',
            data: {
                hasLowStockItems: report.totalItems > 0,
                totalItems: report.totalItems,
                criticalItems: report.criticalItems,
                lowStockItems: report.lowStockItems,
                items: report.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    currentStock: item.currentStock,
                    minimumStock: item.minimumStock,
                    status: item.status
                }))
            }
        });
    } catch (error) {
        console.error('Error checking low stock:', error);
        res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to check low stock items',
            error: (error as Error).message
        });
    }
};