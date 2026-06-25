// Drizzle schema for Cloudflare D1.
// NOTE: D1 is NOT bound on the Lovable hosted runtime — `context.cloudflare.env.DB`
// won't exist when this app runs on Lovable. The schema below is authored for
// self-hosting on Cloudflare Workers + D1. At runtime the app uses an in-memory
// store (`src/db/store.server.ts`) that mirrors the same shape, so the admin
// dashboard works in this preview while still being drop-in ready for D1.
//
// To run on Cloudflare with D1: add a D1 binding named `DB`, then swap
// `getStore()` in `store.server.ts` for a `drizzle(env.DB)` instance.

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const contactMessages = sqliteTable("contact_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status", { enum: ["unread", "read", "archived"] }).notNull().default("unread"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;
export type MessageStatus = "unread" | "read" | "archived";
