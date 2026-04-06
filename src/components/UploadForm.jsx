import clsx from "clsx";
import { UploadCloud, Zap } from "lucide-react";

export default function UploadForm({ file, setFile, chunkSize, setChunkSize, loading, onSubmit }) {
  const onPickFile = (event) => {
    const next = event.target.files?.[0] || null;
    setFile(next);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="pdfFile"
          className="mb-2 block text-base font-semibold text-slate-800"
        >
          PDF file
        </label>
        <label
          htmlFor="pdfFile"
          className={clsx(
            "flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-4 text-center transition-all duration-200",
            file
              ? "border-brand-300 bg-brand-50 text-brand-700"
              : "border-slate-300 bg-slate-50 text-slate-600 hover:border-brand-300 hover:bg-brand-50/70"
          )}
        >
          <UploadCloud className="h-7 w-7" />
          <span className="mt-2 text-base font-medium">
            {file ? file.name : "Tap to choose a PDF"}
          </span>
          <span className="mt-1 text-base">{file ? `${Math.round(file.size / 1024)} KB` : "Only .pdf files"}</span>
        </label>
        <input
          id="pdfFile"
          type="file"
          accept="application/pdf,.pdf"
          onChange={onPickFile}
          className="sr-only"
        />
      </div>

      <div>
        <label htmlFor="chunkSize" className="mb-2 block text-base font-semibold text-slate-800">
          Chunk size (characters)
        </label>
        <input
          id="chunkSize"
          type="number"
          min={1500}
          max={50000}
          step={500}
          value={chunkSize}
          onChange={(event) => setChunkSize(Number(event.target.value) || 12000)}
          className="min-h-[44px] w-full rounded-xl border border-slate-200 px-4 py-2 text-base text-slate-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-base font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Zap className="h-5 w-5" />
        {loading ? "Building ZIP..." : "Create Chapter ZIP"}
      </button>
    </form>
  );
}
