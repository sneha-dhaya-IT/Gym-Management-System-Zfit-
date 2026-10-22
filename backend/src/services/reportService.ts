import InventoryItem from "../models/inventoryItem.schema.js";
import { InventoryTransaction } from "../models/inventoryTransaction.schema.js";

export default class ReportService {

  async getStockLevels() {
    const items = await InventoryItem.find()
      .populate("categoryID", "categoryName")
      .populate("supplierID", "supplierName");

    return items.map(item => ({
      name: item.name,
      category: item.categoryID,
      supplier: item.supplierID,
      quantity: item.stock || 0,
      lowStock: (item.stock || 0) < (item.lowStockAlert || 10)
    }));
  }

  async getUsageTrends(): Promise<any[]> {
    return await InventoryTransaction.find()
      .populate("itemID", "itemName")
      .sort({ date: -1 });
  }
}