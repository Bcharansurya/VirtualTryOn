import { useCallback, useRef, useState } from "react";
import { downscaleToDataURL } from "../utils/imageUtils";

const TIMEOUT_MS = 120_000; // free-tier Spaces can take a while to wake up

const IDLE = { status: "idle", image: null, error: "" };

/**
 * Calls the /api/tryon proxy and tracks its progress.
 * status is one of: "idle" | "loading" | "done" | "error".
 */
export default function useTryOn() {
  const [state, setState] = useState(IDLE);
  const controllerRef = useRef(null);

  const run = useCallback(async ({ personSrc, garmentSrc, description }) => {
    controllerRef.current?.abort(); // cancel any request that is still running
    const controller = new AbortController();
    controllerRef.current = controller;
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    setState({ status: "loading", image: null, error: "" });
    try {
      const [person, garment] = await Promise.all([
        downscaleToDataURL(personSrc),
        downscaleToDataURL(garmentSrc),
      ]);

      const response = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person, garment, description }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status}).`);
      }
      setState({ status: "done", image: data.image, error: "" });
    } catch (err) {
      if (controllerRef.current !== controller) return; // a newer request replaced this one
      const message = controller.signal.aborted
        ? "The model took too long to respond. Try again, or use manual placement."
        : err.message;
      setState({ status: "error", image: null, error: message });
    } finally {
      clearTimeout(timer);
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setState(IDLE);
  }, []);

  return { ...state, run, reset };
}
