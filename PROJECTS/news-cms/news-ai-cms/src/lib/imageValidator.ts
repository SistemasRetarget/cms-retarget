import sharp from "sharp";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_PIXELS = 50_000_000; // 50 MP — blocks decompression bombs
const ALLOWED_FORMATS = new Set(["jpeg", "jpg", "png", "webp", "avif", "gif"]);

export interface ImageValidationResult {
  ok: boolean;
  error?: string;
  meta?: {
    format: string;
    width: number;
    height: number;
    size: number;
  };
}

export async function validateImageBuffer(
  buffer: Buffer,
  declaredMime?: string
): Promise<ImageValidationResult> {
  if (!buffer || buffer.length === 0) {
    return { ok: false, error: "Empty file" };
  }
  if (buffer.length > MAX_BYTES) {
    return { ok: false, error: `File exceeds ${MAX_BYTES} bytes` };
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer, { failOn: "error" }).metadata();
  } catch (e) {
    return { ok: false, error: `Invalid image: ${(e as Error).message}` };
  }

  const format = meta.format?.toLowerCase();
  if (!format || !ALLOWED_FORMATS.has(format)) {
    return { ok: false, error: `Unsupported format: ${format || "unknown"}` };
  }

  // Cross-check MIME type matches actual format (detect mislabeled files)
  if (declaredMime) {
    const mimeFormat = declaredMime.split("/")[1]?.toLowerCase();
    if (mimeFormat && mimeFormat !== format && !(mimeFormat === "jpg" && format === "jpeg")) {
      return {
        ok: false,
        error: `MIME type ${declaredMime} does not match actual format ${format}`,
      };
    }
  }

  const { width = 0, height = 0 } = meta;
  if (width === 0 || height === 0) {
    return { ok: false, error: "Image has zero dimensions" };
  }
  if (width * height > MAX_PIXELS) {
    return { ok: false, error: `Image exceeds ${MAX_PIXELS} pixels (decompression bomb guard)` };
  }

  return {
    ok: true,
    meta: { format, width, height, size: buffer.length },
  };
}
