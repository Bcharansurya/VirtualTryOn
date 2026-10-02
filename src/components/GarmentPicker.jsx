import { GARMENTS } from "../data/garments";

/** Row of built-in garment thumbnails. Highlights the active garment. */
export default function GarmentPicker({ selectedSrc, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {GARMENTS.map((garment) => (
        <button
          key={garment.id}
          type="button"
          onClick={() => onSelect(garment)}
          aria-pressed={selectedSrc === garment.src}
          className={`rounded-lg border p-2 text-center text-xs transition ${
            selectedSrc === garment.src ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"
          }`}
        >
          <img src={garment.src} alt="" className="mx-auto h-12 object-contain" />
          <span className="mt-1 block">{garment.label}</span>
        </button>
      ))}
    </div>
  );
}
