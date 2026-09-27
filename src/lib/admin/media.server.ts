import type { SqlDatabase } from "../db/sql.types.ts";
import { getDatabase } from "../db/runtime.server.ts";
import { AdminError } from "../auth/permissions.ts";

export const maxImageBytes = 1_250_000;
export const maxPdfBytes = 1_250_000;
export const maxMultipartBytes = 2_700_000;

export type UploadedImage = {
  id: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  bytes: ArrayBuffer;
  byteSize: number;
};

export type UploadedPdf = {
  id: string;
  contentType: "application/pdf";
  bytes: ArrayBuffer;
  byteSize: number;
};

function detectedContentType(bytes: Uint8Array): UploadedImage["contentType"] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

export async function validateImageUpload(value: FormDataEntryValue | null) {
  if (value === null) return null;
  if (!(value instanceof File) || value.size === 0) {
    throw new AdminError(400, "invalid_image", "Choose an image to upload.");
  }
  if (value.size > maxImageBytes) {
    throw new AdminError(413, "image_too_large", "The optimized image must be under 1.25 MB.");
  }
  const bytes = await value.arrayBuffer();
  const contentType = detectedContentType(new Uint8Array(bytes));
  if (!contentType) {
    throw new AdminError(400, "invalid_image", "Choose a valid JPG, PNG or WebP image.");
  }
  return {
    id: crypto.randomUUID(),
    contentType,
    bytes,
    byteSize: bytes.byteLength,
  } satisfies UploadedImage;
}

export async function validatePdfUpload(value: FormDataEntryValue | null) {
  if (value === null) return null;
  if (!(value instanceof File) || value.size === 0) {
    throw new AdminError(400, "invalid_pdf", "Choose a PDF file to upload.");
  }
  if (value.size > maxPdfBytes) {
    throw new AdminError(413, "pdf_too_large", "The sermon notes PDF must be under 1.25 MB.");
  }
  const bytes = await value.arrayBuffer();
  const signature = new TextDecoder("ascii").decode(new Uint8Array(bytes).slice(0, 5));
  if (signature !== "%PDF-") {
    throw new AdminError(400, "invalid_pdf", "Choose a valid PDF document.");
  }
  return {
    id: crypto.randomUUID(),
    contentType: "application/pdf",
    bytes,
    byteSize: bytes.byteLength,
  } satisfies UploadedPdf;
}

export function mediaPath(id: string) {
  return `/media/${id}`;
}

export function mediaIdFromPath(path: string | null | undefined) {
  return path?.match(
    /^\/media\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i,
  )?.[1];
}

type MediaRow = {
  content_type: UploadedImage["contentType"] | UploadedPdf["contentType"];
  body: ArrayBuffer | Uint8Array;
  byte_size: number;
};

function responseBody(body: MediaRow["body"]) {
  if (body instanceof ArrayBuffer) return body;
  return Uint8Array.from(body).buffer;
}

export async function handlePublicMedia(request: Request, id: string) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  if (!mediaIdFromPath(`/media/${id}`)) return new Response("Not found", { status: 404 });

  const db: SqlDatabase = await getDatabase(request);
  const row = await db
    .prepare("SELECT content_type, body, byte_size FROM media_assets WHERE id = ?")
    .bind(id)
    .first<MediaRow>();
  if (!row) return new Response("Not found", { status: 404 });

  const etag = `"${id}"`;
  const headers = new Headers({
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Length": String(row.byte_size),
    "Content-Type": row.content_type,
    "Cross-Origin-Resource-Policy": "same-origin",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  });
  if (request.headers.get("if-none-match") === etag) {
    headers.delete("Content-Length");
    return new Response(null, { status: 304, headers });
  }
  return new Response(request.method === "HEAD" ? null : responseBody(row.body), { headers });
}
