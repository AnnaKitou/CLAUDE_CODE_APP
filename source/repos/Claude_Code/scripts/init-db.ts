import { getDb } from "../lib/db";

const db = getDb();
console.log("Database initialized:", process.env.DB_PATH ?? "data/app.db");
console.log("Notes table and indexes ready.");
db.close();
