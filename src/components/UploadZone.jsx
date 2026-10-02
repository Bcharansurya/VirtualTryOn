import { useRef, useState } from "react";
import { validateImageFile } from "../utils/imageValidation";

/**
 * Click-or-drop image picker with validation.
 * Calls onFile(file) only for files that pass validateImageFile.
 */
export default function UploadZone({ label, hint, preview, onFile }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function handleFile(file) {
    const result = await validateImageFile(file);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    onFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files[0]);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-4 text-center transition ${
          dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400"
        }`}
      >
        {preview ? (
          <img src={preview} alt="Selected upload" className="max-h-32 rounded object-contain" />
        ) : (
          <span className="text-2xl" aria-hidden="true">+</span>
        )}
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-slate-500">{hint}</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }}
      />

      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
