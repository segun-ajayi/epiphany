export async function submitAuth(action: "google" | "logout", body: Record<string, string>) {
  const response = await fetch(`/api/admin/auth/${action}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
    body: JSON.stringify(body),
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error("The sign-in service is unavailable. Please try again.");
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Please try again.");
  return result as { ok?: boolean; url: string };
}
