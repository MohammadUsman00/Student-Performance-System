/**
 * Default student row aligned with ML service fallbacks (numerics: 0, categoricals: "other", booleans: false)
 * and safe neutral values where 0 is invalid for UX (age).
 * See ml-service/main.py NUMERICAL_FEATURES / CATEGORICAL_FEATURES.
 */
export const DEFAULT_STUDENT = {
  name: "Unknown",
  studentId: "",
  email: "noreply@placeholder.invalid",
  gender: "M",
  age: 18,
  address: "U",
  famsize: "GT3",
  Pstatus: "T",
  Medu: 0,
  Fedu: 0,
  Mjob: "other",
  Fjob: "other",
  reason: "course",
  guardian: "mother",
  traveltime: 1,
  studytime: 1,
  failures: 0,
  schoolsup: false,
  famsup: false,
  paid: false,
  activities: false,
  nursery: false,
  higher: false,
  internet: false,
  romantic: false,
  famrel: 3,
  freetime: 3,
  goout: 3,
  Dalc: 1,
  Walc: 1,
  health: 3,
  absences: 0,
  previousMarks: 0,
} as const;

export type StudentRow = typeof DEFAULT_STUDENT;

/** All canonical field keys (same order as schema). */
export const STUDENT_FIELD_KEYS = Object.keys(
  DEFAULT_STUDENT
) as (keyof StudentRow)[];

function randomStudentId(): string {
  const g =
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return `imp-${g}`;
}

/**
 * Merge partial row with defaults; undefined / null skip. Ensures non-empty studentId.
 */
export function mergeStudentPartial(
  partial: Record<string, unknown>
): StudentRow {
  const base: Record<string, string | number | boolean> = {
    ...DEFAULT_STUDENT,
  };
  for (const key of STUDENT_FIELD_KEYS) {
    const val = partial[key];
    if (val === undefined || val === null) continue;
    if (typeof val === "string" && val.trim() === "") continue;
    base[key] = val as string | number | boolean;
  }
  let sid = String(base.studentId ?? "").trim();
  if (!sid) {
    sid = randomStudentId();
  }
  base.studentId = sid;

  let email = String(base.email ?? "").trim();
  if (!email || email === "noreply@placeholder.invalid") {
    email = `${sid.replace(/[^a-zA-Z0-9_-]/g, "")}@dataset.import`;
    base.email = email.slice(0, 120);
  } else {
    base.email = email;
  }

  return base as StudentRow;
}
