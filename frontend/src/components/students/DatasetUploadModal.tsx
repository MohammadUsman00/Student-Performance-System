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
  ArrowRight,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import {
  STUDENT_FIELDS,
  type ColumnMapping,
  type StudentFieldKey,
  suggestColumnMapping,
  NUMERIC_FIELDS,
  BOOLEAN_FIELDS,
} from "../../lib/csvColumnMapping";
import {
  parseCsvRecords,
  buildStudentRows,
  getUnsetKeys,
} from "../../lib/csvImportPipeline";
import type { StudentRow } from "../../../../convex/students/defaults";

type UploadState =
  | "idle"
  | "mapping"
  | "preview"
  | "uploading"
  | "success"
  | "error";

interface DatasetUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NONE = "__none__";

export function DatasetUploadModal({ open, onOpenChange }: DatasetUploadModalProps) {
  const batchCreate = useMutation(api.students.batchCreate.batchCreate);
  const clearAllApplicationData = useMutation(api.clearData.clearAllApplicationData);
  const fileRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [useImputation, setUseImputation] = useState(true);

  const [previewPartials, setPreviewPartials] = useState<Record<string, unknown>[]>(
    []
  );
  const [previewRows, setPreviewRows] = useState<StudentRow[]>([]);

  const [rawCount, setRawCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  /** When true, import first clears all students, predictions, and model history. */
  const [startFresh, setStartFresh] = useState(false);

  const reset = useCallback(() => {
    setState("idle");
    setFileName(null);
    setCsvHeaders([]);
    setRawRows([]);
    setMapping({});
    setUseImputation(true);
    setPreviewPartials([]);
    setPreviewRows([]);
    setRawCount(0);
    setError(null);
    setResult(null);
    setStartFresh(false);
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
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { headers, rows } = parseCsvRecords(text);
        if (rows.length === 0) {
          setError("CSV has no data rows.");
          return;
        }
        setFileName(file.name);
        setCsvHeaders(headers);
        setRawRows(rows);
        setRawCount(rows.length);
        setMapping(suggestColumnMapping(headers));
        setState("mapping");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not read CSV.");
      }
    };
    reader.readAsText(file);
  }, []);

  const setMappingField = (field: StudentFieldKey, csvColumn: string) => {
    setMapping((m) => {
      const next = { ...m };
      if (!csvColumn || csvColumn === NONE) {
        delete next[field];
      } else {
        next[field] = csvColumn;
      }
      return next;
    });
  };

  const goToPreview = useCallback(() => {
    setError(null);
    try {
      const { rows, partialsBeforeMerge } = buildStudentRows(rawRows, mapping, {
        impute: useImputation,
      });
      setPreviewRows(rows);
      setPreviewPartials(partialsBeforeMerge);
      setState("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build preview.");
    }
  }, [rawRows, mapping, useImputation]);

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
      if (startFresh) {
        await clearAllApplicationData();
      }

      /** Keep each mutation fast; Convex mutations ~1s max — large CSVs use many sequential chunks. */
      const BATCH_SIZE = 25;
      let totalInserted = 0;
      let totalSkipped = 0;

      for (let i = 0; i < previewPartials.length; i += BATCH_SIZE) {
        const batch = previewPartials.slice(i, i + BATCH_SIZE);
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

  const unsetStats = previewPartials.length
    ? getUnsetKeys(previewPartials[0]).length
    : 0;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
        <Dialog.Content className="!fixed left-1/2 top-1/2 z-50 flex h-auto min-h-0 w-[min(100vw-2rem,48rem)] max-h-[min(90dvh,900px)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl p-0 glass-card animate-modal-content outline-none focus:outline-none">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
            <div>
              <Dialog.Title className="text-xl font-bold text-white">
                Upload Dataset
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500 mt-1">
                Map your CSV columns to student fields. Unmapped values use defaults.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
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

            {state === "idle" && (
              <>
                <div
                  className={`drop-zone p-12 text-center cursor-pointer ${
                    dragActive ? "drop-zone--active" : ""
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
                  <p className="text-white font-semibold mb-1">
                    Drag & drop your CSV file here
                  </p>
                  <p className="text-slate-500 text-sm">
                    Kaggle / UCI-style column names are auto-suggested in the next step.
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
              </>
            )}

            {state === "mapping" && (
              <>
                <div className="flex items-center gap-3 mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <FileSpreadsheet className="w-8 h-8 text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{fileName}</p>
                    <p className="text-xs text-slate-500">
                      {rawCount} rows · {csvHeaders.length} columns detected
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <label className="flex items-center gap-2 mb-4 cursor-pointer text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={useImputation}
                    onChange={(e) => setUseImputation(e.target.checked)}
                    className="rounded border-white/20"
                  />
                  Impute empty cells using column median (numbers) or mode (text/boolean)
                </label>

                <div className="rounded-xl border border-white/5 overflow-hidden max-h-[45vh] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#111836] z-10">
                      <tr>
                        <th className="px-3 py-2 text-slate-400 font-bold">Field</th>
                        <th className="px-3 py-2 text-slate-400 font-bold">CSV column</th>
                        <th className="px-3 py-2 text-slate-500 font-bold">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {STUDENT_FIELDS.map((field) => (
                        <tr key={field} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2 font-mono text-indigo-300">{field}</td>
                          <td className="px-3 py-2">
                            <select
                              value={mapping[field] ?? NONE}
                              onChange={(e) =>
                                setMappingField(field, e.target.value)
                              }
                              className="w-full max-w-[220px] rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-white text-xs"
                            >
                              <option value={NONE}>— None (use default) —</option>
                              {csvHeaders.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {NUMERIC_FIELDS.has(field)
                              ? "number"
                              : BOOLEAN_FIELDS.has(field)
                                ? "boolean"
                                : "string"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {state === "preview" && (
              <>
                <div className="flex items-center gap-3 mb-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <FileSpreadsheet className="w-8 h-8 text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{fileName}</p>
                    <p className="text-xs text-slate-500">
                      {rawCount} rows · {previewRows.length} after merge · Sample row:{" "}
                      {unsetStats} fields from defaults
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setState("mapping")}
                    className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0"
                  >
                    Edit mapping
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/5 max-h-[280px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#111836]">
                      <tr>
                        <th className="px-3 py-2 text-slate-500 font-bold">#</th>
                        <th className="px-3 py-2 text-slate-500 font-bold">Name</th>
                        <th className="px-3 py-2 text-slate-500 font-bold">ID</th>
                        <th className="px-3 py-2 text-slate-500 font-bold">Email</th>
                        <th className="px-3 py-2 text-slate-500 font-bold">Age</th>
                        <th className="px-3 py-2 text-slate-500 font-bold">Unset*</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {previewRows.slice(0, 15).map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2 text-slate-600">{i + 1}</td>
                          <td className="px-3 py-2 text-white font-medium">{row.name}</td>
                          <td className="px-3 py-2 font-mono text-slate-400">
                            {row.studentId}
                          </td>
                          <td className="px-3 py-2 text-slate-400 truncate max-w-[140px]">
                            {row.email}
                          </td>
                          <td className="px-3 py-2 text-slate-400">{row.age}</td>
                          <td className="px-3 py-2 text-amber-400/90">
                            {getUnsetKeys(previewPartials[i] ?? {}).length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  *Unset = columns not mapped or empty; values filled from defaults on the server.
                </p>
                {previewRows.length > 15 && (
                  <p className="text-xs text-slate-600 mt-2 text-right">
                    Showing 15 of {previewRows.length} rows
                  </p>
                )}
              </>
            )}

            {state === "uploading" && (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 text-indigo-400 mx-auto mb-4 animate-spin" />
                <p className="text-white font-semibold">
                  Importing {previewPartials.length} students…
                </p>
                <p className="text-slate-500 text-sm mt-1">This may take a moment.</p>
              </div>
            )}

            {error && state !== "success" && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/8 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}
          </div>

          {state === "mapping" && (
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5 shrink-0">
              <button
                type="button"
                onClick={reset}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={goToPreview}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl inline-flex items-center gap-2"
              >
                Preview <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {state === "preview" && (
            <div className="shrink-0 space-y-3 border-t border-white/5 px-6 py-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-600"
                  checked={startFresh}
                  onChange={(e) => setStartFresh(e.target.checked)}
                />
                <span className="text-xs text-amber-100/95 leading-relaxed">
                  <span className="font-bold text-amber-200">Start fresh</span> — delete all
                  existing students, predictions, and model training history, then import this file.
                  Use this for a clean dataset with new charts and insights.
                </span>
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  Import {previewPartials.length} Students
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
