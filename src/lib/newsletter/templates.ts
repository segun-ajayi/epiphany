export const NEWSLETTER_TEMPLATE_IDS = ["heritage", "sunday-light", "evening-prayer"] as const;
export type NewsletterTemplateId = (typeof NEWSLETTER_TEMPLATE_IDS)[number];

export type NewsletterDocument = {
  slug: string;
  subject: string;
  preheader: string;
  eyebrow: string;
  title: string;
  greeting: string;
  paragraphs: string[];
  quote: string;
  quoteReference: string;
  ctaLabel: string;
  ctaUrl: string;
};

export const NEWSLETTER_TEMPLATES: Record<
  NewsletterTemplateId,
  { name: string; description: string; palette: string[] }
> = {
  heritage: {
    name: "Heritage",
    description: "Burgundy, gold and a traditional parish-letter character.",
    palette: ["#781f2b", "#d4af37", "#f8f5ef"],
  },
  "sunday-light": {
    name: "Sunday Light",
    description: "Bright, spacious and editorial with a warm cream canvas.",
    palette: ["#f8f5ef", "#ffffff", "#781f2b"],
  },
  "evening-prayer": {
    name: "Evening Prayer",
    description: "Deep navy, quiet gold and a more contemplative presentation.",
    palette: ["#17243a", "#d4af37", "#fffaf0"],
  },
};

export const WELCOME_NEWSLETTER: NewsletterDocument = {
  slug: "welcome",
  subject: "Welcome to The Epiphany Letter",
  preheader: "Faith, parish news and moments of encouragement for the week ahead.",
  eyebrow: "The Epiphany Letter",
  title: "Welcome. We’re glad you’re here.",
  greeting: "Dear friend,",
  paragraphs: [
    "Thank you for joining The Epiphany Letter. It is a joy to welcome you into the life of Anglican Church of the Epiphany, Houston.",
    "From time to time, we’ll share upcoming services and events, parish news, and a thoughtful word of encouragement for the week ahead.",
    "Whether you have worshipped with us for years or are only beginning to get to know our church, we pray each note helps you feel informed, encouraged, and connected.",
  ],
  quote: "Arise, shine, for your light has come.",
  quoteReference: "Isaiah 60:1",
  ctaLabel: "Visit our website",
  ctaUrl: "https://acehou.org/",
};

export function eventNewsletterDocument(event: {
  slug: string;
  title: string;
  summary: string;
  description: string;
  starts_at: string;
  timezone: string;
  venue_name: string | null;
}): NewsletterDocument {
  const starts = new Date(event.starts_at);
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: event.timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(starts);
  const details = [date, event.venue_name].filter(Boolean).join(" · ");
  const description = event.description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 6);
  return {
    slug: `events/${event.slug}`,
    subject: `You’re invited: ${event.title}`,
    preheader: event.summary,
    eyebrow: "Upcoming at Epiphany",
    title: event.title,
    greeting: "Dear church family,",
    paragraphs: [event.summary, ...description.filter((paragraph) => paragraph !== event.summary)],
    quote: details,
    quoteReference: "Save the date",
    ctaLabel: "View event details",
    ctaUrl: `/events/${event.slug}`,
  };
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const safeUrl = (value: string) => {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported newsletter URL.");
  return escapeHtml(url.toString());
};

type RenderOptions = {
  origin: string;
  browserViewUrl?: string;
  unsubscribeUrl?: string;
  mode?: "email" | "browser";
};

const theme = {
  heritage: {
    page: "#f1ece4",
    card: "#ffffff",
    header: "#781f2b",
    headerText: "#ffffff",
    accent: "#d4af37",
    ink: "#17243a",
    muted: "#657083",
    radius: "22px",
    align: "left" as const,
  },
  "sunday-light": {
    page: "#f8f5ef",
    card: "#ffffff",
    header: "#fffaf0",
    headerText: "#17243a",
    accent: "#781f2b",
    ink: "#17243a",
    muted: "#657083",
    radius: "4px",
    align: "left" as const,
  },
  "evening-prayer": {
    page: "#0f1728",
    card: "#17243a",
    header: "#17243a",
    headerText: "#fffaf0",
    accent: "#d4af37",
    ink: "#fffaf0",
    muted: "#c4cad4",
    radius: "22px",
    align: "center" as const,
  },
};

