"use client";

import { parseSlipText, refFromQrPayload, type SlipData } from "@/lib/slip/parse";

export type SlipExtract = SlipData & { via: string[] };

const OCR_TIMEOUT_MS = 25_000;

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

async function ocrText(canvas: HTMLCanvasElement): Promise<string> {
  // eng model reads the digits/latin parts of Thai slips (amount, date, ref);
  // model files are fetched lazily from the tesseract.js CDN on first use.
  const Tesseract = (await import("tesseract.js")).default;
  const result = await withTimeout(Tesseract.recognize(canvas, "eng"), OCR_TIMEOUT_MS);
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
      const parsed = parseSlipText(await ocrText(canvas));
      if (parsed.amount) data.amount = parsed.amount;
      if (parsed.dateBE) data.dateBE = parsed.dateBE;
      if (!data.reference && parsed.reference) data.reference = parsed.reference;
      if (parsed.amount || parsed.dateBE) via.push("OCR");
    } catch (e) {
      console.error("[slip] ocr failed", e);
    }
  } catch (e) {
    console.error("[slip] image load failed", e);
  }
  return { ...data, via };
}
