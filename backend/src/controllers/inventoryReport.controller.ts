import type { Request, Response, NextFunction } from "express";
import ReportService from "../services/reportService.js";

// Create an instance of the service
const reportService = new ReportService();

// Get stock levels report
export const getStockLevelsReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const report = await reportService.getStockLevels();
        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

// Get usage trends report
export const getUsageTrendsReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const report = await reportService.getUsageTrends();
        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};