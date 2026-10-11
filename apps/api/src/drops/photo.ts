import { BadRequestException } from "@nestjs/common";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export type ImageMime = "image/jpeg" | "image/png" | "image/webp";

export interface UploadedPhoto {
  buffer: Buffer;
  size: number;
  mimetype: string;
}

export function asUploadedPhoto(file: unknown): UploadedPhoto | undefined {
  if (!file || typeof file !== "object") return undefined;
  if (!("buffer" in file) || !("size" in file) || !("mimetype" in file)) return undefined;
  const candidate = file as { buffer: unknown; size: unknown; mimetype: unknown };
  if (!Buffer.isBuffer(candidate.buffer)) return undefined;
  if (typeof candidate.size !== "number") return undefined;
  if (typeof candidate.mimetype !== "string") return undefined;
  return {
    buffer: candidate.buffer,
    size: candidate.size,
    mimetype: candidate.mimetype,
  };
}

export function sniffImage(buffer: Buffer): ImageMime | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function extensionFor(mime: ImageMime): "jpg" | "png" | "webp" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function requireImage(photo: UploadedPhoto | undefined, required: boolean): ImageMime | null {
  if (!photo) {
    if (required) throw new BadRequestException("A photo of what you found is required.");
    return null;
  }
  if (photo.size <= 0 || photo.size > MAX_PHOTO_BYTES) {
    throw new BadRequestException("Photos must be 5 MB or smaller.");
  }
  const sniffed = sniffImage(photo.buffer);
  if (!sniffed) {
    throw new BadRequestException("Use a JPEG, PNG, or WebP photo from the camera.");
  }
  return sniffed;
}
