import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { BAD_REQUEST } from "../constants/http.js";

//customer error interface 
interface CustomError extends Error {
    statusCode?: number;
    code?: number;
    errors?: Record<string, { message: string }>;
    name: string;
}

//error handling middleware function
const errorMiddleware = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
    try {

        //handleing zod errors
        if(err instanceof ZodError){
            const errors = err.issues.map((error) => ({
                path: error.path,
                message: error.message,
            }))

            return res.status(BAD_REQUEST).json({
                success: false,
                error: "Validation error",
                details: errors
            });
        }

        let error = { ...err };

        error.message = err.message;
        
        console.error(err);

        //Zod validation error
        if(err instanceof ZodError) {
            const message = 'Validation failed';
            const validationErrors = err.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message
            }));
            return res.status(400).json({
                success: false,
                message,
                errors: validationErrors
            });
        }

        //Mongoose bad ObjectId
        if(err.name === 'CastError'){
            const message = 'Resource not found';
            error = new Error(message);
            error.statusCode = 404;
        }

        //Mongoose duplicate key
        if(err.code === 11000) {
            const message = 'Duplicate field value entered';
            error = new Error(message);
            error.statusCode = 400;
        }

        //Mongoose validation error
        if(err.name === 'ValidationError'){
            const message = err.errors ? Object.values(err.errors).map(val => val.message) : ['Validation error'];
            error = new Error(message.join(', '));
            error.statusCode = 400;
        }

        res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Server Error'});

    } catch (error) {
        next(error);
    }
}


export default errorMiddleware;