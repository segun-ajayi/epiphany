export type PublicMinistry = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  meetingSchedule: string | null;
  meetingLocation: string | null;
  leaderName: string | null;
  leaderTitle: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  audience: string | null;
  whatToExpect: string | null;
  joinInstructions: string | null;
  image: string;
  imageAlt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type EventRegistrationStatus = "not_required" | "closed" | "open" | "full";

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  venueName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  locality: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string;
  registrationStatus: EventRegistrationStatus;
  capacity: number | null;
  contactName: string | null;
  contactEmail: string | null;
  image: string;
  imageAlt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type PublicSermon = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  speaker: string;
  sermonDate: string;
  scripture: string;
  series: string | null;
  topic: string | null;
  youtubeUrl: string | null;
  audioUrl: string | null;
  notesUrl: string | null;
  durationSeconds: number | null;
  image: string;
  imageAlt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type PublicGalleryPhoto = {
  id: string;
  image: string;
  thumbnail: string;
  width: number | null;
  height: number | null;
  imageAlt: string;
  caption: string | null;
  featured: boolean;
};

export type PublicGalleryAlbum = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  eventDate: string | null;
  relatedEventSlug: string | null;
  relatedMinistrySlug: string | null;
  coverImage: string;
  coverThumbnail: string;
  coverWidth: number | null;
  coverHeight: number | null;
  coverImageAlt: string;
  photoCount: number;
  photos: PublicGalleryPhoto[];
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};
