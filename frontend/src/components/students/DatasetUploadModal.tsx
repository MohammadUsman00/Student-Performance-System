import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";

type UploadState = "idle" | "preview" | "uploading" | "success" | "error";

interface DatasetUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Expected CSV header keys (matching student schema). */
const REQUIRED_HEADERS = [
  "name", "studentId", "email", "gender", "age", "address", "famsize", "Pstatus",
  "Medu", "Fedu", "Mjob", "Fjob", "reason", "guardian",
  "traveltime", "studytime", "failures",
  "schoolsup", "famsup", "paid", "activities", "nursery", "higher", "internet", "romantic",
  "famrel", "freetime", "goout", "Dalc", "Walc", "health", "absences", "previousMarks",
];

const NUMERIC_FIELDS = new Set([
  "age", "Medu", "Fedu", "traveltime", "studytime", "failures",
  "famrel", "freetime", "goout", "Dalc", "Walc", "health", "absences", "previousMarks",
]);

const BOOLEAN_FIELDS = new Set([
  "schoolsup", "famsup", "paid", "activities", "nursery", "higher", "internet", "romantic",
]);

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj;
  });
}

function coerceRow(
  raw: Record<string, string>
): Record<string, string | number | boolean> | null {
  const row: Record<string, string | number | boolean> = {};
  for (const key of REQUIRED_HEADERS) {
    const val = raw[key];
    if (val === undefined || val === "") return null;

    if (NUMERIC_FIELDS.has(key)) {
      const n = Number(val);
      if (isNaN(n)) return null;
      row[key] = n;
    } else if (BOOLEAN_FIELDS.has(key)) {
      row[key] = val === "true" || val === "yes" || val === "1" || val === "True" || val === "Yes";
    } else {
      row[key] = val;
    }
  }
  return row;
}

export function DatasetUploadModal({ open, onOpenChange }: DatasetUploadModalProps) {
  const batchCreate = useMutation(api.students.batchCreate.batchCreate);
  const fileRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, string | number | boolean>[]>([]);
  const [rawCount, setRawCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const reset = useCallback(() => {
    setState("idle");
    setFileName(null);
    setPreviewRows([]);
    setRawCount(0);
    setError(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v) reset();
      onOpenChange(v);
    },
    [onOpenChange, reset]
  );

  const processFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rawRows = parseCSV(text);
      if (rawRows.length === 0) {
        setError("CSV file is empty or invalid.");
        return;
      }

      // Check headers
      const headers = Object.keys(rawRows[0]);
      const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
      if (missing.length > 0) {
        setError(`Missing columns: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ` (+${missing.length - 5} more)` : ""}`);
        return;
      }

      const coerced: Record<string, string | number | boolean>[] = [];
      let badRows = 0;
      for (const raw of rawRows) {
        const row = coerceRow(raw);
        if (row) {
          coerced.push(row);
        } else {
          badRows++;
        }
      }

      if (coerced.length === 0) {
        setError("No valid rows found. Check data types and required fields.");
        return;
      }

      setFileName(file.name);
      setRawCount(rawRows.length);
      setPreviewRows(coerced);
      if (badRows > 0) {
        setError(`${badRows} row(s) skipped due to invalid/missing data.`);
      }
      setState("preview");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleSubmit = async () => {
    setState("uploading");
    setError(null);
    try {
      // Convex has transaction limits; batch in groups of 50
      const BATCH_SIZE = 50;
      let totalInserted = 0;
      let totalSkipped = 0;

      for (let i = 0; i < previewRows.length; i += BATCH_SIZE) {
        const batch = previewRows.slice(i, i + BATCH_SIZE);
        const r = await batchCreate({
          students: batch as Parameters<typeof batchCreate>[0]["students"],
        });
        totalInserted += r.inserted;
        totalSkipped += r.skipped;
      }

      setResult({ inserted: totalInserted, skipped: totalSkipped });
      setState("success");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl glass-card rounded-2xl p-0 max-h-[85vh] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-white">
                Upload Dataset
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500 mt-1">
                Import students from a CSV file
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Success View */}
            {state === "success" && result && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Dataset Imported!</h3>
                <p className="text-slate-400 text-sm mb-1">
                  <strong>{result.inserted}</strong> students created
                </p>
                {result.skipped > 0 && (
                  <p className="text-slate-500 text-xs mb-6">
                    {result.skipped} duplicates skipped
                  </p>
                )}
                <button
                  onClick={() => handleOpenChange(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-2.5 rounded-xl transition-all"
                >
                  Done
                </button>
              </div>
            )}

            {/* Upload / Drop Zone */}
            {state === "idle" && (
              <>
                <div
                  className={`drop-zone p-12 text-center cursor-pointer ${
                    dragActive ? "drop-zone--active" : ""
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
                  <p className="text-white font-semibold mb-1">
                    Drag & drop your CSV file here
                  </p>
                  <p className="text-slate-500 text-sm">
                    or click to browse files
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processFile(file);
                    }}
                  />
                </div>

                {/* Column reference */}
                <div className="mt-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Required CSV Columns
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {REQUIRED_HEADERS.map((h) => (
                      <span
                        key={h}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-[10px] font-mono text-slate-400"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Preview */}
            {state === "preview" && (
              <>
                <div className="flex items-center gap-3 mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <FileSpreadsheet className="w-8 h-8 text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{fileName}</p>
                    <p className="text-xs text-slate-500">
                      {rawCount} rows • {previewRows.length} valid
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Preview table */}
                <div className="overflow-x-auto rounded-xl border border-white/5 max-h-[300px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#111836]">
                      <tr>
                        <th className="px-3 py-2 text-slate-500 font-bold">#</th>
                        <th className="px-3 py-2 text-slate-500 font-bold">Name</th>
                        <th className="px-3 py-2 text-slate-500 font-bold">ID</th>
                        <th className="px-3 py-2 text-slate-500 font-bold">Email</th>
                        <th className="px-3 py-2 text-slate-500 font-bold">Age</th>
                        <th className="px-3 py-2 text-slate-500 font-bold">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {previewRows.slice(0, 20).map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2 text-slate-600">{i + 1}</td>
                          <td className="px-3 py-2 text-white font-medium">{row.name as string}</td>
                          <td className="px-3 py-2 font-mono text-slate-400">{row.studentId as string}</td>
                          <td className="px-3 py-2 text-slate-400">{row.email as string}</td>
                          <td className="px-3 py-2 text-slate-400">{String(row.age)}</td>
                          <td className="px-3 py-2 text-slate-400">{row.gender as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewRows.length > 20 && (
                  <p className="text-xs text-slate-600 mt-2 text-right">
                    Showing 20 of {previewRows.length} rows
                  </p>
                )}
              </>
            )}

            {/* Uploading */}
            {state === "uploading" && (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 text-indigo-400 mx-auto mb-4 animate-spin" />
                <p className="text-white font-semibold">Importing {previewRows.length} students…</p>
                <p className="text-slate-500 text-sm mt-1">This may take a moment.</p>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/8 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Footer for preview state */}
          {state === "preview" && (
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5">
              <button
                onClick={reset}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSubmit()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-2.5 rounded-xl transition-all active:scale-95"
              >
                Import {previewRows.length} Students
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
