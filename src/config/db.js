import { MongoClient, ServerApiVersion } from 'mongodb'
import 'dotenv/config'

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@shopsphere.aveemsz.mongodb.net/?retryWrites=true&w=majority&appName=ShopSphere`;

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
      sellers: db.collection("sellers"),
      riders: db.collection("riders"),
    };
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}