import "server-only";
import { detectImageType } from "@/lib/rooms";

export type UploadedImage = { data: Buffer; contentType: string };

/**
 * Reads one image from a multipart request. The type comes from the file's first
 * bytes, never from the browser, so an SVG or HTML file can't pose as a photo.
 */
export async function readImageUpload(
  request: Request,
  field: string,
  maxBytes: number,
): Promise<UploadedImage | "too-large" | "not-image"> {
  // Reject early when the browser says the body is too big (plus room for headers)
  const declared = Number(request.headers.get("content-length"));
  if (declared > maxBytes + 64 * 1024) return "too-large";

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get(field);
  } catch {
    return "not-image";
  }
  if (!(file instanceof File)) return "not-image";
  if (file.size > maxBytes) return "too-large";

  const data = Buffer.from(await file.arrayBuffer());
  const contentType = detectImageType(data);
  if (!contentType) return "not-image";
  return { data, contentType };
}
