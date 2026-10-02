# Virtual Try-On

A React web app where you upload a photo, pick a clothing item or accessory, and either place it yourself (drag, resize, rotate) or let an AI model on Hugging Face dress you in it.

**Live demo:** https://YOUR-APP.vercel.app  (replace after deploying)

## Features

- Photo and garment upload with validation (type, size, minimum dimensions, corrupt files)
- **Manual mode:** drag, resize and rotate an overlay on the photo, using canvas handles or sliders; works on touch screens
- **AI mode:** sends the photo and garment to a Hugging Face Space (IDM-VTON) through a small server-side proxy
- Automatic guidance to manual mode if the AI model is busy or times out
- Download the final image as a PNG
- Responsive layout (Tailwind CSS)

## Architecture

```
Browser (React + Konva)
   |  POST /api/tryon  { person, garment }   (JPEG data URLs, downscaled in the browser)
   v
Proxy: server/index.js (local) or api/tryon.js (Vercel)
   |  holds HF_TOKEN, validates input, rate limits
   v
Hugging Face Space (IDM-VTON) via @gradio/client
```

The Hugging Face token exists only on the server (`process.env.HF_TOKEN`). It is never bundled into the browser code.

## Project structure

```
api/tryon.js             Vercel serverless entry point
server/tryon.js          Shared try-on logic (validation + Hugging Face call)
server/index.js          Local Express server for development
src/App.jsx              Page layout and state
src/components/          UploadZone, GarmentPicker, CanvasEditor, ResultPreview
src/hooks/useTryOn.js    Request state, timeout and cancellation for the AI call
src/utils/               Image validation and canvas helpers
src/data/garments.js     Built-in dummy overlays
public/garments/         SVG overlays (t-shirt, glasses, cap)
```

## Setup

Requirements: Node.js 18 or newer.

```bash
git clone https://github.com/YOUR-USERNAME/virtual-try-on.git
cd virtual-try-on
npm install
cp .env.example .env      # then add your Hugging Face token
npm run dev
```

Open http://localhost:5173. The React app runs on port 5173 and the API proxy on 8787.

### Environment variables

| Name | Purpose |
| --- | --- |
| `HF_TOKEN` | Free Hugging Face access token (https://huggingface.co/settings/tokens) |
| `HF_SPACE` | Space to call, default `yisol/IDM-VTON` |
| `PORT` | Local proxy port, default `8787` |

`.env` is git-ignored. Only `.env.example` is committed.

## Using a different Space

Open the Space on Hugging Face, click **Use via API** at the bottom, and copy the endpoint name and parameter list into `runTryOn` in `server/tryon.js`. Community Spaces change over time, so check that the Space is running before relying on it.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New > Project** and import the repo (Vercel detects Vite).
3. Under **Settings > Environment Variables**, add `HF_TOKEN` (and optionally `HF_SPACE`).
4. Deploy. Put the resulting URL at the top of this README.

`vercel.json` allows the API function to run up to 60 seconds, because AI try-on can be slow.

## Limitations

- Free-tier Spaces queue requests and can sleep, so AI results may take 10 to 60 seconds or fail. Manual mode is the fallback.
- Manual mode places a flat overlay. It does not warp the garment to the body.
- The built-in garments are simple illustrations. Real garment photos work best in AI mode, and transparent PNGs work best in manual mode.

## Troubleshooting

- **"AI model is busy or unavailable":** retry later, or check that the Space is running and the endpoint in `server/tryon.js` matches its API page.
- **Download is blank in manual mode:** make sure the photo has finished loading before pressing Download.
- **Rate limit errors:** the proxy allows 5 requests per minute per client (edit `server/index.js` to change it).
