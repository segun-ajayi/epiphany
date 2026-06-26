import { and, desc, eq } from "drizzle-orm";

import { getDb } from "./db.server";
import {
  contactMessages,
  newsletterSubscribers,
  type ContactMessage,
  type MessageStatus,
  type NewsletterSubscriber,
} from "./schema";

export const store = {
  async insertMessage(
    input: Omit<ContactMessage, "id" | "createdAt"> & {
      status?: MessageStatus;
    },
  ) {
    const db = getDb();

    const result = await db
      .insert(contactMessages)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone ?? null,
        subject: input.subject ?? null,
        message: input.message,
        status: input.status ?? "unread",
      })
      .returning();

    return result[0];
  },

  async listMessages() {
    const db = getDb();

    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  },

  async updateMessageStatus(id: number, status: MessageStatus) {
    const db = getDb();

    await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));

    const updated = await db.select().from(contactMessages).where(eq(contactMessages.id, id));

    return updated[0] ?? null;
  },

  async findSubscriber(email: string) {
    const db = getDb();

    const rows = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email.toLowerCase()))
      .limit(1);

    return rows[0] ?? null;
  },

  async insertSubscriber(email: string) {
    const db = getDb();

    const existing = await this.findSubscriber(email);

    if (existing) {
      if (!existing.active) {
        await db
          .update(newsletterSubscribers)
          .set({ active: true })
          .where(eq(newsletterSubscribers.id, existing.id));
      }

      return {
        row: existing,
        created: false,
      };
    }

    const inserted = await db
      .insert(newsletterSubscribers)
      .values({
        email: email.toLowerCase(),
        active: true,
      })
      .returning();

    return {
      row: inserted[0],
      created: true,
    };
  },

  async listSubscribers() {
    const db = getDb();

    return await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.active, true))
      .orderBy(desc(newsletterSubscribers.createdAt));
  },
};
