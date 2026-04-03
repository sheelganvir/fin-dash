import mongoose from 'mongoose';
import { env } from '../config/env';

export async function connectDB(): Promise<void> {
  try {
    const uri = env.NODE_ENV === 'test'
      ? (process.env.MONGODB_URI_TEST ?? env.MONGODB_URI)
      : env.MONGODB_URI;

    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
}
