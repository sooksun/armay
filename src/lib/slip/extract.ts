"use client";

import { parseSlipText, refFromQrPayload, type SlipData } from "@/lib/slip/parse";

export type SlipExtract = SlipData & { via: string[] };

const OCR_TIMEOUT_MS = 60_000; // tha+eng: first run downloads both models (cached in IndexedDB after)

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

async function pdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const parts: string[] = [];
  for (let p = 1; p <= Math.min(doc.numPages, 3); p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    parts.push(content.items.map((it) => ("str" in it ? it.str : "")).join(" "));
  }
  return parts.join("\n");
}

async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

async function qrReference(canvas: HTMLCanvasElement): Promise<string | undefined> {
  const { default: jsQR } = await import("jsqr");
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const qr = jsQR(img.data, img.width, img.height);
  return qr?.data ? refFromQrPayload(qr.data) : undefined;
}

async function ocrText(canvas: HTMLCanvasElement, lang: "tha" | "eng"): Promise<string> {
  // Two dedicated passes beat "tha+eng": the mixed model reads Thai months as
  // latin lookalikes ("ก.ค." -> "n.n."). tha-pass nails Thai dates/labels,
  // eng-pass nails latin refs. Models are fetched lazily from the tesseract.js
  // CDN on first use, then cached in IndexedDB.
  const Tesseract = (await import("tesseract.js")).default;
  const result = await withTimeout(Tesseract.recognize(canvas, lang), OCR_TIMEOUT_MS);
  return result.data.text ?? "";
}

/**
 * Best-effort extraction of amount / transfer date / reference from a slip file.
 * PDF -> embedded text layer; image -> mini-QR (reference) + OCR (amount/date).
 * Never throws — returns whatever could be read, with `via` naming the sources used.
 */
export async function extractFromSlipFile(file: File): Promise<SlipExtract> {
  const via: string[] = [];
  let data: SlipData = {};

  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    try {
      data = parseSlipText(await pdfText(file));
      if (data.amount || data.dateBE || data.reference) via.push("PDF");
    } catch (e) {
      console.error("[slip] pdf extract failed", e);
    }
    return { ...data, via };
  }

  try {
    const canvas = await fileToCanvas(file);
    try {
      const ref = await qrReference(canvas);
      if (ref) {
        data.reference = ref;
        via.push("QR");
      }
    } catch (e) {
      console.error("[slip] qr decode failed", e);
    }
    try {
      // pass 1 — tha: Thai date + labeled amount
      const tha = parseSlipText(await ocrText(canvas, "tha"));
      if (tha.amount) data.amount = tha.amount;
      if (tha.dateBE) data.dateBE = tha.dateBE;
      if (!data.reference && tha.reference) data.reference = tha.reference;
      if (tha.amount || tha.dateBE) via.push("OCR-ไทย");
      // pass 2 — eng: only when something is still missing (usually a latin ref with no QR)
      if (!data.amount || !data.dateBE || !data.reference) {
        const eng = parseSlipText(await ocrText(canvas, "eng"));
        if (!data.amount && eng.amount) data.amount = eng.amount;
        if (!data.dateBE && eng.dateBE) data.dateBE = eng.dateBE;
        if (!data.reference && eng.reference) data.reference = eng.reference;
        if (eng.amount || eng.dateBE || eng.reference) via.push("OCR-eng");
      }
    } catch (e) {
      console.error("[slip] ocr failed", e);
    }
  } catch (e) {
    console.error("[slip] image load failed", e);
  }
  return { ...data, via };
}
