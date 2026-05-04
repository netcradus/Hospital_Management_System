import mongoose from "mongoose";

let isConnected = false;

export default async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MongoDB connection string. Set MONGODB_URI in server/.env.");
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (error) {
    throw error;
  }
}
