/** Vercel serverless entry point for POST /api/tryon. */
import { runTryOn, toErrorResponse } from "../server/tryon.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    return res.status(200).json(await runTryOn(req.body ?? {}));
  } catch (err) {
    const { status, body } = toErrorResponse(err);
    return res.status(status).json(body);
  }
}
