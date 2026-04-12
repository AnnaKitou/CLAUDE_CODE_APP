import { betterAuth } from "better-auth";
import { getDb } from "@/lib/db";

export const auth = betterAuth({
  database: getDb(),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
});
