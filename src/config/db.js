import { MongoClient, ServerApiVersion } from 'mongodb'
import 'dotenv/config'

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export default async function connectDB() {
  try {
    await client.connect();

    const db = client.db("ShopSphere");
    console.log("Connected to MongoDB!");
    return {
      users: db.collection("users"),
    };
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}