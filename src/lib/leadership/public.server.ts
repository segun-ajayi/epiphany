import { getContentDatabase } from "../db/d1.server.ts";
import type { PublicLeader } from "./schemas.ts";

type LeaderRow = {
  id: string;
  name: string;
  role: string;
  bio: string;
  email: string | null;
  phone: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  photo_path: string | null;
  photo_alt: string | null;
};

export async function listPublishedLeaders(): Promise<PublicLeader[]> {
  const db = await getContentDatabase();
  try {
    const rows = await db
      .prepare(
        `SELECT id, name, role, bio, email, phone, facebook_url,
      instagram_url, linkedin_url, photo_path, photo_alt FROM leaders
      WHERE status = 'published' AND published_at <= ? ORDER BY display_order, name LIMIT 100`,
      )
      .bind(new Date().toISOString())
      .all<LeaderRow>();
    return rows.results.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      bio: row.bio,
      email: row.email,
      phone: row.phone,
      facebookUrl: row.facebook_url,
      instagramUrl: row.instagram_url,
      linkedinUrl: row.linkedin_url,
      photo: row.photo_path,
      photoAlt: row.photo_alt || row.name,
    }));
  } catch {
    throw new Error("Leadership information is temporarily unavailable.");
  }
}
