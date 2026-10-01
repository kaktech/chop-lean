import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Works with any Postgres connection string Neon gives you.
export const db = drizzle(neon(url), { schema });
export type DB = typeof db;
