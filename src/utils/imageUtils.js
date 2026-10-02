/** Small, dependency-free helpers for working with images in the browser. */

/** Read a File or Blob as a base64 data URL. */
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/** Load an image from any URL (object URL, data URL or path). */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image."));
    img.src = src;
  });
}

/**
 * Shrink an image so it fits inside maxWidth x maxHeight and return it as a data URL.
 * Smaller uploads are faster and stay within the serverless request size limit.
 * Transparent areas are painted white when exporting as JPEG.
 */
export async function downscaleToDataURL(src, maxWidth = 768, maxHeight = 1024, type = "image/jpeg", quality = 0.9) {
  const img = await loadImage(src);
  const ratio = Math.min(1, maxWidth / img.width, maxHeight / img.height);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);

  const ctx = canvas.getContext("2d");
  if (type === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(type, quality);
}

/** Trigger a browser download for a data URL or object URL. */
export function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
