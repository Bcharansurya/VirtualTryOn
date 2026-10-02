import { useState } from "react";
import UploadZone from "./components/UploadZone";
import GarmentPicker from "./components/GarmentPicker";
import CanvasEditor from "./components/CanvasEditor";
import ResultPreview from "./components/ResultPreview";
import useTryOn from "./hooks/useTryOn";
import { GARMENTS } from "./data/garments";
import { fileToDataURL } from "./utils/imageUtils";

const MODES = [
  { id: "manual", label: "Manual placement" },
  { id: "ai", label: "AI try-on" },
];

export default function App() {
  const [personSrc, setPersonSrc] = useState(null);
  const [garment, setGarment] = useState(GARMENTS[0]);
  const [mode, setMode] = useState("manual");
  const tryOn = useTryOn();

  async function handlePersonFile(file) {
    setPersonSrc(await fileToDataURL(file));
    tryOn.reset();
  }

  async function handleGarmentFile(file) {
    // Uploaded garments get a sensible default size on the canvas.
    setGarment({ id: "custom", label: "Your item", src: await fileToDataURL(file), widthRatio: 0.5 });
  }

  function runAiTryOn() {
    tryOn.run({ personSrc, garmentSrc: garment.src, description: garment.label });
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Virtual Try-On</h1>
        <p className="text-sm text-slate-600">Upload a photo, choose an item, then place it yourself or let the AI do it.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <section>
            <h2 className="mb-2 text-sm font-semibold">1. Your photo</h2>
            <UploadZone label="Upload a photo" hint="JPG, PNG or WebP, up to 8 MB" preview={personSrc} onFile={handlePersonFile} />
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">2. Clothing or accessory</h2>
            <GarmentPicker selectedSrc={garment.src} onSelect={setGarment} />
            <UploadZone label="Or upload your own item" hint="A transparent PNG works best for manual placement" onFile={handleGarmentFile} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">3. Mode</h2>
            <div className="grid grid-cols-2 gap-2" role="tablist">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === m.id}
                  onClick={() => setMode(m.id)}
                  className={`rounded px-3 py-2 text-sm ${mode === m.id ? "bg-blue-600 text-white" : "border border-slate-300 bg-white"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main>
          {!personSrc ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
              Upload a photo to get started.
            </div>
          ) : mode === "manual" ? (
            <CanvasEditor personSrc={personSrc} garment={garment} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                The AI model works best with a clear photo of the garment (not a cartoon icon). Results can take up to a minute.
              </p>
              <button
                type="button"
                onClick={runAiTryOn}
                disabled={tryOn.status === "loading"}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {tryOn.status === "loading" ? "Working..." : "Generate AI try-on"}
              </button>
              <ResultPreview status={tryOn.status} image={tryOn.image} error={tryOn.error} />
              {tryOn.status === "error" && (
                <button type="button" onClick={() => setMode("manual")} className="text-sm text-blue-700 underline">
                  Switch to manual placement
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
