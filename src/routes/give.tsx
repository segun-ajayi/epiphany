import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, ExternalLink, HeartHandshake, ShieldCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ReceiptRequestForm } from "@/components/giving/receipt-request-form";
import { getPublicGiving } from "@/lib/api/giving.functions";
import type { GivingMethod } from "@/lib/giving/schemas";
import { IMAGES } from "@/data/church";
import { PageHero } from "./about";
import { absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/give")({
  loader: () => getPublicGiving(),
  head: ({ loaderData }) => {
    const title = `Give — ${loaderData?.settings.publicName || "Anglican Church of the Epiphany"}`;
    const description =
      "Support the mission of Anglican Church of the Epiphany using verified external giving instructions.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: absoluteUrl("/give") },
        ...(loaderData?.settings.socialImagePath
          ? [{ property: "og:image", content: absoluteUrl(loaderData.settings.socialImagePath) }]
          : []),
      ],
      links: [{ rel: "canonical", href: absoluteUrl("/give") }],
    };
  },
  component: GivePage,
});

const methodLabel = (method: GivingMethod) => (method.id === "zelle" ? "Zelle" : "Cash App");

function GivingMethodCard({ method, simulation }: { method: GivingMethod; simulation: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copyIdentifier() {
    await navigator.clipboard.writeText(method.paymentIdentifier);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <article className="min-w-0 rounded-2xl border bg-card p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-2xl">Give with {methodLabel(method)}</h3>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          Verified by the church
        </span>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Send to</p>
      <p className="mt-1 break-words text-xl font-semibold [overflow-wrap:anywhere]">
        {method.paymentIdentifier}
      </p>
      <p className="mt-1 text-sm">Recipient: {method.recipientName}</p>
      {method.instructions && <p className="mt-4 text-sm leading-relaxed">{method.instructions}</p>}
      {method.memoGuidance && (
        <p className="mt-3 rounded-lg bg-secondary p-3 text-sm">Memo: {method.memoGuidance}</p>
      )}
      {method.qrImagePath && (
        <img
          src={method.qrImagePath}
          alt={`${methodLabel(method)} giving QR code`}
          className="mt-5 size-44 rounded-xl border bg-white object-contain p-2"
        />
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => void copyIdentifier()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy details"}
        </Button>
        {method.externalUrl && !simulation && (
          <Button asChild>
            <a href={method.externalUrl} target="_blank" rel="noopener noreferrer">
              Open {methodLabel(method)} <ExternalLink className="size-4" />
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}

function GivePage() {
  const { configured, setupRequired, settings } = Route.useLoaderData();
  const { siteSettings } = getRouteApi("__root__").useLoaderData();
  const hero = siteSettings.pages.give;
  const faq = [
    {
      question: "Does this website process my payment?",
      answer:
        "No. The website only displays church-approved instructions. You complete the transfer in your bank or payment app and should confirm the recipient before sending.",
    },
    ...(settings.taxStatusText
      ? [{ question: "How are gifts treated?", answer: settings.taxStatusText }]
      : []),
    ...(settings.receiptTurnaround
      ? [{ question: "When will I receive a receipt?", answer: settings.receiptTurnaround }]
      : []),
  ];
  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
        image={hero.imagePath || IMAGES.bible}
      />
      <section className="container-page py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          {settings.simulationMode && (
            <div
              className="mb-6 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 text-center font-semibold text-amber-950"
              role="status"
            >
              LOCAL SIMULATION — these are non-payable demonstration details. Do not send money.
            </div>
          )}
          <div className="flex items-start gap-4 rounded-2xl border border-gold/40 bg-gold/10 p-5">
            <ShieldCheck className="mt-0.5 size-6 shrink-0 text-burgundy" aria-hidden />
            <div>
              <h2 className="font-display text-xl">Give with confidence</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {settings.trustStatement}
              </p>
            </div>
          </div>
          {!configured ? (
            <div className="mt-8 rounded-2xl border bg-card p-8 text-center">
              <HeartHandshake className="mx-auto size-10 text-burgundy" aria-hidden />
              <h2 className="mt-4 font-display text-2xl">
                Online giving details are being prepared
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                Please contact the church before sending a gift. Administrators still need to
                verify: {setupRequired.join(", ")}.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid min-w-0 gap-5 md:grid-cols-2">
              {settings.methods.map((method) => (
                <GivingMethodCard
                  key={method.id}
                  method={method}
                  simulation={settings.simulationMode}
                />
              ))}
            </div>
          )}

          {!!settings.designations.length && (
            <section className="mt-12" aria-labelledby="designation-heading">
              <h2 id="designation-heading" className="font-display text-3xl">
                Ways to designate your gift
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {settings.designations.map((item) => (
                  <article key={item.id} className="rounded-xl border bg-card p-5">
                    <h3 className="font-semibold">{item.label}</h3>
                    {item.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
          {settings.offlineInstructions && (
            <section className="mt-10 rounded-2xl bg-secondary p-6 md:p-8">
              <h2 className="font-display text-2xl">Other ways to give</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                {settings.offlineInstructions}
              </p>
            </section>
          )}
          {!!settings.impactItems.length && (
            <section className="mt-14" aria-labelledby="impact-heading">
              <h2 id="impact-heading" className="font-display text-3xl text-center">
                Your generosity at work
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {settings.impactItems.map((item) => (
                  <article key={item.id} className="rounded-2xl border bg-card p-6 text-center">
                    <p className="font-display text-3xl text-burgundy">
                      ${(item.amountCents / 100).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.statement}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
          {configured && settings.receiptsEnabled && (
            <section className="mt-14" aria-label="Donation receipt request">
              <ReceiptRequestForm
                methods={settings.methods}
                designations={settings.designations}
                consentText={settings.receiptConsentText}
                privacyText={settings.privacyText}
                retentionText={settings.retentionText}
                turnaround={settings.receiptTurnaround}
              />
            </section>
          )}
          <section className="mx-auto mt-16 max-w-3xl">
            <h2 className="font-display text-3xl text-center">Giving FAQ</h2>
            <Accordion type="single" collapsible className="mt-6">
              {faq.map((item, index) => (
                <AccordionItem key={item.question} value={`giving-${index}`}>
                  <AccordionTrigger className="text-left font-display text-lg">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
          {(settings.supportEmail || settings.supportPhone) && (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              Questions about giving?{" "}
              {settings.supportEmail && (
                <a className="underline" href={`mailto:${settings.supportEmail}`}>
                  {settings.supportEmail}
                </a>
              )}
              {settings.supportEmail && settings.supportPhone ? " · " : ""}
              {settings.supportPhone && (
                <a className="underline" href={`tel:${settings.supportPhone}`}>
                  {settings.supportPhone}
                </a>
              )}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
