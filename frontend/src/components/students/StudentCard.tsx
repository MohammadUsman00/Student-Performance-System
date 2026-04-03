import { RiskBadge } from "../ui/RiskBadge";
import type { PredictionView } from "../../hooks/useStudentData";

interface StudentCardProps {
  name: string;
  studentId: string;
  studytime: number;
  absences: number;
  prediction: PredictionView | undefined;
}

export function StudentCard({
  name,
  studentId,
  studytime,
  absences,
  prediction,
}: StudentCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="glass-card rounded-2xl p-5 group hover:border-indigo-500/20 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border border-indigo-500/20 text-sm font-bold text-indigo-300 group-hover:scale-110 transition-transform">
            {initials}
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">{name}</h4>
            <p className="text-xs text-slate-500">ID: {studentId}</p>
          </div>
        </div>
        <RiskBadge level={prediction?.riskLevel || "Low"} />
      </div>

      <div className="space-y-3 mt-4">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500 font-semibold">Predicted Score</span>
          <span className="text-white font-bold">
            {prediction?.predictedScore.toFixed(1) || "N/A"}/100
          </span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              prediction?.riskLevel === "High"
                ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                : prediction?.riskLevel === "Medium"
                ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                : "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            }`}
            style={{ width: `${prediction?.predictedScore || 0}%` }}
          />
        </div>

        <div className="flex justify-between items-center pt-1 text-xs">
          <div>
            <span className="text-slate-600 font-semibold">Study: </span>
            <span className="text-slate-400">Level {studytime}</span>
          </div>
          <div>
            <span className="text-slate-600 font-semibold">Absences: </span>
            <span className="text-slate-400">{absences}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
