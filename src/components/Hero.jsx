import { motion } from "framer-motion";
import { FileArchive, FileText } from "lucide-react";

export default function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 p-6 text-white shadow-lg sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-white/20 p-2">
          <FileArchive className="h-6 w-6" />
        </span>
        <p className="text-base font-semibold tracking-wide text-white/90">PDF Chapter Chunker</p>
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Upload a PDF. Get a chapter-split ZIP.</h1>
      <p className="mt-3 text-base leading-relaxed text-white/90">
        We detect chapter starts and export each chapter as one text file in a single ZIP download.
      </p>
      <div className="mt-5 flex items-center gap-2 text-base text-white/90">
        <FileText className="h-5 w-5" />
        Supports large PDFs up to 30MB.
      </div>
    </motion.section>
  );
}
