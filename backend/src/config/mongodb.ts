import mongoose from 'mongoose';
import env from './env.js';

if(!env.MongoDB_URI) {
    throw new Error('Please define the MongoDB_URI environment variable inside .env.<development/production>.local');
}

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(env.MongoDB_URI);
        console.log(`Successfully connected to MongoDB` );
    } catch (error) {
        console.error('Error connecting to the database: ', error);

        process.exit(1);
    }
}

export default connectToMongoDB;