import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import archiver from "archiver";
import { PassThrough } from "stream";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

const CHAPTER_PATTERNS = [
  /^\s*(chapter|ch\.)\s+([0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\b[^\n]*/im,
  /^\s*part\s+([0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\b[^\n]*/im
];

function safeName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "chapter";
}

function detectChapterTitle(pageText) {
  const scanZone = pageText.slice(0, 2200);
  for (const pattern of CHAPTER_PATTERNS) {
    const match = scanZone.match(pattern);
    if (match?.[0]) {
      return match[0].trim().replace(/\s+/g, " ").slice(0, 80);
    }
  }
  return null;
}

async function extractPages(pdfBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({ pageNumber, text });
  }

  return pages;
}

function splitIntoChapters(pages) {
  const starts = [];
  let lastTitle = "";
  let lastIndex = -99;

  for (let i = 0; i < pages.length; i += 1) {
    const title = detectChapterTitle(pages[i].text);
    if (!title) continue;
    if (title.toLowerCase() === lastTitle.toLowerCase()) continue;
    if (i - lastIndex < 1) continue;

    starts.push({ index: i, title });
    lastTitle = title;
    lastIndex = i;
  }

  if (starts.length === 0) {
    return [
      {
        title: "Document",
        text: pages.map((page) => page.text).join("\n\n")
      }
    ];
  }

  if (starts[0].index > 0) {
    starts.unshift({ index: 0, title: "Front Matter" });
  }

  const chapters = [];
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i].index;
    const end = i + 1 < starts.length ? starts[i + 1].index : pages.length;
    const text = pages.slice(start, end).map((page) => page.text).join("\n\n");
    chapters.push({ title: starts[i].title, text });
  }

  return chapters;
}

async function buildZip(chapters) {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();
  const chunks = [];

  stream.on("data", (chunk) => chunks.push(chunk));

  const done = new Promise((resolve, reject) => {
    stream.on("end", resolve);
    archive.on("error", reject);
  });

  archive.pipe(stream);
  const manifest = [];

  chapters.forEach((chapter, chapterIndex) => {
    const chapterText = chapter.text.trim() || "No extractable text found for this chapter.";
    const fileName = `${String(chapterIndex + 1).padStart(2, "0")}-${safeName(chapter.title)}.txt`;
    const content = `${chapter.title}\n\n${chapterText}`;
    manifest.push(`${fileName}: 1 chapter file`);
    archive.append(content, { name: fileName });
  });

  archive.append(manifest.join("\n"), { name: "manifest.txt" });
  await archive.finalize();
  await done;
  return Buffer.concat(chunks);
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chunk-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a PDF file." });
    }

    const looksLikePdf =
      req.file.mimetype === "application/pdf" || req.file.originalname.toLowerCase().endsWith(".pdf");
    if (!looksLikePdf) {
      return res.status(400).json({ error: "Only PDF files are supported." });
    }

    const pages = await extractPages(req.file.buffer);
    if (!pages.length) {
      return res.status(400).json({ error: "No extractable pages were found in that PDF." });
    }

    const chapters = splitIntoChapters(pages);
    const zip = await buildZip(chapters);
    const baseName = path.parse(req.file.originalname).name || "document";

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName(baseName)}-chapters.zip"`);
    return res.send(zip);
  } catch (error) {
    console.error("PDF chunking failed:", error);
    return res.status(500).json({ error: "Failed to process PDF. Try another file or smaller PDF." });
  }
});

app.post("/api/__via/telemetry", (req, res) => {
  const logDir = "/var/log/via";
  fs.mkdirSync(logDir, { recursive: true });
  const events = Array.isArray(req.body) ? req.body : [req.body];
  for (const event of events) {
    const line = JSON.stringify(event) + "\n";
    fs.appendFileSync(path.join(logDir, "telemetry.jsonl"), line);
    if (event.type === "error" || (event.type === "console" && event.level === "error")) {
      fs.appendFileSync(path.join(logDir, "errors.jsonl"), line);
    }
  }
  res.json({ ok: true });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Maximum size is 30MB." });
  }
  if (error) {
    console.error("Unexpected server error:", error);
    return res.status(500).json({ error: "Unexpected upload failure." });
  }
  return next();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Express listening on :${PORT}`));
