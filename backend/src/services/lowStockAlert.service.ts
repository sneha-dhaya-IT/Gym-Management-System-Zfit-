import InventoryItem from '../models/inventoryItem.schema.js';
import { sendMail } from '../util/sendMail.util.js';
import { getLowStockAlertTemplate } from '../util/lowStockTemplate.js';
import { getAllManagers } from './user.service.js';
import type { LowStockItem, LowStockAlertData } from '../util/lowStockTemplate.js';

export const checkLowStockItems = async () => {
    try {
        // Find all sellable items that are active and have stock levels at or below their alert threshold
        const lowStockItems = await InventoryItem.find({
            type: 'sellable',
            isActive: true,
            $expr: {
                $lte: ['$stock', '$lowStockAlert']
            }
        }).populate('categoryID', 'name');

        if (lowStockItems.length === 0) {
            console.log('No low stock items found');
            return { success: true, message: 'No low stock items found', itemCount: 0 };
        }

        // Transform items to match email template format
        const alertItems: LowStockItem[] = lowStockItems.map(item => {
            const currentStock = item.stock || 0;
            const minimumStock = item.lowStockAlert || 0;
            const shortfall = Math.max(0, minimumStock - currentStock);

            return {
                id: (item._id as any).toString(),
                name: item.name,
                category: (item.categoryID as any)?.name || 'Unknown Category',
                currentStock,
                minimumStock,
                shortfall
            };
        });

        // Count critical items (out of stock)
        const criticalItems = alertItems.filter(item => item.currentStock === 0).length;

        // Prepare email data
        const dashboardUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard/inventory/items` : 'http://localhost:3000/dashboard/inventory/items';
        const alertData: LowStockAlertData = {
            managerName: '', // Will be filled per manager
            totalItems: alertItems.length,
            criticalItems,
            items: alertItems,
            alertDate: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
            ...(dashboardUrl && { dashboardUrl })
        };

        // Get all managers using the existing service
        const managers = await getAllManagers();
        
        if (managers.length === 0) {
            console.log('No managers found to send low stock alerts');
            return { success: false, message: 'No managers found', itemCount: alertItems.length };
        }

        // Send alerts to all managers
        const emailPromises = managers.map(async (manager: any) => {
            const managerData = {
                ...alertData,
                managerName: manager.name || 'Manager'
            };
            
            const template = getLowStockAlertTemplate(managerData);
            return sendMail({
                to: manager.email,
                subject: template.subject,
                text: template.text,
                html: template.html
            });
        });

        const results = await Promise.allSettled(emailPromises);
        
        const successful = results.filter((result: any) => result.status === 'fulfilled').length;
        const failed = results.filter((result: any) => result.status === 'rejected').length;

        console.log(`Low stock check completed: ${alertItems.length} items found, sent to ${managers.length} managers (${successful} successful, ${failed} failed)`);

        return {
            success: true,
            itemCount: alertItems.length,
            criticalCount: criticalItems,
            managersNotified: managers.length,
            emailsSent: successful,
            emailsFailed: failed,
            items: alertItems,
            results
        };

    } catch (error) {
        console.error('Error checking low stock items:', error);
        throw new Error(`Failed to check low stock items: ${(error as Error).message}`);
    }
};

export const getLowStockItemsReport = async () => {
    try {
        // Find all sellable items that are active and have stock levels at or below their alert threshold
        const lowStockItems = await InventoryItem.find({
            type: 'sellable',
            isActive: true,
            $expr: {
                $lte: ['$stock', '$lowStockAlert']
            }
        }).populate('categoryID', 'name').populate('supplierID', 'name');

        // Transform items for report
        const reportItems = lowStockItems.map(item => ({
            id: item._id,
            name: item.name,
            category: (item.categoryID as any)?.name || 'Unknown Category',
            supplier: (item.supplierID as any)?.name || 'Unknown Supplier',
            currentStock: item.stock || 0,
            minimumStock: item.lowStockAlert || 0,
            shortfall: Math.max(0, (item.lowStockAlert || 0) - (item.stock || 0)),
            status: (item.stock || 0) === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            price: item.price,
            expiryDate: item.expiryDate
        }));

        const criticalItems = reportItems.filter(item => item.status === 'OUT_OF_STOCK').length;

        return {
            success: true,
            totalItems: reportItems.length,
            criticalItems,
            lowStockItems: reportItems.filter(item => item.status === 'LOW_STOCK').length,
            items: reportItems,
            generatedAt: new Date()
        };

    } catch (error) {
        console.error('Error generating low stock report:', error);
        throw new Error(`Failed to generate low stock report: ${(error as Error).message}`);
    }
};

// Function to manually trigger low stock alert (useful for testing or manual triggers)
export const triggerLowStockAlert = async () => {
    try {
        console.log('Manually triggering low stock alert check...');
        return await checkLowStockItems();
    } catch (error) {
        console.error('Error triggering low stock alert:', error);
        throw error;
    }
};

// Function to check and send alerts for a specific item when its stock changes
export const checkItemLowStock = async (itemId: string) => {
    try {
        // Find the specific item and check if it's below threshold
        const item = await InventoryItem.findById(itemId)
            .populate('categoryID', 'name');

        if (!item || item.type !== 'sellable' || !item.isActive) {
            return { success: false, message: 'Item not found or not applicable for low stock alerts' };
        }

        const currentStock = item.stock || 0;
        const minimumStock = item.lowStockAlert || 0;

        // If item is not below threshold, no alert needed
        if (currentStock > minimumStock) {
            return { success: true, message: 'Item stock is above threshold', needsAlert: false };
        }

        // Item is below threshold, prepare alert data
        const shortfall = Math.max(0, minimumStock - currentStock);
        const alertItem: LowStockItem = {
            id: (item._id as any).toString(),
            name: item.name,
            category: (item.categoryID as any)?.name || 'Unknown Category',
            currentStock,
            minimumStock,
            shortfall
        };

        // Get all managers
        const managers = await getAllManagers();
        
        if (managers.length === 0) {
            console.log('No managers found to send low stock alert for item:', item.name);
            return { success: false, message: 'No managers found', needsAlert: true };
        }

        // Prepare email data for single item
        const dashboardUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard/inventory/items` : 'http://localhost:3000/dashboard/inventory/items';
        const alertData: LowStockAlertData = {
            managerName: '', // Will be filled per manager
            totalItems: 1,
            criticalItems: currentStock === 0 ? 1 : 0,
            items: [alertItem],
            alertDate: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
            ...(dashboardUrl && { dashboardUrl })
        };

        // Send alerts to all managers
        const emailPromises = managers.map(async (manager: any) => {
            const managerData = {
                ...alertData,
                managerName: manager.name || 'Manager'
            };
            
            const template = getLowStockAlertTemplate(managerData);
            return sendMail({
                to: manager.email,
                subject: template.subject,
                text: template.text,
                html: template.html
            });
        });

        const results = await Promise.allSettled(emailPromises);
        
        const successful = results.filter((result: any) => result.status === 'fulfilled').length;
        const failed = results.filter((result: any) => result.status === 'rejected').length;

        console.log(`Low stock alert sent for item "${item.name}" to ${managers.length} managers (${successful} successful, ${failed} failed)`);

        return {
            success: true,
            needsAlert: true,
            item: alertItem,
            managersNotified: managers.length,
            emailsSent: successful,
            emailsFailed: failed,
            results
        };

    } catch (error) {
        console.error('Error checking item low stock:', error);
        throw new Error(`Failed to check item low stock: ${(error as Error).message}`);
    }
};