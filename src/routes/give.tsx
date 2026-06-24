import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Sprout, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_GIVE, IMAGES } from "@/data/church";
import { PageHero } from "./about";

export const Route = createFileRoute("/give")({
  head: () => ({
    meta: [
      { title: "Give — Anglican Church of Epiphany" },
      {
        name: "description",
        content:
          "Support the mission of Anglican Church of Epiphany. Give a one-time or recurring gift online.",
      },
      { property: "og:url", content: "/give" },
    ],
    links: [{ rel: "canonical", href: "/give" }],
  }),
  component: GivePage,
});

const AMOUNTS = [25, 50, 100, 250, 500];
const DESIGNATIONS = [
  "General Fund",
  "Missions",
  "Building Fund",
  "Youth Ministry",
  "Outreach Programs",
];

function GivePage() {
  const [type, setType] = useState<"one" | "recurring">("one");
  const [amount, setAmount] = useState<number | "">(100);
  const [custom, setCustom] = useState("");
  const [designation, setDesignation] = useState(DESIGNATIONS[0]);

  const handleDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    // Payment logic will be implemented later
    alert(
      `Thank you! Donation of $${custom || amount} (${type}) to ${designation} – payment integration pending.`,
    );
  };

  return (
    <>
      <PageHero
        eyebrow="Generosity"
        title="Support the Mission"
        subtitle="Your generosity helps us serve our community and share God's love."
        image={IMAGES.bible}
      />

      <section className="container-page py-16">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
          <div className="rounded-3xl border border-border bg-card p-8 md:p-10 space-y-8 shadow-elegant">
            <h2 className="font-display text-2xl">Zelle: acerichmondtx28@gmail.com</h2>
            <h2 className="font-display text-2xl">CashApp: $acerichmondtx28</h2>
          </div>
          {/*<form*/}
          {/*  onSubmit={handleDonation}*/}
          {/*  className="rounded-3xl border border-border bg-card p-8 md:p-10 space-y-8 shadow-elegant"*/}
          {/*>*/}
          {/*  <div>*/}
          {/*    <h2 className="font-display text-2xl">Donation type</h2>*/}
          {/*    <div className="mt-3 grid grid-cols-2 gap-3">*/}
          {/*      {(["one", "recurring"] as const).map((t) => (*/}
          {/*        <button*/}
          {/*          key={t}*/}
          {/*          type="button"*/}
          {/*          onClick={() => setType(t)}*/}
          {/*          className={`rounded-xl border p-4 text-left transition ${*/}
          {/*            type === t ? "border-gold bg-gold/10" : "border-border hover:bg-accent"*/}
          {/*          }`}*/}
          {/*        >*/}
          {/*          <p className="font-display text-lg">{t === "one" ? "One-Time" : "Recurring"}</p>*/}
          {/*          <p className="text-xs text-muted-foreground">*/}
          {/*            {t === "one" ? "A single gift" : "Monthly or weekly"}*/}
          {/*          </p>*/}
          {/*        </button>*/}
          {/*      ))}*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*  <div>*/}
          {/*    <h2 className="font-display text-2xl">Amount</h2>*/}
          {/*    <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">*/}
          {/*      {AMOUNTS.map((a) => (*/}
          {/*        <button*/}
          {/*          key={a}*/}
          {/*          type="button"*/}
          {/*          onClick={() => {*/}
          {/*            setAmount(a);*/}
          {/*            setCustom("");*/}
          {/*          }}*/}
          {/*          className={`rounded-lg border py-3 font-medium transition ${*/}
          {/*            amount === a && !custom*/}
          {/*              ? "border-gold bg-gold/15 text-foreground"*/}
          {/*              : "border-border hover:bg-accent"*/}
          {/*          }`}*/}
          {/*        >*/}
          {/*          ${a}*/}
          {/*        </button>*/}
          {/*      ))}*/}
          {/*    </div>*/}
          {/*    <div className="mt-3 relative max-w-xs">*/}
          {/*      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">*/}
          {/*        $*/}
          {/*      </span>*/}
          {/*      <Input*/}
          {/*        value={custom}*/}
          {/*        onChange={(e) => {*/}
          {/*          setCustom(e.target.value);*/}
          {/*          setAmount("");*/}
          {/*        }}*/}
          {/*        placeholder="Custom amount"*/}
          {/*        inputMode="numeric"*/}
          {/*        className="pl-7"*/}
          {/*      />*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*  <div>*/}
          {/*    <h2 className="font-display text-2xl">Designation</h2>*/}
          {/*    <select*/}
          {/*      value={designation}*/}
          {/*      onChange={(e) => setDesignation(e.target.value)}*/}
          {/*      className="mt-3 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"*/}
          {/*    >*/}
          {/*      {DESIGNATIONS.map((d) => (*/}
          {/*        <option key={d}>{d}</option>*/}
          {/*      ))}*/}
          {/*    </select>*/}
          {/*  </div>*/}
          {/*  <div>*/}
          {/*    <h2 className="font-display text-2xl">Your information</h2>*/}
          {/*    <div className="mt-3 grid sm:grid-cols-2 gap-3">*/}
          {/*      <Input required placeholder="First name" aria-label="First name" />*/}
          {/*      <Input required placeholder="Last name" aria-label="Last name" />*/}
          {/*      <Input*/}
          {/*        required*/}
          {/*        type="email"*/}
          {/*        placeholder="Email"*/}
          {/*        aria-label="Email"*/}
          {/*        className="sm:col-span-2"*/}
          {/*      />*/}
          {/*      <Input*/}
          {/*        type="tel"*/}
          {/*        placeholder="Phone"*/}
          {/*        aria-label="Phone"*/}
          {/*        className="sm:col-span-2"*/}
          {/*      />*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground bg-secondary/40">*/}
          {/*    Payment fields will appear here once the payment provider is integrated.*/}
          {/*  </div>*/}
          {/*  <Button type="submit" variant="gold" size="lg" className="w-full">*/}
          {/*    <Heart className="size-4" /> Donate ${custom || amount || 0}*/}
          {/*  </Button>*/}
          {/*</form>*/}
          {/* IMPACT */}
          <aside className="space-y-6">
            <h2 className="font-display text-2xl">Your impact</h2>
            {[
              { icon: Heart, amount: "$25", text: "Feeds a family through our food pantry." },
              { icon: Sprout, amount: "$100", text: "Supports youth programs for a month." },
              { icon: Users, amount: "$500", text: "Funds an outreach initiative across Houston." },
            ].map((it) => (
              <Card key={it.amount} className="p-6 flex gap-4 items-start">
                <span className="size-12 grid place-items-center rounded-full bg-gold/20 text-gold-foreground shrink-0">
                  <it.icon className="size-5 text-burgundy" />
                </span>
                <div>
                  <p className="font-display text-2xl text-foreground">{it.amount}</p>
                  <p className="text-sm text-muted-foreground">{it.text}</p>
                </div>
              </Card>
            ))}
          </aside>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl text-center">Giving FAQ</h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQ_GIVE.map((f, i) => (
              <AccordionItem key={f.q} value={`g${i}`}>
                <AccordionTrigger className="font-display text-lg text-left">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
