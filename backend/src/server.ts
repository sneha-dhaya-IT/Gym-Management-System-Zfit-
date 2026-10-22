import app from "./app.js";
import env from "./config/env.js";
import connectToMongoDB from "./config/mongodb.js";
import { invoiceScheduler } from "./util/invoiceScheduler.util.js";

const startServer = async () => {
    app.listen(env.PORT, async () => {
        console.log("Server is running http://localhost:5000");

        await connectToMongoDB();
        
        // Start the invoice scheduler for automated tasks
        invoiceScheduler.start();
    })
};

startServer();