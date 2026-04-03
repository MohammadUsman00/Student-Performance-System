import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useMemo } from "react";
import type { PredictionView } from "../../hooks/useStudentData";

const GRADE_COLORS: Record<string, string> = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  E: "#ef4444",
  F: "#ef4444",
};

function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  if (score >= 50) return "E";
  return "F";
}

interface GradeDistributionProps {
  predictions: PredictionView[];
}

export function GradeDistribution({ predictions }: GradeDistributionProps) {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    for (const p of predictions) {
      const grade = scoreToGrade(p.predictedScore);
      counts[grade]++;
    }
    return Object.entries(counts).map(([grade, count]) => ({
      grade,
      count,
      fill: GRADE_COLORS[grade],
    }));
  }, [predictions]);

  const hasData = predictions.length > 0;

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Grade Distribution</h3>
        <span className="chart-tag">Bar Chart</span>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center h-[280px] text-slate-600 text-sm font-medium">
          Run predictions to see grade distribution.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="grade"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 700 }}
              dy={5}
              label={{ value: "Student Count", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              label={{ value: "Student Count", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11, fontWeight: 600, dx: -5 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111836",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#f1f5f9",
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.75} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
