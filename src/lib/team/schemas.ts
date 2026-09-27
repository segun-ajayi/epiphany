import { z } from "zod";
import { ADMIN_ROLES } from "../auth/permissions.ts";

export const teamMemberCreateSchema = z
  .object({
    action: z.literal("create"),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    role: z.enum(ADMIN_ROLES),
  })
  .strict();

export const teamMemberUpdateSchema = z
  .object({
    action: z.literal("update"),
    id: z.string().min(1).max(160),
    role: z.enum(ADMIN_ROLES),
    active: z.boolean(),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const teamMutationSchema = z.discriminatedUnion("action", [
  teamMemberCreateSchema,
  teamMemberUpdateSchema,
]);

export type TeamMember = {
  id: string;
  email: string;
  role: (typeof ADMIN_ROLES)[number];
  active: boolean;
  linked: boolean;
  createdAt: string;
  updatedAt: string;
};
