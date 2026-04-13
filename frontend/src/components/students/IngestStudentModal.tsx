import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CheckCircle, AlertCircle, Zap, Loader2 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import {
  GENDER_OPTIONS,
  ADDRESS_OPTIONS,
  FAMSIZE_OPTIONS,
  PSTATUS_OPTIONS,
  JOB_OPTIONS,
  REASON_OPTIONS,
  GUARDIAN_OPTIONS,
  LABEL_MAP,
  CORE_NUMERIC_FIELDS,
  FAMILY_NUMERIC_FIELDS,
  ACADEMIC_NUMERIC_FIELDS,
  LIFESTYLE_NUMERIC_FIELDS,
  BOOLEAN_FIELDS,
  getDefaultStudentForm,
  validateStudentForm,
} from "../../lib/constants";

type SubmitState = "idle" | "submitting" | "success" | "error";

interface IngestStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPredictStudent?: (studentId: string) => void;
  mlOnline: boolean;
}

export function IngestStudentModal({
  open,
  onOpenChange,
  onPredictStudent,
  mlOnline,
}: IngestStudentModalProps) {
  const createStudent = useMutation(api.students.create.create);

  const [form, setForm] = useState<Record<string, string | number | boolean>>(
    getDefaultStudentForm
  );
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);

  const steps = ["Core Info", "Demographics", "Family", "Academic", "Lifestyle"];

  const reset = useCallback(() => {
    setForm(getDefaultStudentForm());
    setStep(0);
    setErrors([]);
    setSubmitState("idle");
    setSubmitError(null);
    setCreatedStudentId(null);
  }, []);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) reset();
      onOpenChange(v);
    },
    [onOpenChange, reset]
  );

  const setField = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const validationErrors = validateStudentForm(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSubmitState("submitting");
    setSubmitError(null);

    try {
      await createStudent({
        name: form.name as string,
        studentId: form.studentId as string,
        email: form.email as string,
        gender: form.gender as string,
        age: form.age as number,
        address: form.address as string,
        famsize: form.famsize as string,
        Pstatus: form.Pstatus as string,
        Medu: form.Medu as number,
        Fedu: form.Fedu as number,
        Mjob: form.Mjob as string,
        Fjob: form.Fjob as string,
        reason: form.reason as string,
        guardian: form.guardian as string,
        traveltime: form.traveltime as number,
        studytime: form.studytime as number,
        failures: form.failures as number,
        schoolsup: form.schoolsup as boolean,
        famsup: form.famsup as boolean,
        paid: form.paid as boolean,
        activities: form.activities as boolean,
        nursery: form.nursery as boolean,
        higher: form.higher as boolean,
        internet: form.internet as boolean,
        romantic: form.romantic as boolean,
        famrel: form.famrel as number,
        freetime: form.freetime as number,
        goout: form.goout as number,
        Dalc: form.Dalc as number,
        Walc: form.Walc as number,
        health: form.health as number,
        absences: form.absences as number,
        previousMarks: form.previousMarks as number,
      });
      setCreatedStudentId(form.studentId as string);
      setSubmitState("success");
    } catch (e) {
      setSubmitState("error");
      setSubmitError(
        e instanceof Error ? e.message : "Failed to create student."
      );
    }
  };

  // --- Render helpers ---

  const renderTextInput = (key: string, label: string, placeholder: string) => (
    <div key={key} className="space-y-1.5">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={form[key] as string}
        onChange={(e) => setField(key, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />
    </div>
  );

  const renderSelect = (
    key: string,
    label: string,
    options: readonly string[]
  ) => (
    <div key={key} className="space-y-1.5">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <select
        value={form[key] as string}
        onChange={(e) => setField(key, e.target.value)}
        className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {LABEL_MAP[o] || o}
          </option>
        ))}
      </select>
    </div>
  );

  const renderNumberInput = (
    key: string,
    label: string,
    min: number,
    max: number,
    description?: string
  ) => (
    <div key={key} className="space-y-1.5">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="number"
        value={form[key] as number}
        min={min}
        max={max}
        onChange={(e) => setField(key, Number(e.target.value))}
        className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />
      {description && (
        <p className="text-[10px] text-slate-600">{description}</p>
      )}
    </div>
  );

  const renderToggle = (key: string, label: string) => (
    <label
      key={key}
      className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-slate-900/60 transition-colors"
    >
      <span className="text-xs font-bold text-slate-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={form[key] as boolean}
        onClick={() => setField(key, !(form[key] as boolean))}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          form[key] ? "bg-blue-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            form[key] ? "translate-x-5" : ""
          }`}
        />
      </button>
    </label>
  );

  // --- Step content ---

  const renderStep = () => {
    switch (step) {
      case 0: // Core Info
        return (
          <div className="grid grid-cols-2 gap-4">
            {renderTextInput("name", "Full Name", "Alice Johnson")}
            {renderTextInput("studentId", "Student ID", "STU004")}
            <div className="col-span-2">
              {renderTextInput("email", "Email", "alice@school.edu")}
            </div>
            {CORE_NUMERIC_FIELDS.map((f) =>
              renderNumberInput(f.key, f.label, f.min, f.max, f.description)
            )}
          </div>
        );
      case 1: // Demographics
        return (
          <div className="grid grid-cols-2 gap-4">
            {renderSelect("gender", "Gender", GENDER_OPTIONS)}
            {renderSelect("address", "Address Type", ADDRESS_OPTIONS)}
            {renderSelect("famsize", "Family Size", FAMSIZE_OPTIONS)}
            {renderSelect("Pstatus", "Parent Status", PSTATUS_OPTIONS)}
          </div>
        );
      case 2: // Family
        return (
          <div className="grid grid-cols-2 gap-4">
            {FAMILY_NUMERIC_FIELDS.map((f) =>
              renderNumberInput(f.key, f.label, f.min, f.max, f.description)
            )}
            {renderSelect("Mjob", "Mother's Job", JOB_OPTIONS)}
            {renderSelect("Fjob", "Father's Job", JOB_OPTIONS)}
            {renderSelect("reason", "Reason for School", REASON_OPTIONS)}
            {renderSelect("guardian", "Guardian", GUARDIAN_OPTIONS)}
          </div>
        );
      case 3: // Academic
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {ACADEMIC_NUMERIC_FIELDS.map((f) =>
                renderNumberInput(f.key, f.label, f.min, f.max, f.description)
              )}
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Academic Support Flags
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BOOLEAN_FIELDS.filter((b) =>
                  ["schoolsup", "famsup", "paid", "activities", "higher"].includes(b.key)
                ).map((b) => renderToggle(b.key, b.label))}
              </div>
            </div>
          </div>
        );
      case 4: // Lifestyle
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {LIFESTYLE_NUMERIC_FIELDS.map((f) =>
                renderNumberInput(f.key, f.label, f.min, f.max, f.description)
              )}
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Lifestyle Flags
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BOOLEAN_FIELDS.filter((b) =>
                  ["nursery", "internet", "romantic"].includes(b.key)
                ).map((b) => renderToggle(b.key, b.label))}
              </div>
            </div>
          </div>
        );
    }
  };

  // --- Success view ---
  if (submitState === "success") {
    return (
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
          <Dialog.Content className="!fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md glass-card rounded-3xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">Student Ingested!</h3>
            <p className="text-slate-400 text-sm mb-6">
              <strong>{form.name as string}</strong> ({createdStudentId}) has been added
              to the system.
            </p>
            <div className="flex flex-col gap-3">
              {onPredictStudent && (
                <button
                  onClick={() => {
                    if (createdStudentId) onPredictStudent(createdStudentId);
                    handleOpenChange(false);
                  }}
                  disabled={!mlOnline}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  {mlOnline ? "Generate Prediction Now" : "ML Service Offline"}
                </button>
              )}
              <button
                onClick={() => handleOpenChange(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
        <Dialog.Content className="!fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl glass-card rounded-3xl p-0 max-h-[min(90dvh,900px)] min-h-0 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-4">
            <div>
              <Dialog.Title className="text-2xl font-black text-white tracking-tight">
                Ingest Student
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500 mt-1">
                Step {step + 1} of {steps.length} — {steps[step]}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5 px-8 pb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-blue-500" : "bg-slate-800"
                }`}
              />
            ))}
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-4">{renderStep()}</div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mx-8 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  {e}
                </p>
              ))}
            </div>
          )}

          {/* Submit error */}
          {submitState === "error" && submitError && (
            <div className="mx-8 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                {submitError}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center px-8 py-6 border-t border-white/5">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-2.5 rounded-xl transition-all active:scale-95"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => void handleSubmit()}
                disabled={submitState === "submitting"}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black px-8 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2"
              >
                {submitState === "submitting" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {submitState === "submitting" ? "Creating…" : "Create Student"}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
