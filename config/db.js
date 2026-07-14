import mongoose from "mongoose";
import { seedDatabase } from "./seed.js";

const connectDB = async () => {
  // Try primary SRV connection first
  if (process.env.MONGO_URI) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected (SRV): ${conn.connection.host}`);
      await seedDatabase();
      return;
    } catch (srvError) {
      console.warn(`SRV connection failed: ${srvError.message}`);
      console.warn("Trying direct connection fallback...");
    }
  }

  // Fall back to direct connection string (no DNS SRV needed)
  if (process.env.MONGO_URI_DIRECT) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI_DIRECT);
      console.log(`MongoDB Connected (Direct): ${conn.connection.host}`);
      await seedDatabase();
      return;
    } catch (directError) {
      console.error(`Direct connection also failed: ${directError.message}`);
      process.exit(1);
    }
  }

  console.error("No MongoDB URI found. Set MONGO_URI or MONGO_URI_DIRECT in .env");
  process.exit(1);
};

export default connectDB;
