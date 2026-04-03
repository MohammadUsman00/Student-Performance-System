import { BrainCircuit, RefreshCw, Zap } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";

interface ModelTableProps {
  modelMetrics: Doc<"modelMetrics">[];
  activeModelName: string | undefined;
  isTraining: boolean;
  isPredicting: boolean;
  mlOnline: boolean;
  onTrain: () => void;
  onPredictAll: () => void;
  onSetActive: (modelName: string) => void;
}

export function ModelTable({
  modelMetrics,
  activeModelName,
  isTraining,
  isPredicting,
  mlOnline,
  onTrain,
  onPredictAll,
  onSetActive,
}: ModelTableProps) {
  return (
    <section className="animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Reports — Model Intelligence</h2>
          <p className="text-slate-500 text-sm mt-1">
            Compare algorithmic precision, recall and deploy the best model
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onPredictAll}
            disabled={isPredicting || !mlOnline}
            title={!mlOnline ? "ML service is offline" : ""}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap className={`w-4 h-4 ${isPredicting ? "animate-pulse" : ""}`} />
            {isPredicting ? "Predicting…" : "Predict All"}
          </button>
          <button
            onClick={onTrain}
            disabled={isTraining || !mlOnline}
            title={!mlOnline ? "ML service is offline" : ""}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            <RefreshCw className={`w-4 h-4 ${isTraining ? "animate-spin" : ""}`} />
            {isTraining ? "Training…" : "Retrain Models"}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {modelMetrics.length === 0 ? (
          <div className="px-8 py-16 text-center text-slate-600 text-sm font-medium">
            No models trained yet. Click <strong>Retrain Models</strong> to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="risk-table w-full text-left">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th>Algorithm</th>
                  <th>R² Score</th>
                  <th>MAE</th>
                  <th>Accuracy</th>
                  <th>F1 Score</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {modelMetrics.map((m) => (
                  <tr key={m.modelName}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                          <BrainCircuit className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-white text-sm">
                          {m.modelName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        {activeModelName === m.modelName && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 text-[10px] font-bold border border-indigo-500/25">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="font-mono text-emerald-400 font-semibold">
                      {(m.r2 * 100).toFixed(2)}%
                    </td>
                    <td className="font-mono text-slate-300">{m.mae.toFixed(3)}</td>
                    <td className="font-mono text-slate-300">
                      {(m.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="font-mono text-slate-300">{m.f1.toFixed(3)}</td>
                    <td className="text-right">
                      {activeModelName !== m.modelName && (
                        <button
                          onClick={() => onSetActive(m.modelName)}
                          className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-indigo-400 hover:bg-indigo-500/15 hover:border-indigo-500/30 transition-all"
                        >
                          Deploy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
