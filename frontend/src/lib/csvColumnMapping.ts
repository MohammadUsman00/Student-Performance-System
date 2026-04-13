/** Canonical student field keys (must match Convex schema / defaults). */
export const STUDENT_FIELDS = [
  "name",
  "studentId",
  "email",
  "gender",
  "age",
  "address",
  "famsize",
  "Pstatus",
  "Medu",
  "Fedu",
  "Mjob",
  "Fjob",
  "reason",
  "guardian",
  "traveltime",
  "studytime",
  "failures",
  "schoolsup",
  "famsup",
  "paid",
  "activities",
  "nursery",
  "higher",
  "internet",
  "romantic",
  "famrel",
  "freetime",
  "goout",
  "Dalc",
  "Walc",
  "health",
  "absences",
  "previousMarks",
] as const;

export type StudentFieldKey = (typeof STUDENT_FIELDS)[number];

export const NUMERIC_FIELDS = new Set<string>([
  "age",
  "Medu",
  "Fedu",
  "traveltime",
  "studytime",
  "failures",
  "famrel",
  "freetime",
  "goout",
  "Dalc",
  "Walc",
  "health",
  "absences",
  "previousMarks",
]);

export const BOOLEAN_FIELDS = new Set<string>([
  "schoolsup",
  "famsup",
  "paid",
  "activities",
  "nursery",
  "higher",
  "internet",
  "romantic",
]);

/** Alternative header labels (normalized) → canonical field. */
const SYNONYM_GROUPS: { field: StudentFieldKey; patterns: string[] }[] = [
  { field: "studentId", patterns: ["studentid", "id", "student_id", "roll", "rollno", "adm", "admno", "stu_id"] },
  { field: "name", patterns: ["name", "fullname", "studentname", "student_name"] },
  { field: "email", patterns: ["email", "e-mail", "mail"] },
  { field: "gender", patterns: ["gender", "sex"] },
  { field: "age", patterns: ["age"] },
  { field: "address", patterns: ["address", "addr", "urban"] },
  { field: "famsize", patterns: ["famsize", "fam_size", "family size"] },
  { field: "Pstatus", patterns: ["pstatus", "p_status", "parent status", "parents"] },
  { field: "Medu", patterns: ["medu", "m_edu", "mother education", "meducation"] },
  { field: "Fedu", patterns: ["fedu", "f_edu", "father education", "feducation"] },
  { field: "Mjob", patterns: ["mjob", "mother job", "m_job"] },
  { field: "Fjob", patterns: ["fjob", "father job", "f_job"] },
  { field: "reason", patterns: ["reason"] },
  { field: "guardian", patterns: ["guardian"] },
  { field: "traveltime", patterns: ["traveltime", "travel"] },
  { field: "studytime", patterns: ["studytime", "study"] },
  { field: "failures", patterns: ["failures", "failure", "failed"] },
  { field: "schoolsup", patterns: ["schoolsup", "school sup", "schoolsupport"] },
  { field: "famsup", patterns: ["famsup", "family sup"] },
  { field: "paid", patterns: ["paid"] },
  { field: "activities", patterns: ["activities", "extra"] },
  { field: "nursery", patterns: ["nursery"] },
  { field: "higher", patterns: ["higher"] },
  { field: "internet", patterns: ["internet"] },
  { field: "romantic", patterns: ["romantic"] },
  { field: "famrel", patterns: ["famrel", "family rel"] },
  { field: "freetime", patterns: ["freetime", "free time"] },
  { field: "goout", patterns: ["goout", "go out"] },
  { field: "Dalc", patterns: ["dalc", "workday alcohol"] },
  { field: "Walc", patterns: ["walc", "weekend alcohol"] },
  { field: "health", patterns: ["health"] },
  { field: "absences", patterns: ["absences", "absence"] },
  {
    field: "previousMarks",
    patterns: ["previousmarks", "g3", "g2", "g1", "grade", "marks", "score", "final", "gpa"],
  },
];

export function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

/** Score 0–1 how well a CSV header matches a canonical field. */
function scoreHeader(norm: string, field: StudentFieldKey): number {
  if (norm === normalizeHeader(field)) return 1;
  const group = SYNONYM_GROUPS.find((g) => g.field === field);
  if (!group) return 0;
  for (const p of group.patterns) {
    const pn = normalizeHeader(p);
    if (norm === pn || norm.includes(pn) || pn.includes(norm)) return 0.85;
  }
  return 0;
}

export type ColumnMapping = Partial<Record<StudentFieldKey, string>>;

/** Suggest CSV column name per field; picks best-scoring header per field (no dedup of columns). */
export function suggestColumnMapping(csvHeaders: string[]): ColumnMapping {
  const normalized = csvHeaders.map((h) => ({ raw: h, n: normalizeHeader(h) }));
  const mapping: ColumnMapping = {};
  for (const field of STUDENT_FIELDS) {
    let best: { raw: string; score: number } | null = null;
    for (const { raw, n } of normalized) {
      const s = scoreHeader(n, field);
      if (s > 0 && (!best || s > best.score)) {
        best = { raw, score: s };
      }
    }
    if (best && best.score >= 0.5) {
      mapping[field] = best.raw;
    }
  }
  return mapping;
}
