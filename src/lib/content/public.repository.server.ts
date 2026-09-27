import { IMAGES, MINISTRIES } from "@/data/church";
import { getContentDatabase } from "@/lib/db/d1.server";

import type { PublicEvent, PublicGalleryAlbum, PublicMinistry, PublicSermon } from "./public.types";

type MinistryRow = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  meeting_schedule: string | null;
  meeting_location: string | null;
  leader_name: string | null;
  leader_title: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  audience: string | null;
  what_to_expect: string | null;
  join_instructions: string | null;
  image_path: string | null;
  image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

type EventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  venue_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  locality: string | null;
  region: string | null;
  postal_code: string | null;
  country_code: string;
  registration_status: PublicEvent["registrationStatus"];
  capacity: number | null;
  contact_name: string | null;
  contact_email: string | null;
  image_path: string | null;
  image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

type SermonRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  speaker: string;
  sermon_date: string;
  scripture: string;
  series: string | null;
  topic: string | null;
  youtube_url: string | null;
  audio_url: string | null;
  notes_url: string | null;
  duration_seconds: number | null;
  image_path: string | null;
  image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

type GalleryAlbumRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  event_date: string | null;
  related_event_slug: string | null;
  related_ministry_slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
  cover_image: string | null;
  cover_thumbnail: string | null;
  cover_width: number | null;
  cover_height: number | null;
  cover_alt: string | null;
  photo_count: number;
};

type GalleryPhotoRow = {
  id: string;
  image_path: string;
  thumbnail_path: string | null;
  image_width: number | null;
  image_height: number | null;
  image_alt: string;
  caption: string | null;
  featured: number;
};

const legacyMinistryBySlug = new Map(MINISTRIES.map((ministry) => [ministry.id, ministry]));

function ministryImage(slug: string, imagePath: string | null) {
  return imagePath || legacyMinistryBySlug.get(slug)?.image || IMAGES.congregation;
}

function mapMinistry(row: MinistryRow): PublicMinistry {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    description: row.description,
    meetingSchedule: row.meeting_schedule,
    meetingLocation: row.meeting_location,
    leaderName: row.leader_name,
    leaderTitle: row.leader_title,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    audience: row.audience,
    whatToExpect: row.what_to_expect,
    joinInstructions: row.join_instructions,
    image: ministryImage(row.slug, row.image_path),
    imageAlt: row.image_alt || row.name,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row: EventRow): PublicEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    category: row.category,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone,
    venueName: row.venue_name,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    locality: row.locality,
    region: row.region,
    postalCode: row.postal_code,
    countryCode: row.country_code,
    registrationStatus: row.registration_status,
    capacity: row.capacity,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    image: row.image_path || IMAGES.churchExterior,
    imageAlt: row.image_alt || row.title,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
  };
}

function mapSermon(row: SermonRow): PublicSermon {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    speaker: row.speaker,
    sermonDate: row.sermon_date,
    scripture: row.scripture,
    series: row.series,
    topic: row.topic,
    youtubeUrl: row.youtube_url,
    audioUrl: row.audio_url,
    notesUrl: row.notes_url,
    durationSeconds: row.duration_seconds,
    image: row.image_path || IMAGES.bible,
    imageAlt: row.image_alt || row.title,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
  };
}

export async function listPublishedMinistries(): Promise<PublicMinistry[]> {
  const database = await getContentDatabase();

  try {
    const now = new Date().toISOString();
    const result = await database
      .prepare(
        `SELECT id, slug, name, summary, description, meeting_schedule, meeting_location,
                leader_name, leader_title, contact_email, contact_phone, audience,
                what_to_expect, join_instructions, image_path, image_alt, seo_title,
                seo_description, updated_at
           FROM ministries
          WHERE status = 'published' AND published_at <= ?
          ORDER BY display_order ASC, name ASC
          LIMIT 100`,
      )
      .bind(now)
      .all<MinistryRow>();

    return result.results.map(mapMinistry);
  } catch {
    throw new Error("Ministry content is temporarily unavailable.");
  }
}

