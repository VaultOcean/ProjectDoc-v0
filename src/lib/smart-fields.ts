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

// Positioned word (matches LayoutItem from pdf-extract / the layout API).
export interface PositionedItem {
  x: number;
  y: number;
  w: number;
  h: number;
  str: string;
}
export interface PositionedPage {
  width: number;
  height: number;
  items: PositionedItem[];
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

/** Group positioned items into visual rows (by y), each sorted left→right. */
export function groupRows(items: PositionedItem[]): PositionedItem[][] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: PositionedItem[][] = [];
  let cur: PositionedItem[] = [];
  let prevY: number | null = null;
  for (const it of sorted) {
    const tol = Math.max((it.h || 10) * 0.6, 4);
    if (prevY === null || Math.abs(it.y - prevY) <= tol) {
      cur.push(it);
    } else {
      rows.push(cur);
      cur = [it];
    }
    prevY = it.y;
  }
  if (cur.length) rows.push(cur);
  rows.forEach((r) => r.sort((a, b) => a.x - b.x));
  return rows;
}

function isLabelToken(s: string): boolean {
  return s.includes(":");
}

/**
 * Geometric field detection from positioned words. Far more accurate than
 * flat-text parsing for column-layout documents: a label like "Order No:"
 * is paired with the value sitting to its right on the SAME visual row.
 */
export function detectFieldsFromLayout(
  pages: PositionedPage[]
): DetectedField[] {
  const found: DetectedField[] = [];
  const seen = new Set<string>();

  const push = (name: string, value: string, kind: DetectedField["kind"]) => {
    const n = clean(name).replace(/[:\-]+$/, "");
    const v = clean(value);
    if (!n || !v) return;
    if (n.length > 60 || v.length > 120) return;
    if (!/[A-Za-z]/.test(n)) return;
    if ((n.match(/\d/g)?.length ?? 0) > 3) return; // skip date/page junk labels
    // Skip sentence-like values (terms & conditions, footnotes), not real fields.
    if (kind === "labeled" && v.split(/\s+/).length > 8) return;
    const key = n.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ name: n, value: v, kind });
  };

  for (const page of pages) {
    // Tokens further apart than this belong to a different column, so a value
    // never reaches across the gap into an unrelated column. Tuned so a value
    // in the adjacent column still pairs, but a far column does not.
    const colGap = Math.max(page.width * 0.13, 50);

    for (const row of groupRows(page.items)) {
      let i = 0;
      let pairedSomething = false;

      while (i < row.length) {
        const t = row[i];
        const ci = t.str.indexOf(":");
        if (ci >= 0) {
          const label = t.str.slice(0, ci);
          const inlineVal = t.str.slice(ci + 1).trim();
          const valParts: string[] = [];
          let prevEnd = t.x + t.w;
          if (inlineVal) valParts.push(inlineVal);
          // Gather the value from tokens to the right, stopping at the next
          // label or at a column-sized horizontal gap.
          let j = i + 1;
          while (j < row.length && !isLabelToken(row[j].str)) {
            if (row[j].x - prevEnd > colGap) break;
            valParts.push(row[j].str);
            prevEnd = row[j].x + row[j].w;
            j++;
          }
          const value = valParts.join(" ");
          if (value && !value.includes(":")) {
            push(label, value, "labeled");
            pairedSomething = true;
          }
          i = j > i ? j : i + 1;
          continue;
        }
        i++;
      }

      // Line item: text on the left, an amount on the right — pair the amount
      // with only the adjacent text (not the whole row).
      if (!pairedSomething && row.length >= 2) {
        const last = row[row.length - 1];
        if (looksLikeAmount(last.str)) {
          const descParts: string[] = [];
          let prevEnd = last.x;
          for (let k = row.length - 2; k >= 0; k--) {
            const tok = row[k];
            if (prevEnd - (tok.x + tok.w) > colGap) break;
            descParts.unshift(tok.str);
            prevEnd = tok.x;
          }
          const desc = descParts.join(" ");
          if (/[A-Za-z]/.test(desc)) push(desc, last.str, "lineItem");
        }
      }
    }
  }

  return found;
}
