import { getAuthSetting } from "../db/runtime.server.ts";
import type { DeliveryProvider, NewsletterSubscriber } from "./schemas.ts";

export type ProviderName = Exclude<DeliveryProvider, "disabled">;
export type ProviderCredentials = {
  kit: { apiKey: string; tagId: string };
  sender: { apiToken: string; groupId: string };
};

export type NewsletterProviderConfig = {
  credentials: ProviderCredentials;
  availability: Record<ProviderName, { configured: boolean }>;
  identity?: { email: string; name: string };
};

export class ProviderSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderSyncError";
  }
}

export function getNewsletterProviderConfig(request: Request): NewsletterProviderConfig {
  const credentials = {
    kit: {
      apiKey: getAuthSetting(request, "KIT_API_KEY")?.trim() ?? "",
      tagId: getAuthSetting(request, "KIT_TAG_ID")?.trim() ?? "",
    },
    sender: {
      apiToken: getAuthSetting(request, "SENDER_API_TOKEN")?.trim() ?? "",
      groupId: getAuthSetting(request, "SENDER_GROUP_ID")?.trim() ?? "",
    },
  };
  return {
    credentials,
    identity: {
      email: getAuthSetting(request, "NEWSLETTER_FROM_EMAIL")?.trim() || "info@acehou.org",
      name:
        getAuthSetting(request, "NEWSLETTER_FROM_NAME")?.trim() ||
        "Anglican Church of the Epiphany, Houston",
    },
    availability: {
      kit: { configured: Boolean(credentials.kit.apiKey && credentials.kit.tagId) },
      sender: { configured: Boolean(credentials.sender.apiToken && credentials.sender.groupId) },
    },
  };
}

async function providerRequest(
  provider: ProviderName,
  url: string,
  init: RequestInit,
  fetcher: typeof fetch,
) {
  let response: Response;
  try {
    response = await fetcher(url, { ...init, signal: AbortSignal.timeout(8_000) });
  } catch {
    throw new ProviderSyncError(`${provider === "kit" ? "Kit" : "Sender"} did not respond.`);
  }
  return response;
}

async function responseData(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function failure(provider: ProviderName, response: Response): never {
  const name = provider === "kit" ? "Kit" : "Sender";
  if (response.status === 401 || response.status === 403)
    throw new ProviderSyncError(`${name} rejected its credential.`);
  if (response.status === 429)
    throw new ProviderSyncError(`${name} is rate limiting synchronization. Try again later.`);
  throw new ProviderSyncError(`${name} could not synchronize this subscriber.`);
}

export async function syncSubscriberWithProvider(
  provider: ProviderName,
  credentials: ProviderCredentials,
  subscriber: NewsletterSubscriber,
  externalId: string | null,
  fetcher: typeof fetch = fetch,
) {
  if (provider === "kit") {
    const headers = {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": credentials.kit.apiKey,
    };
    if (subscriber.status === "unsubscribed") {
      let resolvedExternalId = externalId;
      if (!resolvedExternalId) {
        const lookupUrl = new URL("https://api.kit.com/v4/subscribers");
        lookupUrl.searchParams.set("email_address", subscriber.email);
        const lookup = await providerRequest(
          "kit",
          lookupUrl.toString(),
          { method: "GET", headers },
          fetcher,
        );
        if (!lookup.ok) failure("kit", lookup);
        const lookupData = await responseData(lookup);
        const matches = Array.isArray(lookupData.subscribers)
          ? (lookupData.subscribers as Array<Record<string, unknown>>)
          : [];
        const remote = matches.find(
          (candidate) =>
            typeof candidate.email_address === "string" &&
            candidate.email_address.toLowerCase() === subscriber.email.toLowerCase(),
        );
        if (typeof remote?.id === "number" || typeof remote?.id === "string")
          resolvedExternalId = String(remote.id);
      }
      if (!resolvedExternalId) return { externalId: null, remoteStatus: "not_present" };
      const untagged = await providerRequest(
        "kit",
        `https://api.kit.com/v4/tags/${encodeURIComponent(credentials.kit.tagId)}/subscribers/${encodeURIComponent(resolvedExternalId)}`,
        { method: "DELETE", headers },
        fetcher,
      );
      if (!untagged.ok && untagged.status !== 404) failure("kit", untagged);
      const response = await providerRequest(
        "kit",
        `https://api.kit.com/v4/subscribers/${encodeURIComponent(resolvedExternalId)}/unsubscribe`,
        { method: "POST", headers },
        fetcher,
      );
      if (!response.ok) failure("kit", response);
      return { externalId: resolvedExternalId, remoteStatus: "cancelled" };
    }
    const response = await providerRequest(
      "kit",
      "https://api.kit.com/v4/subscribers",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          email_address: subscriber.email,
          first_name: subscriber.name || undefined,
          state: "active",
        }),
      },
      fetcher,
    );
    if (!response.ok) failure("kit", response);
    const data = await responseData(response);
    const remote = (data.subscriber ?? data) as Record<string, unknown>;
    const id =
      typeof remote.id === "number" || typeof remote.id === "string" ? String(remote.id) : "";
    if (!id) throw new ProviderSyncError("Kit did not return a subscriber identifier.");
    const tagged = await providerRequest(
      "kit",
      `https://api.kit.com/v4/tags/${encodeURIComponent(credentials.kit.tagId)}/subscribers/${encodeURIComponent(id)}`,
      { method: "POST", headers },
      fetcher,
    );
    if (!tagged.ok) failure("kit", tagged);
    return { externalId: id, remoteStatus: String(remote.state ?? "active") };
  }

  const headers = {
    Authorization: `Bearer ${credentials.sender.apiToken}`,
    "Content-Type": "application/json",
  };
  const url = `https://api.sender.net/v2/subscribers/${encodeURIComponent(subscriber.email)}`;
  if (subscriber.status === "unsubscribed") {
    const response = await providerRequest(
      "sender",
      url,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ subscriber_status: "UNSUBSCRIBED", trigger_automation: false }),
      },
      fetcher,
    );
    if (response.status === 404) return { externalId: null, remoteStatus: "not_present" };
    if (!response.ok) failure("sender", response);
    return { externalId: externalId || subscriber.email, remoteStatus: "unsubscribed" };
  }
  const response = await providerRequest(
    "sender",
    "https://api.sender.net/v2/subscribers",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: subscriber.email,
        firstname: subscriber.name || undefined,
        groups: [credentials.sender.groupId],
        trigger_automation: false,
      }),
    },
    fetcher,
  );
  if (response.status === 409 || response.status === 422) {
    const updated = await providerRequest(
      "sender",
      url,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          firstname: subscriber.name || undefined,
          groups: [credentials.sender.groupId],
          subscriber_status: "ACTIVE",
          trigger_automation: false,
        }),
      },
      fetcher,
    );
    if (!updated.ok) failure("sender", updated);
    return { externalId: externalId || subscriber.email, remoteStatus: "active" };
  }
  if (!response.ok) failure("sender", response);
  const data = await responseData(response);
  const remote = (data.data ?? data) as Record<string, unknown>;
  const id =
    typeof remote.id === "number" || typeof remote.id === "string"
      ? String(remote.id)
      : subscriber.email;
  return { externalId: id, remoteStatus: String(remote.status ?? "active") };
}

