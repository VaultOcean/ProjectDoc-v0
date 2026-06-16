interface ExportField {
  name: string;
  value: string;
  encrypted?: boolean;
  isPii?: boolean;
  verified?: boolean;
}

/**
 * Generate CSV content from fields
 */
export function generateCSV(fields: ExportField[]): string {
  const headers = fields.map((f) => `"${f.name.replace(/"/g, '""')}"`).join(",");
  const values = fields
    .map((f) => `"${f.value.replace(/"/g, '""')}"`)
    .join(",");
  return `${headers}\n${values}`;
}

/**
 * Generate Excel-like TSV (Tab-Separated Values)
 * Can be opened in Excel directly
 */
export function generateTSV(fields: ExportField[]): string {
  const headers = fields.map((f) => f.name).join("\t");
  const values = fields.map((f) => f.value).join("\t");
  const metadata = fields
    .map(
      (f) =>
        `${f.encrypted ? "[🔒]" : ""} ${f.isPii ? "[⚠️]" : ""} ${f.verified ? "[✓]" : ""}`.trim()
    )
    .join("\t");

  return `${headers}\n${values}\n${metadata}`;
}

/**
 * Generate JSON export
 */
export function generateJSON(fields: ExportField[]): string {
  const jsonData = fields.map((f) => ({
    field: f.name,
    value: f.value,
    encrypted: f.encrypted || false,
    pii: f.isPii || false,
    verified: f.verified || false,
    exportedAt: new Date().toISOString(),
  }));

  return JSON.stringify(jsonData, null, 2);
}

/**
 * Generate HTML table for preview/printing
 */
export function generateHTML(
  fields: ExportField[],
  fileName: string
): string {
  const rows = fields
    .map(
      (f) =>
        `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${f.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${f.value}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          ${f.encrypted ? "🔒" : "-"}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          ${f.isPii ? "⚠️" : "-"}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          ${f.verified ? "✓" : "-"}
        </td>
      </tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fileName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; }
    th { background-color: #f2f2f2; padding: 12px; text-align: left; border: 1px solid #ddd; }
    td { padding: 8px; border: 1px solid #ddd; }
    .metadata { color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>${fileName}</h1>
  <table>
    <thead>
      <tr>
        <th>Field Name</th>
        <th>Value</th>
        <th>Encrypted</th>
        <th>PII</th>
        <th>Verified</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="metadata">
    <p>Exported: ${new Date().toLocaleString()}</p>
    <p>Total Fields: ${fields.length}</p>
    <p>Encrypted Fields: ${fields.filter((f) => f.encrypted).length}</p>
    <p>PII Fields: ${fields.filter((f) => f.isPii).length}</p>
  </div>
</body>
</html>`;
}

/**
 * Create downloadable file blob
 */
export function createBlob(content: string, type: string): Blob {
  return new Blob([content], { type });
}

/**
 * Trigger download in browser
 */
export function downloadFile(
  blob: Blob,
  fileName: string
): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Get file extension for export type
 */
export function getFileExtension(
  format: "csv" | "tsv" | "json" | "html"
): string {
  const extensions: Record<string, string> = {
    csv: "csv",
    tsv: "tsv",
    json: "json",
    html: "html",
  };
  return extensions[format] || "txt";
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: "csv" | "tsv" | "json" | "html"): string {
  const types: Record<string, string> = {
    csv: "text/csv",
    tsv: "text/tab-separated-values",
    json: "application/json",
    html: "text/html",
  };
  return types[format] || "text/plain";
}
