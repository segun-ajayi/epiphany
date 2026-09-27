import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSettings } from "@/lib/site-settings/schemas";

type Props = {
  settings: SiteSettings;
  disabled: boolean;
  onChange: (settings: SiteSettings) => void;
  onUpload: (file: File) => Promise<string>;
};

function ImageField({
  label,
  value,
  disabled,
  onUpload,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="rounded-xl border border-dashed p-4">
      <p className="text-sm font-medium">{label}</p>
      {value && (
        <img
          src={value}
          alt="Current selection"
          className="mt-3 aspect-[16/9] w-full rounded-lg object-cover"
        />
      )}
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-burgundy">
        <Upload className="size-4" /> Upload replacement
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
        />
      </label>
      {!value && (
        <p className="mt-2 text-xs text-muted-foreground">Using the bundled fallback image.</p>
      )}
    </div>
  );
}

export function SiteContentFields({ settings, disabled, onChange, onUpload }: Props) {
  const setHome = (patch: Partial<SiteSettings["home"]>) =>
    onChange({ ...settings, home: { ...settings.home, ...patch } });
  const setAbout = (patch: Partial<SiteSettings["about"]>) =>
    onChange({ ...settings, about: { ...settings.about, ...patch } });
  const setVisit = (patch: Partial<SiteSettings["visit"]>) =>
    onChange({ ...settings, visit: { ...settings.visit, ...patch } });
  const setPage = <K extends keyof SiteSettings["pages"]>(
    key: K,
    patch: Partial<SiteSettings["pages"][K]>,
  ) =>
    onChange({
      ...settings,
      pages: { ...settings.pages, [key]: { ...settings.pages[key], ...patch } },
    });
  const upload = async (file: File, apply: (path: string) => void) => apply(await onUpload(file));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-background p-5">
        <ImageField
          label="Header and footer logo"
          value={settings.logoImagePath}
          disabled={disabled}
          onUpload={(file) =>
            void upload(file, (path) => onChange({ ...settings, logoImagePath: path }))
          }
        />
      </div>
      <details className="rounded-2xl border bg-background" open>
        <summary className="cursor-pointer px-5 py-4 font-display text-xl">
          Homepage content
        </summary>
        <div className="space-y-6 border-t p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <ImageField
              label="Homepage hero image"
              value={settings.home.heroImagePath}
              disabled={disabled}
              onUpload={(file) => void upload(file, (path) => setHome({ heroImagePath: path }))}
            />
            <ImageField
              label="Rector welcome image"
              value={settings.home.welcomeImagePath}
              disabled={disabled}
              onUpload={(file) => void upload(file, (path) => setHome({ welcomeImagePath: path }))}
            />
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Hero introduction
            <Textarea
              rows={2}
              value={settings.home.heroIntro}
              onChange={(e) => setHome({ heroIntro: e.target.value })}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Welcome eyebrow
              <Input
                value={settings.home.welcomeEyebrow}
                onChange={(e) => setHome({ welcomeEyebrow: e.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Welcome heading
              <Input
                value={settings.home.welcomeTitle}
                onChange={(e) => setHome({ welcomeTitle: e.target.value })}
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Rector welcome message
            <Textarea
              rows={14}
              value={settings.home.welcomeBody}
              onChange={(e) => setHome({ welcomeBody: e.target.value })}
            />
            <span className="text-xs font-normal text-muted-foreground">
              Separate paragraphs with a blank line.
            </span>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Rector name
              <Input
                value={settings.home.welcomeName}
                onChange={(e) => setHome({ welcomeName: e.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Rector credentials and role
              <Textarea
                rows={5}
                value={settings.home.welcomeRole}
                onChange={(e) => setHome({ welcomeRole: e.target.value })}
              />
            </label>
          </div>
          <div className="grid gap-4 border-t pt-6 md:grid-cols-2">
            {(
              [
                ["servicesEyebrow", "Service-times eyebrow"],
                ["servicesTitle", "Service-times heading"],
                ["ministriesEyebrow", "Ministries eyebrow"],
                ["ministriesTitle", "Ministries heading"],
                ["eventsEyebrow", "Events eyebrow"],
                ["eventsTitle", "Events heading"],
                ["sermonsEyebrow", "Sermons eyebrow"],
                ["sermonsTitle", "Sermons heading"],
                ["givingEyebrow", "Giving eyebrow"],
                ["givingTitle", "Giving heading"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="grid gap-2 text-sm font-medium">
                {label}
                <Input
                  value={settings.home[key]}
                  onChange={(event) => setHome({ [key]: event.target.value })}
                />
              </label>
            ))}
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Service-times introduction
              <Textarea
                rows={2}
                value={settings.home.servicesIntro}
                onChange={(event) => setHome({ servicesIntro: event.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Giving introduction
              <Textarea
                rows={3}
                value={settings.home.givingBody}
                onChange={(event) => setHome({ givingBody: event.target.value })}
              />
            </label>
          </div>
          <div className="border-t pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Testimonials eyebrow
                <Input
                  value={settings.home.testimonialsEyebrow}
                  onChange={(e) => setHome({ testimonialsEyebrow: e.target.value })}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Testimonials heading
                <Input
                  value={settings.home.testimonialsTitle}
                  onChange={(e) => setHome({ testimonialsTitle: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-4 space-y-3">
              {settings.home.testimonials.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_2fr_auto]"
                >
                  <Input
                    aria-label="Person or family name"
                    value={item.name}
                    onChange={(e) =>
                      setHome({
                        testimonials: settings.home.testimonials.map((current) =>
                          current.id === item.id ? { ...current, name: e.target.value } : current,
                        ),
                      })
                    }
                  />
                  <Textarea
                    aria-label="Testimonial"
                    rows={2}
                    value={item.quote}
                    onChange={(e) =>
                      setHome({
                        testimonials: settings.home.testimonials.map((current) =>
                          current.id === item.id ? { ...current, quote: e.target.value } : current,
                        ),
                      })
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label="Remove testimonial"
                    onClick={() =>
                      setHome({
                        testimonials: settings.home.testimonials.filter(
                          (current) => current.id !== item.id,
                        ),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              className="mt-4"
              variant="outline"
              disabled={settings.home.testimonials.length >= 12}
              onClick={() =>
                setHome({
                  testimonials: [
                    ...settings.home.testimonials,
                    { id: crypto.randomUUID(), name: "", quote: "" },
                  ],
                })
              }
            >
              <Plus className="size-4" /> Add testimonial
            </Button>
          </div>
        </div>
      </details>

      <details className="rounded-2xl border bg-background">
        <summary className="cursor-pointer px-5 py-4 font-display text-xl">
          About page content
        </summary>
        <div className="space-y-6 border-t p-5">
          <ImageField
            label="About page hero image"
            value={settings.about.heroImagePath}
            disabled={disabled}
            onUpload={(file) => void upload(file, (path) => setAbout({ heroImagePath: path }))}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Hero eyebrow
              <Input
                value={settings.about.heroEyebrow}
                onChange={(e) => setAbout({ heroEyebrow: e.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Hero title
              <Input
                value={settings.about.heroTitle}
                onChange={(e) => setAbout({ heroTitle: e.target.value })}
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Hero subtitle
            <Textarea
              rows={2}
              value={settings.about.heroSubtitle}
              onChange={(e) => setAbout({ heroSubtitle: e.target.value })}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Mission heading
              <Input
                value={settings.about.missionTitle}
                onChange={(e) => setAbout({ missionTitle: e.target.value })}
              />
              <Textarea
                rows={4}
                value={settings.about.missionBody}
                onChange={(e) => setAbout({ missionBody: e.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Vision heading
              <Input
                value={settings.about.visionTitle}
                onChange={(e) => setAbout({ visionTitle: e.target.value })}
              />
              <Textarea
                rows={4}
                value={settings.about.visionBody}
                onChange={(e) => setAbout({ visionBody: e.target.value })}
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            History section heading
            <Input
              value={settings.about.historyTitle}
              onChange={(e) => setAbout({ historyTitle: e.target.value })}
            />
          </label>
          <div className="space-y-3">
            {settings.about.history.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-xl border p-4 md:grid-cols-[120px_1fr_2fr_auto]"
              >
                <Input
                  aria-label="Year"
                  value={item.year}
                  onChange={(e) =>
                    setAbout({
                      history: settings.about.history.map((current) =>
                        current.id === item.id ? { ...current, year: e.target.value } : current,
                      ),
                    })
                  }
                />
                <Input
                  aria-label="Milestone title"
                  value={item.title}
                  onChange={(e) =>
                    setAbout({
                      history: settings.about.history.map((current) =>
                        current.id === item.id ? { ...current, title: e.target.value } : current,
                      ),
                    })
                  }
                />
                <Textarea
                  aria-label="Milestone description"
                  rows={2}
                  value={item.body}
                  onChange={(e) =>
                    setAbout({
                      history: settings.about.history.map((current) =>
                        current.id === item.id ? { ...current, body: e.target.value } : current,
                      ),
                    })
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={settings.about.history.length === 1}
                  aria-label="Remove milestone"
                  onClick={() =>
                    setAbout({
                      history: settings.about.history.filter((current) => current.id !== item.id),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setAbout({
                history: [
                  ...settings.about.history,
                  { id: crypto.randomUUID(), year: "", title: "", body: "" },
                ],
              })
            }
          >
            <Plus className="size-4" /> Add milestone
          </Button>
          <div className="border-t pt-6">
            <label className="grid gap-2 text-sm font-medium">
              Beliefs heading
              <Input
                value={settings.about.beliefsTitle}
                onChange={(e) => setAbout({ beliefsTitle: e.target.value })}
              />
            </label>
            <label className="mt-4 grid gap-2 text-sm font-medium">
              Beliefs introduction
              <Textarea
                rows={3}
                value={settings.about.beliefsIntro}
                onChange={(e) => setAbout({ beliefsIntro: e.target.value })}
              />
            </label>
            <div className="mt-4 space-y-3">
              {settings.about.beliefs.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_2fr_auto]"
                >
                  <Input
                    aria-label="Belief title"
                    value={item.title}
                    onChange={(e) =>
                      setAbout({
                        beliefs: settings.about.beliefs.map((current) =>
                          current.id === item.id ? { ...current, title: e.target.value } : current,
                        ),
                      })
                    }
                  />
                  <Textarea
                    aria-label="Belief description"
                    rows={2}
                    value={item.body}
                    onChange={(e) =>
                      setAbout({
                        beliefs: settings.about.beliefs.map((current) =>
                          current.id === item.id ? { ...current, body: e.target.value } : current,
                        ),
                      })
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={settings.about.beliefs.length === 1}
                    aria-label="Remove belief"
                    onClick={() =>
                      setAbout({
                        beliefs: settings.about.beliefs.filter((current) => current.id !== item.id),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              className="mt-4"
              variant="outline"
              onClick={() =>
                setAbout({
                  beliefs: [
                    ...settings.about.beliefs,
                    { id: crypto.randomUUID(), title: "", body: "" },
                  ],
                })
              }
            >
              <Plus className="size-4" /> Add belief
            </Button>
          </div>
        </div>
      </details>

      <details className="rounded-2xl border bg-background">
        <summary className="cursor-pointer px-5 py-4 font-display text-xl">
          Visit page content
        </summary>
        <div className="space-y-6 border-t p-5">
          <ImageField
            label="Visit page hero image"
            value={settings.visit.heroImagePath}
            disabled={disabled}
            onUpload={(file) => void upload(file, (path) => setVisit({ heroImagePath: path }))}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Hero eyebrow
              <Input
                value={settings.visit.heroEyebrow}
                onChange={(e) => setVisit({ heroEyebrow: e.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Hero title
              <Input
                value={settings.visit.heroTitle}
                onChange={(e) => setVisit({ heroTitle: e.target.value })}
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Hero subtitle
            <Textarea
              rows={2}
              value={settings.visit.heroSubtitle}
              onChange={(e) => setVisit({ heroSubtitle: e.target.value })}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Introduction eyebrow
              <Input
                value={settings.visit.introEyebrow}
                onChange={(e) => setVisit({ introEyebrow: e.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Introduction heading
              <Input
                value={settings.visit.introTitle}
                onChange={(e) => setVisit({ introTitle: e.target.value })}
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Introduction body
            <Textarea
              rows={4}
              value={settings.visit.introBody}
              onChange={(e) => setVisit({ introBody: e.target.value })}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Expectations heading
            <Input
              value={settings.visit.expectationsTitle}
              onChange={(e) => setVisit({ expectationsTitle: e.target.value })}
            />
          </label>
          <div className="space-y-3">
            {settings.visit.expectations.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_auto]">
                <Textarea
                  aria-label={`Expectation ${index + 1}`}
                  rows={2}
                  value={item}
                  onChange={(e) =>
                    setVisit({
                      expectations: settings.visit.expectations.map((current, currentIndex) =>
                        currentIndex === index ? e.target.value : current,
                      ),
                    })
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={settings.visit.expectations.length === 1}
                  aria-label="Remove expectation"
                  onClick={() =>
                    setVisit({
                      expectations: settings.visit.expectations.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setVisit({ expectations: [...settings.visit.expectations, ""] })}
          >
            <Plus className="size-4" /> Add expectation
          </Button>
          <label className="grid gap-2 text-sm font-medium">
            FAQ heading
            <Input
              value={settings.visit.faqTitle}
              onChange={(e) => setVisit({ faqTitle: e.target.value })}
            />
          </label>
          <div className="space-y-3">
            {settings.visit.faqs.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_2fr_auto]"
              >
                <Input
                  aria-label="Question"
                  value={item.question}
                  onChange={(e) =>
                    setVisit({
                      faqs: settings.visit.faqs.map((current) =>
                        current.id === item.id ? { ...current, question: e.target.value } : current,
                      ),
                    })
                  }
                />
                <Textarea
                  aria-label="Answer"
                  rows={2}
                  value={item.answer}
                  onChange={(e) =>
                    setVisit({
                      faqs: settings.visit.faqs.map((current) =>
                        current.id === item.id ? { ...current, answer: e.target.value } : current,
                      ),
                    })
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={settings.visit.faqs.length === 1}
                  aria-label="Remove question"
                  onClick={() =>
                    setVisit({
                      faqs: settings.visit.faqs.filter((current) => current.id !== item.id),
                    })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setVisit({
                faqs: [
                  ...settings.visit.faqs,
                  { id: crypto.randomUUID(), question: "", answer: "" },
                ],
              })
            }
          >
            <Plus className="size-4" /> Add question
          </Button>
          <div className="grid gap-4 border-t pt-6 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Closing heading
              <Input
                value={settings.visit.closingTitle}
                onChange={(e) => setVisit({ closingTitle: e.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Closing message
              <Textarea
                rows={2}
                value={settings.visit.closingBody}
                onChange={(e) => setVisit({ closingBody: e.target.value })}
              />
            </label>
          </div>
        </div>
      </details>

      <details className="rounded-2xl border bg-background">
        <summary className="cursor-pointer px-5 py-4 font-display text-xl">
          Directory page introductions
        </summary>
        <div className="grid gap-5 border-t p-5 xl:grid-cols-2">
          {(
            [
              ["ministries", "Ministries"],
              ["events", "Events"],
              ["sermons", "Sermons"],
              ["gallery", "Gallery"],
              ["contact", "Contact"],
              ["give", "Give"],
            ] as const
          ).map(([key, label]) => {
            const page = settings.pages[key];
            return (
              <fieldset key={key} className="space-y-3 rounded-xl border p-4">
                <legend className="px-2 font-display text-lg">{label}</legend>
                <ImageField
                  label={`${label} hero image`}
                  value={page.imagePath}
                  disabled={disabled}
                  onUpload={(file) =>
                    void upload(file, (path) => setPage(key, { imagePath: path }))
                  }
                />
                <label className="grid gap-2 text-sm font-medium">
                  Eyebrow
                  <Input
                    value={page.eyebrow}
                    onChange={(event) => setPage(key, { eyebrow: event.target.value })}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Heading
                  <Input
                    value={page.title}
                    onChange={(event) => setPage(key, { title: event.target.value })}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Introduction
                  <Textarea
                    rows={3}
                    value={page.subtitle}
                    onChange={(event) => setPage(key, { subtitle: event.target.value })}
                  />
                </label>
              </fieldset>
            );
          })}
        </div>
      </details>
    </div>
  );
}
