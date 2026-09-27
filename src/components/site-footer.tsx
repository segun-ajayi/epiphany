import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { IMAGES } from "@/data/church";
import { formatSiteAddress, type SiteSettings } from "@/lib/site-settings/schemas";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const address = formatSiteAddress(settings);
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="container-page py-16 grid gap-12 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative grid place-items-center size-16 rounded-full shadow-elegant">
              <img
                src={settings.logoImagePath || IMAGES.logo}
                alt=""
                width={512}
                height={512}
                loading="lazy"
              />
              {/*<span className="absolute inset-0 rounded-full ring-1 ring-gold/60" aria-hidden />*/}
            </span>
            <div>
              <p className="font-display text-lg leading-tight">{settings.churchName}</p>
              <p className="text-xs uppercase tracking-[0.18em] opacity-70">{settings.shortName}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed opacity-80">{settings.tagline}</p>
          <div className="mt-5 flex items-center gap-3">
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                aria-label="Facebook"
                className="size-9 grid place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground transition-colors"
              >
                <Facebook className="size-4" />
              </a>
            )}
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                aria-label="Instagram"
                className="size-9 grid place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground transition-colors"
              >
                <Instagram className="size-4" />
              </a>
            )}
            {settings.youtubeUrl && (
              <a
                href={settings.youtubeUrl}
                aria-label="YouTube"
                className="size-9 grid place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground transition-colors"
              >
                <Youtube className="size-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg text-gold">Visit Us</h4>
          <ul className="mt-4 space-y-3 text-sm opacity-90">
            <li className="flex gap-3">
              <MapPin className="size-4 mt-0.5 shrink-0 text-gold" />
              <span>{address}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="size-4 mt-0.5 shrink-0 text-gold" />
              <a href={`tel:${settings.phone}`}>{settings.phone}</a>
            </li>
            <li className="flex gap-3">
              <Mail className="size-4 mt-0.5 shrink-0 text-gold" />
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg text-gold">Service Times</h4>
          <ul className="mt-4 space-y-3 text-sm opacity-90">
            {settings.serviceTimes.map((service) => (
              <li key={service.id}>
                <p className="font-medium text-primary-foreground">
                  {service.day} · {service.time}
                </p>
                <p className="opacity-70">{service.title}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg text-gold">Quick Links</h4>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm opacity-90">
            <li>
              <Link to="/visit" className="hover:text-gold">
                Plan Your Visit
              </Link>
            </li>
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
            © {new Date().getFullYear()} {settings.churchName}. All rights reserved.
          </p>
          <p>{settings.footerQuote}</p>
        </div>
      </div>
    </footer>
  );
}
