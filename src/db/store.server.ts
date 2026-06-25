// Persistence layer. On Lovable's runtime there is no D1 binding, so this
// falls back to a process-local in-memory store (data is lost on Worker
// restart). When deployed to your own Cloudflare account with a `DB` binding,
// swap this for a real Drizzle client — the public API below stays the same.

import type { ContactMessage, MessageStatus, NewsletterSubscriber } from "./schema";

type State = {
  messages: ContactMessage[];
  subscribers: NewsletterSubscriber[];
  messageId: number;
  subscriberId: number;
};

const globalKey = "__epiphany_store__" as const;
const g = globalThis as unknown as { [globalKey]?: State };

function state(): State {
  if (!g[globalKey]) {
    g[globalKey] = { messages: [], subscribers: [], messageId: 1, subscriberId: 1 };
  }
  return g[globalKey]!;
}

export const store = {
  // ---------- contact_messages ----------
  insertMessage(input: Omit<ContactMessage, "id" | "status" | "createdAt"> & { status?: MessageStatus }) {
    const s = state();
    const row: ContactMessage = {
      id: s.messageId++,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      subject: input.subject ?? null,
      message: input.message,
      status: input.status ?? "unread",
      createdAt: new Date(),
    };
    s.messages.unshift(row);
    return row;
  },
  listMessages(): ContactMessage[] {
    return [...state().messages].sort((a, b) => +b.createdAt - +a.createdAt);
  },
  updateMessageStatus(id: number, status: MessageStatus) {
    const m = state().messages.find((m) => m.id === id);
    if (m) m.status = status;
    return m ?? null;
  },

  // ---------- newsletter_subscribers ----------
  findSubscriber(email: string) {
    return state().subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase()) ?? null;
  },
  insertSubscriber(email: string): { row: NewsletterSubscriber; created: boolean } {
    const existing = this.findSubscriber(email);
    if (existing) {
      if (!existing.active) existing.active = true;
      return { row: existing, created: false };
    }
    const s = state();
    const row: NewsletterSubscriber = {
      id: s.subscriberId++,
      email: email.toLowerCase(),
      active: true,
      createdAt: new Date(),
    };
    s.subscribers.unshift(row);
    return { row, created: true };
  },
  listSubscribers(): NewsletterSubscriber[] {
    return [...state().subscribers]
      .filter((s) => s.active)
      .sort((a, b) => +b.createdAt - +a.createdAt);
  },
};
