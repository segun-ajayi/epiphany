import { useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  MailCheck,
  Palette,
  RefreshCw,
  Send,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type {
  DeliveryProvider,
  NewsletterDelivery,
  NewsletterCampaign,
  NewsletterSubscriber,
  NewsletterTemplateId,
} from "@/lib/newsletter/schemas";
import { NEWSLETTER_TEMPLATES } from "@/lib/newsletter/templates";

type NewsletterData = {
  subscribers: NewsletterSubscriber[];
  totals: { total: number; subscribed: number; unsubscribed: number };
  page: number;
  pageSize: number;
  delivery: NewsletterDelivery;
  campaigns: NewsletterCampaign[];
};

export function NewsletterManager() {
  const [data, setData] = useState<NewsletterData | null>(null);
  const [busyId, setBusyId] = useState("");
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const [confirmCampaignId, setConfirmCampaignId] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<DeliveryProvider>("disabled");
  const [selectedTemplate, setSelectedTemplate] = useState<NewsletterTemplateId>("heritage");
  const [workflowEnabled, setWorkflowEnabled] = useState(true);
  const [message, setMessage] = useState("");

  async function load(page = 0) {
    setMessage("");
    const response = await fetch(`/api/admin/newsletter?page=${page}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to load newsletter subscribers.");
    setData(body);
    setSelectedProvider(body.delivery.activeProvider);
    setSelectedTemplate(body.delivery.activeTemplate);
    setWorkflowEnabled(body.delivery.workflow.enabled);
  }

  async function saveWorkflow() {
    setDeliveryBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "event-workflow", enabled: workflowEnabled }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to change the event workflow.");
      await load(data?.page ?? 0);
      setMessage(
        workflowEnabled
          ? "Automatic event newsletters are enabled."
          : "Automatic event newsletters are paused.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to change the event workflow.");
    } finally {
      setDeliveryBusy(false);
    }
  }

  async function retryCampaign(campaign: NewsletterCampaign) {
    setDeliveryBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "deliver-campaign", id: campaign.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to deliver this event newsletter.");
      await load(data?.page ?? 0);
      setMessage(
        body.sent
          ? "The event newsletter was accepted for delivery."
          : body.error || "The delivery attempt finished; review its status below.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to deliver this event newsletter.",
      );
    } finally {
      setDeliveryBusy(false);
      setConfirmCampaignId("");
    }
  }

  async function saveTemplate() {
    setDeliveryBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "newsletter-template", template: selectedTemplate }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save the newsletter design.");
      await load(data?.page ?? 0);
      setMessage(`${NEWSLETTER_TEMPLATES[selectedTemplate].name} is now the active design.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save the newsletter design.");
    } finally {
      setDeliveryBusy(false);
    }
  }

  useEffect(() => {
    void load().catch((error) => setMessage(error.message));
  }, []);

  async function changeStatus(subscriber: NewsletterSubscriber) {
    const status = subscriber.status === "subscribed" ? "unsubscribed" : "subscribed";
    setBusyId(subscriber.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "subscriber-status", id: subscriber.id, status }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to update this subscriber.");
      await load(data?.page ?? 0);
      setMessage(
        body.deliveryWarning ||
          (status === "subscribed" ? "Subscriber restored." : "Subscriber removed."),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update this subscriber.");
    } finally {
      setBusyId("");
    }
  }

  async function saveProvider() {
    setDeliveryBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "delivery-provider", provider: selectedProvider }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to change the delivery provider.");
      await load(data?.page ?? 0);
      setMessage(
        selectedProvider === "disabled"
          ? "Newsletter delivery is disabled. Signups are still saved locally."
          : `${selectedProvider === "kit" ? "Kit" : "Sender"} is now the active delivery provider.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to change the delivery provider.",
      );
    } finally {
      setDeliveryBusy(false);
    }
  }

  async function syncSubscribers() {
    if (
      !window.confirm(
        "Sync the next 25 changed subscriber records with the selected provider? No campaign will be sent.",
      )
    )
      return;
    setDeliveryBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "sync" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to synchronize subscribers.");
      await load(data?.page ?? 0);
      setMessage(
        `Processed ${body.processed}: ${body.succeeded} synchronized, ${body.failed} need attention. ${body.remaining} remaining.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to synchronize subscribers.");
    } finally {
      setDeliveryBusy(false);
    }
  }

  async function reconcileSubscribers() {
    if (
      !window.confirm(
        "Check up to 25 active subscribers against the selected provider? Remote opt-outs will be imported; no subscriber will be restored and no campaign will be sent.",
      )
    )
      return;
    setDeliveryBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Admin-Request": "1" },
        body: JSON.stringify({ action: "reconcile" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to check provider statuses.");
      await load(data?.page ?? 0);
      setMessage(
        `Checked ${body.processed}: ${body.suppressed} opt-outs imported, ${body.unchanged} unchanged, ${body.failed} need attention.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to check provider statuses.");
    } finally {
      setDeliveryBusy(false);
    }
  }

  if (!data && !message) {
    return <p className="rounded-xl border p-8 text-center text-muted-foreground">Loading…</p>;
  }

  return (
    <section aria-labelledby="newsletter-admin-heading">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="flex items-center gap-2 text-sm text-burgundy">
            <MailCheck className="size-4" aria-hidden /> Audience
          </p>
          <h2 id="newsletter-admin-heading" className="mt-2 font-display text-3xl">
            Newsletter subscribers
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Subscriber details are private. Export only the active list when a newsletter is ready
            to send through an approved service.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/api/admin/newsletter?format=csv" download>
            <Download className="size-4" aria-hidden /> Export active list
          </a>
        </Button>
      </div>

      {data && (
        <div className="mt-7 rounded-2xl border bg-card p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <Send className="size-4 text-burgundy" aria-hidden /> Event publishing workflow
              </p>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                When a new event is published, an HTML newsletter is queued with the active design.
                Scheduled events wait until their publication time. Delivery runs every five
                minutes.
              </p>
            </div>
            <Badge variant={data.delivery.workflow.enabled ? "secondary" : "outline"}>
              {data.delivery.workflow.enabled ? "Automatic" : "Paused"}
            </Badge>
          </div>
          <label className="mt-5 flex max-w-xl cursor-pointer items-start gap-3 rounded-xl border p-4">
            <input
              type="checkbox"
              checked={workflowEnabled}
              onChange={(event) => setWorkflowEnabled(event.target.checked)}
              className="mt-0.5 size-4 accent-[#7A1E1E]"
            />
            <span>
              <span className="font-medium">Send a newsletter for newly published events</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Existing events and ordinary edits are not resent. Failed deliveries stay visible
                and can be retried.
              </span>
            </span>
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              disabled={deliveryBusy || workflowEnabled === data.delivery.workflow.enabled}
              onClick={() => void saveWorkflow()}
            >
              Save workflow
            </Button>
            <p className="text-xs text-muted-foreground">
              Queued {data.delivery.workflow.queued} · Failed {data.delivery.workflow.failed}
              {data.delivery.workflow.lastRunAt
                ? ` · Last run ${new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(data.delivery.workflow.lastRunAt))}`
                : " · Waiting for first run"}
            </p>
          </div>
          {data.delivery.workflow.lastError && (
            <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              {data.delivery.workflow.lastError}
            </p>
          )}

          <div className="mt-6 overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Event newsletter delivery history</caption>
              <thead className="bg-secondary">
                <tr>
                  <th className="p-4">Newsletter</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Delivery</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-t">
                    <td className="p-4">
                      <p className="font-medium">{campaign.subject}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {NEWSLETTER_TEMPLATES[campaign.templateId].name} · queued{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(campaign.createdAt))}
                      </p>
                    </td>
                    <td className="p-4 capitalize">
                      <Badge
                        variant={
                          campaign.status === "failed"
                            ? "destructive"
                            : campaign.status === "sent"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {campaign.status}
                      </Badge>
                      {campaign.lastError && (
                        <p className="mt-2 max-w-xs text-xs text-destructive">
                          {campaign.lastError}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {campaign.provider
                        ? campaign.provider === "kit"
                          ? "Kit"
                          : "Sender"
                        : "Waiting for provider"}
                      {campaign.sentAt
                        ? ` · ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(campaign.sentAt))}`
                        : ""}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={`/newsletter/events/${campaign.slug}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Preview
                          </a>
                        </Button>
                        {campaign.status !== "sent" &&
                          !["creating", "sending"].includes(campaign.status) && (
                            <>
                              {confirmCampaignId === campaign.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={deliveryBusy}
                                    onClick={() => void retryCampaign(campaign)}
                                  >
                                    Confirm send
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={deliveryBusy}
                                    onClick={() => setConfirmCampaignId("")}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={deliveryBusy}
                                  onClick={() => {
                                    setConfirmCampaignId(campaign.id);
                                    setMessage(
                                      `Confirm delivery of “${campaign.subject}” to the active newsletter audience.`,
                                    );
                                  }}
                                >
                                  Send now
                                </Button>
                              )}
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.campaigns.length && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No event newsletters yet. The first one will be queued when a new event is
                published.
              </p>
            )}
          </div>
        </div>
      )}

      {data && (
        <div className="mt-7 rounded-2xl border bg-card p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <Palette className="size-4 text-burgundy" aria-hidden /> Welcome email design
              </p>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Choose the HTML design used for the welcome letter and as the starting point for
                future newsletters. Saving a design does not send an email.
              </p>
            </div>
            <Badge variant="secondary">
              {NEWSLETTER_TEMPLATES[data.delivery.activeTemplate].name} active
            </Badge>
          </div>

          <RadioGroup
            value={selectedTemplate}
            onValueChange={(value) => setSelectedTemplate(value as NewsletterTemplateId)}
            className="mt-5 grid gap-4 lg:grid-cols-3"
          >
            {(
              Object.entries(NEWSLETTER_TEMPLATES) as [
                NewsletterTemplateId,
                (typeof NEWSLETTER_TEMPLATES)[NewsletterTemplateId],
              ][]
            ).map(([value, template]) => (
              <Label
                key={value}
                htmlFor={`template-${value}`}
                className={`cursor-pointer overflow-hidden rounded-xl border bg-background transition-shadow hover:shadow-md ${
                  selectedTemplate === value ? "border-burgundy ring-2 ring-burgundy/15" : ""
                }`}
              >
                <span
                  className="block h-24 p-4"
                  style={{ backgroundColor: template.palette[0] }}
                  aria-hidden
                >
                  <span
                    className="mx-auto block h-full max-w-32 rounded-sm p-3 shadow-sm"
                    style={{ backgroundColor: template.palette[1] }}
                  >
                    <span
                      className="block h-2 w-12 rounded-full"
                      style={{ backgroundColor: template.palette[2] }}
                    />
                    <span className="mt-3 block h-1.5 w-full rounded-full bg-black/15" />
                    <span className="mt-2 block h-1.5 w-4/5 rounded-full bg-black/10" />
                  </span>
                </span>
                <span className="flex items-start gap-3 p-4">
                  <RadioGroupItem id={`template-${value}`} value={value} className="mt-0.5" />
                  <span>
                    <span className="font-medium">{template.name}</span>
                    <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">
                      {template.description}
                    </span>
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>

          <div className="mt-6 overflow-hidden rounded-xl border bg-muted">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  Preview: {NEWSLETTER_TEMPLATES[selectedTemplate].name}
                </p>
                <p className="text-xs text-muted-foreground">Responsive email and browser view</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <a
                    href={`/newsletter/welcome?template=${selectedTemplate}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" aria-hidden /> Open preview
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a
                    href={`/api/admin/newsletter?format=html&template=${selectedTemplate}`}
                    download
                  >
                    <Download className="size-4" aria-hidden /> Download HTML
                  </a>
                </Button>
              </div>
            </div>
            <iframe
              key={selectedTemplate}
              src={`/newsletter/welcome?template=${selectedTemplate}`}
              title={`${NEWSLETTER_TEMPLATES[selectedTemplate].name} welcome email preview`}
              className="h-[720px] w-full bg-white"
              sandbox="allow-same-origin allow-popups"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              disabled={deliveryBusy || selectedTemplate === data.delivery.activeTemplate}
              onClick={() => void saveTemplate()}
            >
              Save active design
            </Button>
            <p className="text-xs text-muted-foreground">
              The email includes a permanent “View in browser” link and Sender’s unsubscribe link.
            </p>
          </div>
        </div>
      )}

      {data && (
        <div className="mt-7 rounded-2xl border bg-card p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <Send className="size-4 text-burgundy" aria-hidden /> Delivery provider
              </p>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Only one service can receive subscriber changes. Campaigns are created and sent in
                that service—not from this website.
              </p>
            </div>
            <Badge variant={data.delivery.activeProvider === "disabled" ? "outline" : "secondary"}>
              {data.delivery.activeProvider === "disabled"
                ? "Delivery disabled"
                : `${data.delivery.activeProvider === "kit" ? "Kit" : "Sender"} active`}
            </Badge>
          </div>

          <RadioGroup
            value={selectedProvider}
            onValueChange={(value) => setSelectedProvider(value as DeliveryProvider)}
            className="mt-5 grid gap-3 md:grid-cols-3"
          >
            {(
              [
                ["disabled", "Disabled", true, "Keep signups only in this website."],
                [
                  "kit",
                  "Kit",
                  data.delivery.providers.kit.configured,
                  "Use the configured Kit tag.",
                ],
                [
                  "sender",
                  "Sender",
                  data.delivery.providers.sender.configured,
                  "Use the configured Sender group.",
                ],
              ] as const
            ).map(([value, title, configured, description]) => (
              <Label
                key={value}
                htmlFor={`delivery-${value}`}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${
                  selectedProvider === value ? "border-burgundy bg-secondary" : ""
                } ${!configured ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <RadioGroupItem
                  id={`delivery-${value}`}
                  value={value}
                  disabled={!configured}
                  className="mt-0.5"
                />
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    {title}
                    {value !== "disabled" && (
                      <Badge variant={configured ? "secondary" : "outline"}>
                        {configured ? "Configured" : "Setup required"}
                      </Badge>
                    )}
                  </span>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {description}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              disabled={deliveryBusy || selectedProvider === data.delivery.activeProvider}
              onClick={() => void saveProvider()}
            >
              Save delivery choice
            </Button>
            <Button
              variant="outline"
              disabled={deliveryBusy || data.delivery.activeProvider === "disabled"}
              onClick={() => void syncSubscribers()}
            >
              <RefreshCw className={`size-4 ${deliveryBusy ? "animate-spin" : ""}`} aria-hidden />
              Sync next 25
            </Button>
            <Button
              variant="outline"
              disabled={deliveryBusy || data.delivery.activeProvider === "disabled"}
              onClick={() => void reconcileSubscribers()}
            >
              <MailCheck className="size-4" aria-hidden />
              Check provider status
            </Button>
            <p className="text-xs text-muted-foreground">
              Synced {data.delivery.sync.synced} · Pending {data.delivery.sync.pending} · Errors{" "}
              {data.delivery.sync.errors}
            </p>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            New signups and status changes sync automatically when delivery is active. A daily
            provider check imports remote opt-outs without restoring subscribers. Manual sync and
            status checks remain available before a campaign.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Automatic check: {data.delivery.automation.enabled ? "daily" : "disabled"}
            {data.delivery.automation.lastRunAt
              ? ` · Last run ${new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(data.delivery.automation.lastRunAt))}`
              : " · Waiting for first run"}
            {data.delivery.automation.lastError ? ` · ${data.delivery.automation.lastError}` : ""}
          </p>
        </div>
      )}

      {data && (
        <div className="my-7 grid gap-4 sm:grid-cols-3">
          {[
            ["Active", data.totals.subscribed],
            ["Unsubscribed", data.totals.unsubscribed],
            ["Total records", data.totals.total],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {message && (
        <p role="status" className="mb-5 rounded-xl bg-secondary p-4 text-sm">
          {message}
        </p>
      )}

      {data && (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Newsletter subscribers</caption>
              <thead className="bg-secondary">
                <tr>
                  <th className="p-4">Subscriber</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Consent recorded</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-t">
                    <td className="p-4">
                      <p className="font-medium">{subscriber.name || "Name not provided"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{subscriber.email}</p>
                    </td>
                    <td className="p-4 capitalize">{subscriber.status}</td>
                    <td className="p-4">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(subscriber.consent_at))}
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === subscriber.id}
                        onClick={() => void changeStatus(subscriber)}
                      >
                        {subscriber.status === "subscribed" ? (
                          <UserMinus className="size-4" aria-hidden />
                        ) : (
                          <UserPlus className="size-4" aria-hidden />
                        )}
                        {subscriber.status === "subscribed" ? "Unsubscribe" : "Restore"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.subscribers.length && (
              <p className="p-10 text-center text-muted-foreground">
                No one has joined yet. New signups from the home page will appear here.
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <Button
              variant="outline"
              disabled={data.page === 0}
              onClick={() => void load(data.page - 1)}
            >
              Previous
            </Button>
            <span>Page {data.page + 1}</span>
            <Button
              variant="outline"
              disabled={(data.page + 1) * data.pageSize >= data.totals.total}
              onClick={() => void load(data.page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
