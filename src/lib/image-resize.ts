// Runs in the browser. Phone photos are often 4–10 MB; shrinking them before upload
// keeps uploads fast on mobile data and well under the server's size limit.

const MAX_SIDE = 1600;
const QUALITY = 0.82;

/**
 * Returns a JPEG no larger than 1600 px on its longest side. Also drops EXIF data
 * (including GPS location) because the canvas only copies pixels. Falls back to the
 * original file if the browser can't decode it.
 */
export async function shrinkImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    // "from-image" applies the EXIF rotation, so portrait photos stay upright
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  return blob ?? file;
}
