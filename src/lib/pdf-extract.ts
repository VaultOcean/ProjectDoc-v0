/**
 * Server-side PDF text extraction using pdfjs-dist legacy build.
 * The legacy build runs in Node without requiring DOM APIs (DOMMatrix etc.).
 */

export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    // Legacy build works in Node.js environments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs");

    const data = new Uint8Array(buffer);
    const pdf = await pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      // Disable worker — run on the main thread (Node has no Web Worker)
      disableWorker: true,
    }).promise;

    const pageTexts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Reconstruct lines using the y-coordinate of each text item so the
      // output keeps a readable layout instead of one long run-on string.
      const items = textContent.items as Array<{
        str: string;
        transform: number[];
      }>;

      let lastY: number | null = null;
      let line = "";
      const lines: string[] = [];

      for (const item of items) {
        const y = item.transform[5];
        if (lastY === null || Math.abs(y - lastY) < 3) {
          line += item.str + " ";
        } else {
          if (line.trim()) lines.push(line.trim());
          line = item.str + " ";
        }
        lastY = y;
      }
      if (line.trim()) lines.push(line.trim());

      const pageText = lines.join("\n");
      if (pageText.trim().length > 0) {
        pageTexts.push(
          pdf.numPages > 1 ? `[Page ${i}]\n${pageText}` : pageText
        );
      }
    }

    return pageTexts.join("\n\n");
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "";
  }
}

/** A single positioned word/run on a page, in top-left pixel coordinates. */
export interface LayoutItem {
  x: number;
  y: number;
  w: number;
  h: number;
  str: string;
}

export interface LayoutPage {
  width: number;
  height: number;
  items: LayoutItem[];
}

/**
 * Extract each text run WITH its bounding box so the client can render a
 * layout-accurate, clickable preview. PDF coordinates have a bottom-left
 * origin; we convert to top-left (CSS) pixels at scale 1.
 */
export async function extractPdfLayout(
  buffer: ArrayBuffer
): Promise<LayoutPage[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs");

    const data = new Uint8Array(buffer);
    const pdf = await pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      disableWorker: true,
    }).promise;

    const pages: LayoutPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();

      const items: LayoutItem[] = [];
      for (const it of textContent.items as Array<{
        str: string;
        transform: number[];
        width: number;
        height: number;
      }>) {
        const str = it.str;
        if (!str || !str.trim()) continue;
        const x = it.transform[4];
        const baselineY = it.transform[5];
        const h = it.height || Math.abs(it.transform[3]) || 10;
        const w = it.width || str.length * h * 0.5;
        // Convert baseline (bottom-left origin) to top-left box origin.
        const yTop = viewport.height - baselineY - h;
        items.push({
          x: Math.round(x * 100) / 100,
          y: Math.round(yTop * 100) / 100,
          w: Math.round(w * 100) / 100,
          h: Math.round(h * 100) / 100,
          str,
        });
      }

      pages.push({
        width: Math.round(viewport.width),
        height: Math.round(viewport.height),
        items,
      });
    }

    return pages;
  } catch (error) {
    console.error("PDF layout extraction error:", error);
    return [];
  }
}
