import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Hero from "./components/Hero";
import UploadForm from "./components/UploadForm";

function parseBlobError(blob) {
  return blob.text().then((text) => {
    try {
      const payload = JSON.parse(text);
      return payload.error || "Upload failed.";
    } catch {
      return "Upload failed.";
    }
  });
}

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Choose a PDF first.");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await axios.post("/api/chunk-pdf", formData, {
        responseType: "blob"
      });

      const zipBlob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.replace(/\.pdf$/i, "") || "document"}-chapters.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess("Your ZIP was generated with one file per chapter.");
    } catch (requestError) {
      if (requestError?.response?.data instanceof Blob) {
        const message = await parseBlobError(requestError.response.data);
        setError(message);
      } else {
        setError("Could not process this file right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-sand-100 text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-5 sm:py-10">
        <Hero />

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6 rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <UploadForm
            file={file}
            setFile={setFile}
            loading={loading}
            onSubmit={handleSubmit}
          />

          {loading ? (
            <p className="mt-4 flex items-center gap-2 text-base font-medium text-brand-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing PDF and creating chapter files...
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-base text-rose-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-base text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              {success}
            </p>
          ) : null}
        </motion.section>
      </div>
    </main>
  );
}
