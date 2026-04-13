import Papa from "papaparse";
import {
  BOOLEAN_FIELDS,
  NUMERIC_FIELDS,
  type ColumnMapping,
  type StudentFieldKey,
  STUDENT_FIELDS,
} from "./csvColumnMapping";
import {
  DEFAULT_STUDENT,
  mergeStudentPartial,
  type StudentRow,
} from "../../../convex/students/defaults";

export function parseCsvRecords(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  if (parsed.errors.length > 0 && !parsed.data?.length) {
    throw new Error(parsed.errors[0]?.message ?? "CSV parse failed");
  }
  const rows = parsed.data.filter((r) =>
    Object.values(r).some((v) => String(v ?? "").trim() !== "")
  );
  const headers = parsed.meta.fields ?? [];
  return { headers, rows };
}

function parseBool(s: string): boolean | null {
  const t = s.trim().toLowerCase();
  if (["true", "yes", "1", "t", "y"].includes(t)) return true;
  if (["false", "no", "0", "f", "n"].includes(t)) return false;
  return null;
}

/** Coerce a single cell to typed partial value; empty → undefined. */
export function coerceCell(
  field: StudentFieldKey,
  raw: string | undefined
): string | number | boolean | undefined {
  if (raw === undefined) return undefined;
  const s = String(raw).trim();
  if (s === "") return undefined;

  if (NUMERIC_FIELDS.has(field)) {
    const n = Number(s.replace(",", "."));
    if (Number.isNaN(n)) return undefined;
    return n;
  }
  if (BOOLEAN_FIELDS.has(field)) {
    const b = parseBool(s);
    return b === null ? undefined : b;
  }
  return s;
}

/** Build one partial object from a raw CSV row using the mapping (csv column name → field). */
export function rawRowToPartial(
  raw: Record<string, string>,
  mapping: ColumnMapping
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of STUDENT_FIELDS) {
    const csvCol = mapping[field];
    if (!csvCol) continue;
    const cell = raw[csvCol];
    const v = coerceCell(field, cell);
    if (v !== undefined) {
      out[field] = v;
    }
  }
  return out;
}

function median(nums: number[]): number | undefined {
  if (nums.length === 0) return undefined;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function modeStr(vals: string[]): string | undefined {
  if (vals.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const v of vals) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = vals[0];
  let c = 0;
  for (const [k, n] of counts) {
    if (n > c) {
      c = n;
      best = k;
    }
  }
  return best;
}

/**
 * For empty cells in mapped columns, fill with median (numeric) or mode (string/bool) across non-empty cells.
 */
export function imputeFromColumnStats(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): Record<string, string>[] {
  const stats: Partial<
    Record<StudentFieldKey, { median?: number; mode?: string }>
  > = {};

  for (const field of STUDENT_FIELDS) {
    const col = mapping[field];
    if (!col) continue;
    if (NUMERIC_FIELDS.has(field)) {
      const nums: number[] = [];
      for (const r of rows) {
        const c = r[col]?.trim() ?? "";
        if (!c) continue;
        const n = Number(String(c).replace(",", "."));
        if (!Number.isNaN(n)) nums.push(n);
      }
      const med = median(nums);
      if (med !== undefined) stats[field] = { median: med };
    } else {
      const strs: string[] = [];
      for (const r of rows) {
        const c = r[col]?.trim() ?? "";
        if (c) strs.push(c);
      }
      const mo = modeStr(strs);
      if (mo !== undefined) stats[field] = { mode: mo };
    }
  }

  return rows.map((raw) => {
    const next = { ...raw };
    for (const field of STUDENT_FIELDS) {
      const col = mapping[field];
      if (!col) continue;
      const cell = next[col]?.trim() ?? "";
      if (cell !== "") continue;
      const st = stats[field];
      if (!st) continue;
      if (NUMERIC_FIELDS.has(field) && st.median !== undefined) {
        next[col] = String(st.median);
      } else if (st.mode !== undefined && !NUMERIC_FIELDS.has(field)) {
        next[col] = st.mode;
      }
    }
    return next;
  });
}

export function buildStudentRows(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
  options: { impute: boolean }
): { rows: StudentRow[]; partialsBeforeMerge: Record<string, unknown>[] } {
  const working = options.impute
    ? imputeFromColumnStats(rawRows, mapping)
    : rawRows;

  const rows: StudentRow[] = [];
  const partialsBeforeMerge: Record<string, unknown>[] = [];

  for (const raw of working) {
    const partial = rawRowToPartial(raw, mapping);
    partialsBeforeMerge.push(partial);
    rows.push(mergeStudentPartial(partial));
  }

  return { rows, partialsBeforeMerge };
}

/** Fields not supplied by CSV after mapping/coercion (will use server defaults). */
export function getUnsetKeys(
  partial: Record<string, unknown>
): StudentFieldKey[] {
  return STUDENT_FIELDS.filter((k) => partial[k] === undefined);
}

export { mergeStudentPartial, DEFAULT_STUDENT };