export async function getSubscriberStatusFromProvider(
  provider: ProviderName,
  credentials: ProviderCredentials,
  subscriber: NewsletterSubscriber,
  externalId: string | null,
  fetcher: typeof fetch = fetch,
) {
  if (provider === "kit") {
    if (!externalId) return { externalId: null, remoteStatus: "not_present", suppressed: false };
    const response = await providerRequest(
      "kit",
      `https://api.kit.com/v4/subscribers/${encodeURIComponent(externalId)}`,
      { method: "GET", headers: { "X-Kit-Api-Key": credentials.kit.apiKey } },
      fetcher,
    );
    if (response.status === 404)
      return { externalId, remoteStatus: "not_present", suppressed: false };
    if (!response.ok) failure("kit", response);
    const data = await responseData(response);
    const remote = (data.subscriber ?? data) as Record<string, unknown>;
    const state = String(remote.state ?? "unknown").toLowerCase();
    return {
      externalId,
      remoteStatus: state,
      suppressed: ["cancelled", "bounced", "complained", "inactive"].includes(state),
    };
  }

  const response = await providerRequest(
    "sender",
    `https://api.sender.net/v2/subscribers/${encodeURIComponent(subscriber.email)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${credentials.sender.apiToken}`,
        Accept: "application/json",
      },
    },
    fetcher,
  );
  if (response.status === 404)
    return { externalId, remoteStatus: "not_present", suppressed: false };
  if (!response.ok) failure("sender", response);
  const data = await responseData(response);
  const remote = (data.data ?? data) as Record<string, unknown>;
  const statusValue = remote.status;
  const emailStatus =
    statusValue && typeof statusValue === "object"
      ? (statusValue as Record<string, unknown>).email
      : statusValue;
  const status = String(emailStatus ?? "unknown").toLowerCase();
  const id =
    typeof remote.id === "number" || typeof remote.id === "string"
      ? String(remote.id)
      : externalId || subscriber.email;
  return {
    externalId: id,
    remoteStatus: status,
    suppressed: ["unsubscribed", "bounced", "complained", "blocked"].includes(status),
  };
}