export async function getPublishedMinistry(slug: string): Promise<PublicMinistry | null> {
  const database = await getContentDatabase();

  try {
    const row = await database
      .prepare(
        `SELECT id, slug, name, summary, description, meeting_schedule, meeting_location,
                leader_name, leader_title, contact_email, contact_phone, audience,
                what_to_expect, join_instructions, image_path, image_alt, seo_title,
                seo_description, updated_at
           FROM ministries
          WHERE slug = ? AND status = 'published' AND published_at <= ?
          LIMIT 1`,
      )
      .bind(slug, new Date().toISOString())
      .first<MinistryRow>();

    return row ? mapMinistry(row) : null;
  } catch {
    throw new Error("Ministry content is temporarily unavailable.");
  }
}

export async function listPublishedSermons(): Promise<PublicSermon[]> {
  const database = await getContentDatabase();

  try {
    const result = await database
      .prepare(
        `SELECT id, slug, title, summary, description, speaker, sermon_date, scripture,
                series, topic, youtube_url, audio_url, notes_url, duration_seconds,
                image_path, image_alt, seo_title, seo_description, updated_at
           FROM sermons
          WHERE status = 'published' AND published_at <= ?
          ORDER BY sermon_date DESC, published_at DESC
          LIMIT 200`,
      )
      .bind(new Date().toISOString())
      .all<SermonRow>();
    return result.results.map(mapSermon);
  } catch {
    throw new Error("Sermon content is temporarily unavailable.");
  }
}

export async function getPublishedSermon(slug: string): Promise<PublicSermon | null> {
  const database = await getContentDatabase();

  try {
    const row = await database
      .prepare(
        `SELECT id, slug, title, summary, description, speaker, sermon_date, scripture,
                series, topic, youtube_url, audio_url, notes_url, duration_seconds,
                image_path, image_alt, seo_title, seo_description, updated_at
           FROM sermons
          WHERE slug = ? AND status = 'published' AND published_at <= ?
          LIMIT 1`,
      )
      .bind(slug, new Date().toISOString())
      .first<SermonRow>();
    return row ? mapSermon(row) : null;
  } catch {
    throw new Error("Sermon content is temporarily unavailable.");
  }
}

export async function listPublishedEvents(): Promise<PublicEvent[]> {
  const database = await getContentDatabase();

  try {
    const now = new Date().toISOString();
    const result = await database
      .prepare(
        `SELECT id, slug, title, summary, description, category, starts_at, ends_at, timezone,
                venue_name, address_line_1, address_line_2, locality, region, postal_code,
                country_code, registration_status, capacity, contact_name, contact_email,
                image_path, image_alt, seo_title, seo_description, updated_at
           FROM events
          WHERE status = 'published'
            AND published_at <= ?
            AND COALESCE(ends_at, starts_at) >= ?
          ORDER BY starts_at ASC
          LIMIT 100`,
      )
      .bind(now, now)
      .all<EventRow>();

    return result.results.map(mapEvent);
  } catch {
    throw new Error("Event content is temporarily unavailable.");
  }
}

export async function getPublishedEvent(slug: string): Promise<PublicEvent | null> {
  const database = await getContentDatabase();

  try {
    const row = await database
      .prepare(
        `SELECT id, slug, title, summary, description, category, starts_at, ends_at, timezone,
                venue_name, address_line_1, address_line_2, locality, region, postal_code,
                country_code, registration_status, capacity, contact_name, contact_email,
                image_path, image_alt, seo_title, seo_description, updated_at
           FROM events
          WHERE slug = ? AND status = 'published' AND published_at <= ?
          LIMIT 1`,
      )
      .bind(slug, new Date().toISOString())
      .first<EventRow>();

    return row ? mapEvent(row) : null;
  } catch {
    throw new Error("Event content is temporarily unavailable.");
  }
}

