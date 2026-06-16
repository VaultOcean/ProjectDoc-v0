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

function isLabelToken(s: string): boolean {
  return s.includes(":");
}

/**
 * Group a page's item indices into visual rows (by y), each sorted left→right.
 * Returns original indices so callers can map back to page.items.
 */
export function groupRowIndices(page: PositionedPage): number[][] {
  const order = page.items
    .map((it, idx) => ({ it, idx }))
    .sort((a, b) => a.it.y - b.it.y || a.it.x - b.it.x);

  const rows: number[][] = [];
  let cur: number[] = [];
  let prevY: number | null = null;
  for (const { it, idx } of order) {
    const tol = Math.max((it.h || 10) * 0.6, 4);
    if (prevY === null || Math.abs(it.y - prevY) <= tol) {
      cur.push(idx);
    } else {
      rows.push(cur);
      cur = [idx];
    }
    prevY = it.y;
  }
  if (cur.length) rows.push(cur);
  // Sort each row strictly left→right (y-then-x ordering can interleave items
  // whose baselines differ slightly within the same visual row).
  rows.forEach((r) => r.sort((a, b) => page.items[a].x - page.items[b].x));
  return rows;
}

export interface RowSegment {
  label: string | null;
  value: string;
  /** Original page-item indices that make up the value (for highlighting). */
  valueKeys: number[];
  kind: DetectedField["kind"];
}

/**
 * Split one row (array of original item indices) into label→value segments.
 * Shared by both auto-detection and click-to-pair so they behave identically.
 */
export function segmentRow(page: PositionedPage, rowIdx: number[]): RowSegment[] {
  const colGap = Math.max(page.width * 0.13, 50);
  const items = page.items;
  const segs: RowSegment[] = [];

  let i = 0;
  while (i < rowIdx.length) {
    const ti = rowIdx[i];
    const t = items[ti];
    const ci = t.str.indexOf(":");
    if (ci >= 0) {
      const label = t.str.slice(0, ci);
      const inlineVal = t.str.slice(ci + 1).trim();
      const valParts: string[] = [];
      const valueKeys: number[] = [];
      let prevEnd = t.x + t.w;
      if (inlineVal) {
        valParts.push(inlineVal);
        valueKeys.push(ti);
      }
      let j = i + 1;
      while (j < rowIdx.length && !isLabelToken(items[rowIdx[j]].str)) {
        const nx = items[rowIdx[j]];
        if (nx.x - prevEnd > colGap) break;
        valParts.push(nx.str);
        valueKeys.push(rowIdx[j]);
        prevEnd = nx.x + nx.w;
        j++;
      }
      segs.push({
        label,
        value: valParts.join(" "),
        valueKeys,
        kind: "labeled",
      });
      i = j > i ? j : i + 1;
      continue;
    }
    i++;
  }

  // Line item: text on the left, an amount on the right.
  if (segs.length === 0 && rowIdx.length >= 2) {
    const lastIdx = rowIdx[rowIdx.length - 1];
    const last = items[lastIdx];
    if (looksLikeAmount(last.str)) {
      const descParts: string[] = [];
      let prevEnd = last.x;
      for (let k = rowIdx.length - 2; k >= 0; k--) {
        const tok = items[rowIdx[k]];
        if (prevEnd - (tok.x + tok.w) > colGap) break;
        descParts.unshift(tok.str);
        prevEnd = tok.x;
      }
      const desc = descParts.join(" ");
      if (/[A-Za-z]/.test(desc)) {
        segs.push({
          label: desc,
          value: last.str,
          valueKeys: [lastIdx],
          kind: "lineItem",
        });
      }
    }
  }

  return segs;
}

function acceptField(
  name: string,
  value: string,
  kind: DetectedField["kind"]
): DetectedField | null {
  const n = clean(name).replace(/[:\-]+$/, "");
  const v = clean(value);
  if (!n || !v) return null;
  if (n.length > 60 || v.length > 120) return null;
  if (!/[A-Za-z]/.test(n)) return null;
  if ((n.match(/\d/g)?.length ?? 0) > 3) return null; // date/page junk labels
  if (kind === "labeled" && v.split(/\s+/).length > 8) return null; // sentences
  return { name: n, value: v, kind };
}

/**
 * Geometric field detection: pair each label with the value to its right on
 * the same visual row, never crossing a column-sized gap.
 */
export function detectFieldsFromLayout(
  pages: PositionedPage[]
): DetectedField[] {
  const found: DetectedField[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    for (const rowIdx of groupRowIndices(page)) {
      for (const seg of segmentRow(page, rowIdx)) {
        const f = acceptField(seg.label ?? "", seg.value, seg.kind);
        if (!f) continue;
        const key = f.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        found.push(f);
      }
    }
  }

  return found;
}

/**
 * Given a clicked word (page index + item index), return the field it belongs
 * to: the label→value segment containing it, with the keys to highlight.
 * Powers one-click smart capture in the visual selector.
 */
export function pairAtPoint(
  page: PositionedPage,
  itemIndex: number
): { name: string; value: string; keys: number[] } | null {
  for (const rowIdx of groupRowIndices(page)) {
    if (!rowIdx.includes(itemIndex)) continue;
    const segs = segmentRow(page, rowIdx);
    // Prefer the segment whose value contains the clicked token.
    let seg = segs.find((s) => s.valueKeys.includes(itemIndex));
    // Otherwise, if the user clicked the label token itself, use that segment.
    if (!seg) {
      const t = page.items[itemIndex];
      const ci = t.str.indexOf(":");
      if (ci >= 0) {
        const labelText = t.str.slice(0, ci);
        seg = segs.find((s) => s.label === labelText);
      }
    }
    if (seg) {
      return {
        name: clean(seg.label ?? "").replace(/[:\-]+$/, ""),
        value: clean(seg.value),
        keys: seg.valueKeys,
      };
    }
    return null;
  }
  return null;
}