export function renderNewsletterHtml(
  templateId: NewsletterTemplateId,
  document: NewsletterDocument,
  options: RenderOptions,
) {
  const colors = theme[templateId];
  const origin = new URL(options.origin).origin;
  const browserViewUrl = safeUrl(
    options.browserViewUrl ?? `${origin}/newsletter/${encodeURIComponent(document.slug)}`,
  );
  const logoUrl = safeUrl(`${origin}/faviconACE.png`);
  const ctaUrl = safeUrl(new URL(document.ctaUrl, origin).toString());
  const unsubscribe = options.unsubscribeUrl ?? "{$unsubscribe_link}";
  const paragraphs = document.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px;color:${colors.ink};font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;">${escapeHtml(paragraph)}</p>`,
    )
    .join("");
  const lightTheme = templateId !== "evening-prayer";
  const topRule =
    templateId === "sunday-light"
      ? `border-left:6px solid ${colors.accent};`
      : `border-top:6px solid ${colors.accent};`;
  const footerLink = lightTheme ? "#781f2b" : "#d4af37";
  const unsubscribeMarkup =
    options.mode === "browser"
      ? '<span style="color:#7c8492;">Use the unsubscribe link in your email to leave the list.</span>'
      : `<a href="${escapeHtml(unsubscribe)}" style="color:${footerLink};text-decoration:underline;">Unsubscribe</a>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(document.subject)}</title>
<style>@media only screen and (max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:24px!important;padding-right:24px!important}.email-title{font-size:36px!important}.email-button{display:block!important;text-align:center!important}}</style>
</head>
<body style="margin:0;padding:0;background:${colors.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(document.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${colors.page};">
<tr><td align="center" style="padding:18px 12px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${colors.muted};">
Having trouble reading this email? <a href="${browserViewUrl}" style="color:${footerLink};text-decoration:underline;">View it in your browser</a>
</td></tr>
<tr><td align="center" style="padding:10px 12px 36px;">
<table class="email-shell" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:${colors.card};border-radius:${colors.radius};overflow:hidden;box-shadow:0 20px 55px rgba(15,23,40,.14);${topRule}">
<tr><td class="email-pad" align="${colors.align}" style="padding:44px 48px 38px;background:${colors.header};">
<img src="${logoUrl}" width="70" height="70" alt="Anglican Church of the Epiphany" style="display:block;border:0;width:70px;height:70px;object-fit:contain;${colors.align === "center" ? "margin:0 auto;" : ""}">
<p style="margin:24px 0 10px;color:${colors.accent};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${escapeHtml(document.eyebrow)}</p>
<h1 class="email-title" style="margin:0;color:${colors.headerText};font-family:Georgia,'Times New Roman',serif;font-size:44px;font-weight:600;line-height:1.12;letter-spacing:-.5px;">${escapeHtml(document.title)}</h1>
<p style="margin:18px 0 0;color:${colors.headerText};opacity:.76;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;">Faith, worship and community in Houston, Texas</p>
</td></tr>
<tr><td class="email-pad" style="padding:42px 48px 46px;background:${colors.card};">
<p style="margin:0 0 20px;color:${colors.ink};font-family:Georgia,'Times New Roman',serif;font-size:23px;font-weight:600;">${escapeHtml(document.greeting)}</p>
${paragraphs}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0;background:${templateId === "evening-prayer" ? "#202f49" : "#f8f5ef"};border-left:4px solid ${colors.accent};"><tr><td style="padding:22px 24px;">
<p style="margin:0;color:${colors.ink};font-family:Georgia,'Times New Roman',serif;font-size:20px;font-style:italic;line-height:1.5;">“${escapeHtml(document.quote)}”</p>
<p style="margin:8px 0 0;color:${colors.muted};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${escapeHtml(document.quoteReference)}</p>
</td></tr></table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" ${colors.align === "center" ? 'align="center"' : ""}><tr><td style="border-radius:6px;background:${colors.accent};">
<a class="email-button" href="${ctaUrl}" style="display:inline-block;padding:15px 24px;color:${templateId === "sunday-light" ? "#ffffff" : "#17243a"};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-decoration:none;">${escapeHtml(document.ctaLabel)} →</a>
</td></tr></table>
<p style="margin:30px 0 0;color:${colors.ink};font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;">With every blessing,<br><strong>The Epiphany Church Family</strong></p>
</td></tr>
<tr><td class="email-pad" style="padding:28px 48px;background:${lightTheme ? "#f4efe7" : "#101a2c"};text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:${colors.muted};">
<strong style="color:${colors.ink};">Anglican Church of the Epiphany, Houston</strong><br>13111 Westheimer Road, Suite #130, Houston, TX 77077<br>
<a href="https://acehou.org" style="color:${footerLink};">acehou.org</a>&nbsp;&nbsp;·&nbsp;&nbsp;${unsubscribeMarkup}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
