/** Student form field definitions, validation rules, and select-option maps. */

export const GENDER_OPTIONS = ["M", "F"] as const;
export const ADDRESS_OPTIONS = ["U", "R"] as const;
export const FAMSIZE_OPTIONS = ["GT3", "LE3"] as const;
export const PSTATUS_OPTIONS = ["T", "A"] as const;
export const JOB_OPTIONS = ["teacher", "health", "services", "at_home", "other"] as const;
export const REASON_OPTIONS = ["home", "reputation", "course", "other"] as const;
export const GUARDIAN_OPTIONS = ["mother", "father", "other"] as const;

/** Label maps for display in dropdowns. */
export const LABEL_MAP: Record<string, string> = {
  M: "Male",
  F: "Female",
  U: "Urban",
  R: "Rural",
  GT3: "Greater than 3",
  LE3: "3 or fewer",
  T: "Living together",
  A: "Apart",
  teacher: "Teacher",
  health: "Health care",
  services: "Services",
  at_home: "At home",
  other: "Other",
  home: "Close to home",
  reputation: "Reputation",
  course: "Course preference",
  mother: "Mother",
  father: "Father",
};

export interface NumericFieldDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  description?: string;
}

export const CORE_NUMERIC_FIELDS: NumericFieldDef[] = [
  { key: "age", label: "Age", min: 15, max: 22, description: "Student age (15–22)" },
  { key: "previousMarks", label: "Previous Marks", min: 0, max: 100, description: "G1/G2 equivalent (0–100)" },
];

export const FAMILY_NUMERIC_FIELDS: NumericFieldDef[] = [
  { key: "Medu", label: "Mother's Education", min: 0, max: 4, description: "0 = none … 4 = higher" },
  { key: "Fedu", label: "Father's Education", min: 0, max: 4, description: "0 = none … 4 = higher" },
];

export const ACADEMIC_NUMERIC_FIELDS: NumericFieldDef[] = [
  { key: "traveltime", label: "Travel Time", min: 1, max: 4, description: "1 = <15min … 4 = >1hr" },
  { key: "studytime", label: "Study Time", min: 1, max: 4, description: "1 = <2hrs … 4 = >10hrs" },
  { key: "failures", label: "Past Failures", min: 0, max: 3, description: "Number of past class failures" },
  { key: "absences", label: "Absences", min: 0, max: 93, description: "Number of school absences" },
];

export const LIFESTYLE_NUMERIC_FIELDS: NumericFieldDef[] = [
  { key: "famrel", label: "Family Relationship", min: 1, max: 5, description: "1 = very bad … 5 = excellent" },
  { key: "freetime", label: "Free Time", min: 1, max: 5, description: "1 = very low … 5 = very high" },
  { key: "goout", label: "Going Out", min: 1, max: 5, description: "1 = very low … 5 = very high" },
  { key: "Dalc", label: "Workday Alcohol", min: 1, max: 5, description: "1 = very low … 5 = very high" },
  { key: "Walc", label: "Weekend Alcohol", min: 1, max: 5, description: "1 = very low … 5 = very high" },
  { key: "health", label: "Health Status", min: 1, max: 5, description: "1 = very bad … 5 = very good" },
];

export const BOOLEAN_FIELDS = [
  { key: "schoolsup", label: "School Support" },
  { key: "famsup", label: "Family Support" },
  { key: "paid", label: "Paid Classes" },
  { key: "activities", label: "Extracurricular" },
  { key: "nursery", label: "Attended Nursery" },
  { key: "higher", label: "Wants Higher Ed" },
  { key: "internet", label: "Internet Access" },
  { key: "romantic", label: "In Relationship" },
] as const;

/** Default values for the student creation form. */
export function getDefaultStudentForm(): Record<string, string | number | boolean> {
  return {
    name: "",
    studentId: "",
    email: "",
    gender: "M",
    age: 17,
    address: "U",
    famsize: "GT3",
    Pstatus: "T",
    Medu: 2,
    Fedu: 2,
    Mjob: "other",
    Fjob: "other",
    reason: "course",
    guardian: "mother",
    traveltime: 1,
    studytime: 2,
    failures: 0,
    schoolsup: false,
    famsup: false,
    paid: false,
    activities: false,
    nursery: true,
    higher: true,
    internet: true,
    romantic: false,
    famrel: 3,
    freetime: 3,
    goout: 3,
    Dalc: 1,
    Walc: 1,
    health: 3,
    absences: 0,
    previousMarks: 60,
  };
}

/** Validate the student form, returning an array of error messages. */
export function validateStudentForm(
  form: Record<string, string | number | boolean>
): string[] {
  const errors: string[] = [];
  if (!form.name || (form.name as string).trim().length < 2) errors.push("Name is required (min 2 chars).");
  if (!form.studentId || (form.studentId as string).trim().length < 1) errors.push("Student ID is required.");
  if (!form.email || !(form.email as string).includes("@")) errors.push("A valid email is required.");
  
  const numChecks = [
    ...CORE_NUMERIC_FIELDS,
    ...FAMILY_NUMERIC_FIELDS,
    ...ACADEMIC_NUMERIC_FIELDS,
    ...LIFESTYLE_NUMERIC_FIELDS,
  ];
  for (const f of numChecks) {
    const v = form[f.key] as number;
    if (v < f.min || v > f.max) {
      errors.push(`${f.label} must be between ${f.min} and ${f.max}.`);
    }
  }
  return errors;
}
