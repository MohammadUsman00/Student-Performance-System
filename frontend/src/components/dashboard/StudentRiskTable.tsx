import { useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import type { StudentView, PredictionView } from "../../hooks/useStudentData";

function scoreToGrade(score: number): { letter: string; css: string } {
  if (score >= 90) return { letter: "A", css: "grade-A" };
  if (score >= 80) return { letter: "B", css: "grade-B" };
  if (score >= 70) return { letter: "C", css: "grade-C" };
  if (score >= 60) return { letter: "D", css: "grade-D" };
  return { letter: "F", css: "grade-F" };
}

function riskCss(level: string): string {
  if (level === "High") return "risk-high";
  if (level === "Medium") return "risk-medium";
  return "risk-low";
}

function getKeyFactors(student: StudentView, prediction: PredictionView | undefined): string {
  const factors: string[] = [];
  if (student.absences > 10) factors.push("High absences");
  if (student.studytime <= 1) factors.push("Low study time");
  if (prediction && prediction.predictedScore < 60) factors.push("Declining performance");
  if (prediction && prediction.riskLevel === "High") factors.push("Poor attendance, low test scores");
  if (prediction && prediction.riskLevel === "Low") factors.push("Strong grades");
  if (factors.length === 0) factors.push("Stable performance");
  return factors.slice(0, 2).join(", ");
}

interface StudentRiskTableProps {
  students: StudentView[];
  predictions: PredictionView[];
}

export function StudentRiskTable({ students, predictions }: StudentRiskTableProps) {
  const rows = useMemo(
    () =>
      students.map((s) => {
        const pred = predictions.find((p) => p.studentId === s.studentId);
        const grade = pred ? scoreToGrade(pred.predictedScore) : null;
        return { student: s, prediction: pred, grade };
      }),
    [students, predictions]
  );

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex justify-between items-center px-6 py-5">
        <h3 className="text-lg font-bold text-white">Student Risk Analysis</h3>
        <button className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 pb-8 text-center text-slate-600 text-sm font-medium">
          No students in the system yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="risk-table w-full text-left">
            <thead>
              <tr className="bg-white/[0.02]">
                <th>Student Name</th>
                <th>Student ID</th>
                <th>Current Grade</th>
                <th>Risk Score</th>
                <th>Predicted Risk Level</th>
                <th>Key Factors</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ student, prediction, grade }) => (
                <tr key={student.studentId}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 flex items-center justify-center text-xs font-bold text-indigo-300 border border-indigo-500/20">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="font-semibold text-white text-sm">{student.name}</span>
                    </div>
                  </td>
                  <td className="font-mono text-slate-400 text-sm">{student.studentId}</td>
                  <td>
                    {grade ? (
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${grade.css}`}
                      >
                        {grade.letter}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="font-mono text-white text-sm font-semibold">
                    {prediction ? `${Math.round(prediction.predictedScore)}%` : "—"}
                  </td>
                  <td>
                    {prediction ? (
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${riskCss(
                          prediction.riskLevel
                        )}`}
                      >
                        {prediction.riskLevel} Risk
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">Pending</span>
                    )}
                  </td>
                  <td className="text-sm text-slate-400 max-w-[200px]">
                    {getKeyFactors(student, prediction)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