function mapGalleryAlbum(row: GalleryAlbumRow, photos: GalleryPhotoRow[] = []): PublicGalleryAlbum {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    eventDate: row.event_date,
    relatedEventSlug: row.related_event_slug,
    relatedMinistrySlug: row.related_ministry_slug,
    coverImage: row.cover_image || IMAGES.congregation,
    coverThumbnail: row.cover_thumbnail || row.cover_image || IMAGES.congregation,
    coverWidth: row.cover_width,
    coverHeight: row.cover_height,
    coverImageAlt: row.cover_alt || row.title,
    photoCount: row.photo_count,
    photos: photos.map((photo) => ({
      id: photo.id,
      image: photo.image_path,
      thumbnail: photo.thumbnail_path || photo.image_path,
      width: photo.image_width,
      height: photo.image_height,
      imageAlt: photo.image_alt,
      caption: photo.caption,
      featured: Boolean(photo.featured),
    })),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
  };
}

const galleryAlbumSelect = `SELECT a.id, a.slug, a.title, a.summary, a.description, a.event_date,
  CASE WHEN EXISTS (SELECT 1 FROM events e WHERE e.slug = a.related_event_slug
    AND e.status = 'published' AND e.published_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    THEN a.related_event_slug ELSE NULL END AS related_event_slug,
  CASE WHEN EXISTS (SELECT 1 FROM ministries m WHERE m.slug = a.related_ministry_slug
    AND m.status = 'published' AND m.published_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    THEN a.related_ministry_slug ELSE NULL END AS related_ministry_slug,
  a.seo_title, a.seo_description, a.updated_at,
  (SELECT p.image_path FROM gallery_photos p WHERE p.album_id = a.id
    ORDER BY p.featured DESC, p.display_order, p.created_at LIMIT 1) AS cover_image,
  (SELECT COALESCE(p.thumbnail_path, p.image_path) FROM gallery_photos p WHERE p.album_id = a.id
    ORDER BY p.featured DESC, p.display_order, p.created_at LIMIT 1) AS cover_thumbnail,
  (SELECT p.image_width FROM gallery_photos p WHERE p.album_id = a.id
    ORDER BY p.featured DESC, p.display_order, p.created_at LIMIT 1) AS cover_width,
  (SELECT p.image_height FROM gallery_photos p WHERE p.album_id = a.id
    ORDER BY p.featured DESC, p.display_order, p.created_at LIMIT 1) AS cover_height,
  (SELECT p.image_alt FROM gallery_photos p WHERE p.album_id = a.id
    ORDER BY p.featured DESC, p.display_order, p.created_at LIMIT 1) AS cover_alt,
  (SELECT COUNT(*) FROM gallery_photos p WHERE p.album_id = a.id) AS photo_count
  FROM gallery_albums a`;

export async function listPublishedGalleryAlbums(): Promise<PublicGalleryAlbum[]> {
  const database = await getContentDatabase();
  try {
    const rows = await database
      .prepare(
        `${galleryAlbumSelect}
      WHERE a.status = 'published' AND a.published_at <= ?
      ORDER BY a.display_order, a.event_date DESC, a.published_at DESC LIMIT 100`,
      )
      .bind(new Date().toISOString())
      .all<GalleryAlbumRow>();
    return rows.results.map((row) => mapGalleryAlbum(row));
  } catch {
    throw new Error("Gallery content is temporarily unavailable.");
  }
}

export async function getPublishedGalleryAlbum(slug: string): Promise<PublicGalleryAlbum | null> {
  const database = await getContentDatabase();
  try {
    const album = await database
      .prepare(
        `${galleryAlbumSelect}
      WHERE a.slug = ? AND a.status = 'published' AND a.published_at <= ? LIMIT 1`,
      )
      .bind(slug, new Date().toISOString())
      .first<GalleryAlbumRow>();
    if (!album) return null;
    const photos = await database
      .prepare(
        `SELECT id, image_path, thumbnail_path, image_width, image_height, image_alt, caption, featured
      FROM gallery_photos WHERE album_id = ? ORDER BY featured DESC, display_order, created_at`,
      )
      .bind(album.id)
      .all<GalleryPhotoRow>();
    return mapGalleryAlbum(album, photos.results);
  } catch {
    throw new Error("Gallery content is temporarily unavailable.");
  }
}
