import mongoose from "mongoose";

let isConnected = false;

export default async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  const srvUri = process.env.MONGODB_URI;
  const directUri = process.env.MONGODB_DIRECT_URI;
  const uri = directUri || srvUri;

  if (!uri) {
    throw new Error("Missing MongoDB connection string. Set MONGODB_URI or MONGODB_DIRECT_URI in server/.env.");
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (error) {
    if (error.code === "EBADRESP" && srvUri?.startsWith("mongodb+srv://")) {
      if (directUri) {
        console.warn("MongoDB SRV lookup failed. Retrying with MONGODB_DIRECT_URI...");
        await mongoose.connect(directUri);
        isConnected = true;
        console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
        return mongoose.connection;
      }

      console.error("MongoDB SRV lookup failed. Add MONGODB_DIRECT_URI to server/.env using the Atlas replica-set mongodb:// string.");
    }

    throw error;
  }
}
