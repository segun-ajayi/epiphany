export const ADMIN_ROLES = ["editor", "publisher", "administrator"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AdminUser = { id: string; email: string; role: AdminRole };

export class AdminError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AdminError";
    this.status = status;
    this.code = code;
  }
}

export function canPublish(role: AdminRole) {
  return role === "publisher" || role === "administrator";
}

export function assertContentPermission(
  user: AdminUser,
  nextStatus: string,
  existingStatus?: string,
) {
  if (
    !canPublish(user.role) &&
    (nextStatus !== "draft" || (existingStatus !== undefined && existingStatus !== "draft"))
  ) {
    throw new AdminError(403, "forbidden", "Editors may create and edit drafts only.");
  }
}
