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
