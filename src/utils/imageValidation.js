import { loadImage } from "./imageUtils";

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const MIN_SIDE_PX = 256;

/**
 * Check that a user-selected file is a usable image.
 * @param {File | undefined} file
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function validateImageFile(file) {
  if (!file) {
    return { ok: false, error: "No file selected." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Please choose a JPG, PNG or WebP image." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `Image is too large. The maximum size is ${MAX_BYTES / 1024 / 1024} MB.` };
  }

  // Decode the image to catch corrupt files and images that are too small to work with.
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    if (Math.min(img.width, img.height) < MIN_SIDE_PX) {
      return { ok: false, error: `Image is too small. Each side must be at least ${MIN_SIDE_PX}px.` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "This file could not be read as an image." };
  } finally {
    URL.revokeObjectURL(url);
  }
}
