import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.routes.js";  
import membershipPlanRouter from "./routes/membershipPlan.routes.js";  
import membershipRouter from "./routes/membership.routes.js";  
import inventoryRoutes from "./routes/inventory.routes.js";  
import categoryRoutes from "./routes/inventoryCategory.routes.js";
import itemRoutes from "./routes/item.routes.js";
import supplierRoutes from "./routes/inventorySuppliers.routes.js";
import paymentRoutes from "./routes/payment.routes.js";  
import BookingRoutes from "./routes/Booking.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import reportRouter from "./routes/report.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import gatewayRoutes from "./routes/gateway.routes.js";
import attendanceRouter from "./routes/attendance.routes.js";
import refundRequestRouter from "./routes/refundRequest.routes.js";
import bankTransferRouter, { adminRouter as bankTransferAdminRouter } from "./routes/bankTransfer.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import inventoryTransactionRoutes from "./routes/inventoryTransaction.routes.js";
import lowStockAlertRoutes from "./routes/lowStockAlert.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import supportRouter from "./routes/support.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.middleware.js";


//creating a express app instance
const app: express.Application = express();

//global middleware
app.use(cookieParser());
app.use(helmet());
app.use(cors({
  // for open bank transfer slip in another tab to checking the image
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));
app.use('/', rateLimitMiddleware);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

//routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);  
app.use("/api/v1/membership-plans", membershipPlanRouter);  
app.use("/api/v1/memberships", membershipRouter);  
app.use('/api/v1', categoryRoutes);  // Categories at /api/v1/categories
app.use('/api/v1', itemRoutes);  // Items at /api/v1/items
app.use('/api/v1/suppliers', supplierRoutes);  // Suppliers at /api/v1/suppliers
app.use('/api/v1/inventory', inventoryRoutes);  
app.use('/api/v1/payments', paymentRoutes);  
app.use('/api/v1/bookings', BookingRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/gateways', gatewayRoutes);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/refund-requests', refundRequestRouter);
app.use('/api/v1/payments/bank-transfer', bankTransferRouter);
app.use('/api/v1/admin/payments/bank-transfer', bankTransferAdminRouter);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/transactions', inventoryTransactionRoutes);
app.use('/api/v1/inventory/low-stock', lowStockAlertRoutes);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/support', supportRouter);

app.use(errorMiddleware);

export default app;