import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { CHURCH, IMAGES, SERVICE_TIMES } from "@/data/church";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="container-page py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative grid place-items-center size-16 rounded-full shadow-elegant">
              <img src={IMAGES.logo} />
              {/*<span className="absolute inset-0 rounded-full ring-1 ring-gold/60" aria-hidden />*/}
            </span>
            <div>
              <p className="font-display text-lg leading-tight">{CHURCH.name}</p>
              <p className="text-xs uppercase tracking-[0.18em] opacity-70">{CHURCH.shortName}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed opacity-80">{CHURCH.tagline}</p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={CHURCH.social.facebook}
              aria-label="Facebook"
              className="size-9 grid place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground transition-colors"
            >
              <Facebook className="size-4" />
            </a>
            <a
              href={CHURCH.social.instagram}
              aria-label="Instagram"
              className="size-9 grid place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground transition-colors"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href={CHURCH.social.youtube}
              aria-label="YouTube"
              className="size-9 grid place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground transition-colors"
            >
              <Youtube className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg text-gold">Visit Us</h4>
          <ul className="mt-4 space-y-3 text-sm opacity-90">
            <li className="flex gap-3">
              <MapPin className="size-4 mt-0.5 shrink-0 text-gold" />
              <span>{CHURCH.address}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="size-4 mt-0.5 shrink-0 text-gold" />
              <a href={`tel:${CHURCH.phone}`}>{CHURCH.phone}</a>
            </li>
            <li className="flex gap-3">
              <Mail className="size-4 mt-0.5 shrink-0 text-gold" />
              <a href={`mailto:${CHURCH.email}`}>{CHURCH.email}</a>
            </li>
          </ul>
        </div>

        {/*<div>*/}
        {/*  <h4 className="font-display text-lg text-gold">Service Times</h4>*/}
        {/*  <ul className="mt-4 space-y-3 text-sm opacity-90">*/}
        {/*    {SERVICE_TIMES.map((s) => (*/}
        {/*      <li key={s.title}>*/}
        {/*        <p className="font-medium text-primary-foreground">*/}
        {/*          {s.day} · {s.time}*/}
        {/*        </p>*/}
        {/*        <p className="opacity-70">{s.title}</p>*/}
        {/*      </li>*/}
        {/*    ))}*/}
        {/*  </ul>*/}
        {/*</div>*/}

        <div>
          <h4 className="font-display text-lg text-gold">Quick Links</h4>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm opacity-90">
            <li>
              <Link to="/about" className="hover:text-gold">
                About
              </Link>
            </li>
            <li>
              <Link to="/ministries" className="hover:text-gold">
                Ministries
              </Link>
            </li>
            <li>
              <Link to="/sermons" className="hover:text-gold">
                Sermons
              </Link>
            </li>
            <li>
              <Link to="/events" className="hover:text-gold">
                Events
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="hover:text-gold">
                Gallery
              </Link>
            </li>
            <li>
              <Link to="/give" className="hover:text-gold">
                Give
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-gold">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs opacity-70">
          <p>
            © {new Date().getFullYear()} {CHURCH.name}. All rights reserved.
          </p>
          <p>"Arise, shine, for your light has come." — Isaiah 60:1</p>
        </div>
      </div>
    </footer>
  );
}
