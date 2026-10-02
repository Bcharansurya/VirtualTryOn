/** Local development API. In production the same logic runs in api/tryon.js. */
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import { runTryOn, toErrorResponse } from "./tryon.js";

const app = express();
const PORT = process.env.PORT || 8787;

app.use(express.json({ limit: "10mb" }));

// Free-tier Spaces have small quotas, so keep clients to a few requests per minute.
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: true, legacyHeaders: false }));

app.post("/api/tryon", async (req, res) => {
  try {
    res.json(await runTryOn(req.body ?? {}));
  } catch (err) {
    const { status, body } = toErrorResponse(err);
    res.status(status).json(body);
  }
});

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
