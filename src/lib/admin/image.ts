const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSourceBytes = 12 * 1024 * 1024;
export const maxImageBytes = 1_250_000;
export const maxGalleryImageBytes = 500_000;
export const maxGalleryThumbnailBytes = 100_000;

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== "image/webp") {
          reject(new Error("This browser could not prepare the image as WebP."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

export async function prepareImageUpload(file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Choose a JPG, PNG or WebP image.");
  }
  if (file.size > maxSourceBytes) {
    throw new Error("Choose an image smaller than 12 MB.");
  }

  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file);
  } catch {
    throw new Error("The selected image could not be opened.");
  }

  try {
    const initialScale = Math.min(1, 1800 / image.width, 1350 / image.height);
    for (const resize of [1, 0.82, 0.68, 0.56]) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * initialScale * resize));
      canvas.height = Math.max(1, Math.round(image.height * initialScale * resize));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("The browser could not prepare this image.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.86, 0.76, 0.66]) {
        const blob = await canvasBlob(canvas, quality);
        if (blob.size <= maxImageBytes) {
          const base = file.name.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_-]+/g, "-");
          return new File([blob], `${base || "image"}.webp`, { type: "image/webp" });
        }
      }
    }
  } finally {
    image.close();
  }

  throw new Error("The image is still too large after optimization. Choose a smaller image.");
}

async function optimizedVariant(
  image: ImageBitmap,
  fileName: string,
  maxDimension: number,
  targetBytes: number,
  label: string,
) {
  const initialScale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  for (const resize of [1, 0.88, 0.76, 0.64, 0.54]) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * initialScale * resize));
    canvas.height = Math.max(1, Math.round(image.height * initialScale * resize));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The browser could not prepare this image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.72, 0.64, 0.56]) {
      const blob = await canvasBlob(canvas, quality);
      if (blob.size <= targetBytes) {
        const base = fileName.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_-]+/g, "-");
        return {
          file: new File([blob], `${base || "image"}-${label}.webp`, { type: "image/webp" }),
          width: canvas.width,
          height: canvas.height,
        };
      }
    }
  }
  throw new Error(`The ${label} image is still too large. Choose a less detailed image.`);
}

export async function prepareGalleryImageUpload(file: File) {
  if (!allowedTypes.has(file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > maxSourceBytes) throw new Error("Choose an image smaller than 12 MB.");
  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file);
  } catch {
    throw new Error("The selected image could not be opened.");
  }
  try {
    const [full, thumbnail] = await Promise.all([
      optimizedVariant(image, file.name, 1600, maxGalleryImageBytes, "gallery"),
      optimizedVariant(image, file.name, 640, maxGalleryThumbnailBytes, "thumbnail"),
    ]);
    return {
      image: full.file,
      thumbnail: thumbnail.file,
      width: full.width,
      height: full.height,
    };
  } finally {
    image.close();
  }
}
