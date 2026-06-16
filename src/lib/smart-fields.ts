/**
 * Smart field detection for extracted document text.
 *
 * Turns raw extracted text (invoices, forms, statements) into a list of
 * suggested {name, value} pairs the user can click to add as table columns.
 * Heuristics, not AI — deterministic and explainable.
 */

export interface DetectedField {
  name: string;
  value: string;
  kind: "labeled" | "lineItem" | "amount";
}

// A currency / number amount like 168,638.40 or 2.10 or 80,304
const AMOUNT_RE = /(?:KES|KSH|USD|\$|£|€)?\s?-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?(?:\s?(?:KES|KSH|USD))?/;
const AMOUNT_ANCHORED = new RegExp(`^${AMOUNT_RE.source}$`);

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function looksLikeAmount(s: string): boolean {
  const t = clean(s);
  // Require at least 3 digits so we don't treat tiny stray numbers as money.
  return AMOUNT_ANCHORED.test(t) && (t.match(/\d/g)?.length ?? 0) >= 3;
}

/**
 * Detect candidate fields from extracted text.
 * Dedupes by lowercased name, keeping the first non-empty value.
 */
export function detectFields(text: string): DetectedField[] {
  if (!text || text.startsWith("[")) return [];

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^\[Page \d+\]$/.test(l));

  const found: DetectedField[] = [];
  const seen = new Set<string>();

  const push = (name: string, value: string, kind: DetectedField["kind"]) => {
    const n = clean(name).replace(/[:\-]+$/, "");
    const v = clean(value);
    if (!n || !v) return;
    if (n.length > 60 || v.length > 120) return;
    const key = n.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ name: n, value: v, kind });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1) "Label: value" on the SAME line — split on the first colon only
    //    (dashes are kept so codes like KEGEA-SO-0525709 stay intact).
    //    We deliberately do NOT pair a lone "Label:" with the next line:
    //    invoices lay labels and values in separate columns, so next-line
    //    guessing yields wrong data. Better to omit than to mislead.
    const ci = line.indexOf(":");
    if (ci > 0 && ci < 40) {
      const label = clean(line.slice(0, ci));
      const rest = clean(line.slice(ci + 1));
      const labelDigits = (label.match(/\d/g)?.length ?? 0);
      const labelOk =
        /^[A-Za-z][A-Za-z0-9 .&()'/-]*$/.test(label) &&
        labelDigits <= 2 &&
        !looksLikeAmount(label);
      // Reject values that still contain a colon — usually two labels that
      // got merged (e.g. "Date: Sign:") or a stray timestamp.
      const valueOk = rest.length > 0 && !rest.includes(":");
      if (labelOk && valueOk) {
        push(label, rest, "labeled");
        continue;
      }
    }

    // 3) Line item: "Description …  168,638.40" — split on a run of 2+ spaces,
    //    last cell is the amount, the rest is the description.
    const cells = line.split(/\s{2,}/).map(clean).filter(Boolean);
    if (cells.length >= 2) {
      const last = cells[cells.length - 1];
      const desc = cells.slice(0, -1).join(" ");
      if (looksLikeAmount(last) && /[A-Za-z]/.test(desc)) {
        push(desc, last, "lineItem");
      }
    }
  }

  return found;
}
