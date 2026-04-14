import mongoose from "mongoose";

let isConnected = false;

export default async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (error) {
    if (error.code === "EBADRESP" && uri?.startsWith("mongodb+srv://")) {
      console.error("MongoDB SRV lookup failed. Try using a direct mongodb:// replica-set URI instead of mongodb+srv://.");
    }

    throw error;
  }
}
