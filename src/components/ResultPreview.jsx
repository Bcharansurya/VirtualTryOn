import { triggerDownload } from "../utils/imageUtils";

/** Shows the state of an AI try-on request: loading, error, or the finished image. */
export default function ResultPreview({ status, image, error }) {
  if (status === "loading") {
    return (
      <div role="status" className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg bg-white p-6 text-center shadow">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-sm text-slate-600">Generating your try-on. This can take up to a minute on the free tier.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (status === "done" && image) {
    return (
      <div className="space-y-3 rounded-lg bg-white p-3 shadow">
        <img src={image} alt="AI try-on result" className="mx-auto max-h-[70vh] rounded" />
        <button
          type="button"
          onClick={() => triggerDownload(image, "virtual-try-on-ai.png")}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Download result
        </button>
      </div>
    );
  }

  return null;
}
