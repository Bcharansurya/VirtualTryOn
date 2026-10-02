/**
 * Server-side try-on logic, shared by the local Express server (server/index.js)
 * and the Vercel serverless function (api/tryon.js).
 *
 * The Hugging Face token lives only here (process.env.HF_TOKEN), so it is never
 * shipped to the browser.
 */
import { Client } from "@gradio/client";

const SPACE = process.env.HF_SPACE || "yisol/IDM-VTON";
const MAX_DATA_URL_CHARS = 4_000_000; // roughly 3 MB of image bytes after base64
const DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,/;

/** An error that carries the HTTP status the API should answer with. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Convert an HttpError (or anything else) to a { status, body } pair. */
export function toErrorResponse(err) {
  if (err instanceof HttpError) {
    return { status: err.status, body: { error: err.message } };
  }
  console.error("Unexpected error:", err);
  return { status: 500, body: { error: "Unexpected server error." } };
}

/** Validate a base64 data URL coming from the browser and turn it into a Blob. */
function dataUrlToBlob(dataUrl, fieldName) {
  if (typeof dataUrl !== "string" || dataUrl.length > MAX_DATA_URL_CHARS) {
    throw new HttpError(400, `Invalid or oversized "${fieldName}" image.`);
  }
  const match = DATA_URL_PATTERN.exec(dataUrl);
  if (!match) {
    throw new HttpError(400, `"${fieldName}" must be a JPEG, PNG or WebP image.`);
  }
  const bytes = Buffer.from(dataUrl.slice(match[0].length), "base64");
  return new Blob([bytes], { type: match[1] });
}

/**
 * Ask the Hugging Face Space to dress the person in the garment.
 * @param {{ person: string, garment: string, description?: string }} body
 * @returns {Promise<{ image: string }>} the result as a base64 data URL
 */
export async function runTryOn({ person, garment, description = "" }) {
  const personBlob = dataUrlToBlob(person, "person");
  const garmentBlob = dataUrlToBlob(garment, "garment");

  let result;
  try {
    const options = process.env.HF_TOKEN ? { hf_token: process.env.HF_TOKEN } : {};
    const app = await Client.connect(SPACE, options);

    // Parameter order matches the IDM-VTON Space. If you switch Spaces, copy the
    // endpoint name and parameters from the "Use via API" link on that Space.
    result = await app.predict("/tryon", [
      { background: personBlob, layers: [], composite: null },
      garmentBlob,
      String(description).slice(0, 100) || "garment",
      true, // auto-masking
      false, // auto-crop
      30, // denoising steps
      42, // seed
    ]);
  } catch (err) {
    console.error("Hugging Face call failed:", err?.message ?? err);
    throw new HttpError(
      502,
      "The AI model is busy or unavailable. Please try again, or use manual placement."
    );
  }

  const output = result?.data?.[0];
  const url = typeof output === "string" ? output : output?.url;
  if (!url) {
    throw new HttpError(502, "The AI model returned no image.");
  }

  // Fetch the image server-side and return it inline, which avoids CORS problems in the browser.
  const imageResponse = await fetch(url);
  if (!imageResponse.ok) {
    throw new HttpError(502, "Could not download the generated image.");
  }
  const type = imageResponse.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  return { image: `data:${type};base64,${buffer.toString("base64")}` };
}
