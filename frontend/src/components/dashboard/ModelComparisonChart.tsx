import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import type { Doc } from "../../../../convex/_generated/dataModel";

interface ModelComparisonChartProps {
  metrics: Doc<"modelMetrics">[];
}

export function ModelComparisonChart({ metrics }: ModelComparisonChartProps) {
  // Transform metrics into chart-friendly format
  const chartData = metrics.map((m, i) => ({
    name: m.modelName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    Accuracy: Math.round(m.accuracy * 100),
    Precision: Math.round(m.precision * 100),
    Recall: Math.round(m.recall * 100),
    epoch: (i + 1) * 33,
  }));

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Model Performance Comparison</h3>
        <span className="chart-tag">Line Chart</span>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-slate-600 text-sm font-medium">
          Train models to see performance comparison.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              label={{ value: "Metrics", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11, fontWeight: 600, dx: -5 }}
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
            <Legend
              wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 12 }}
              iconType="line"
            />
            <Line type="monotone" dataKey="Accuracy" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: "#3b82f6" }} />
            <Line type="monotone" dataKey="Precision" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: "#8b5cf6" }} />
            <Line type="monotone" dataKey="Recall" stroke="#ef4444" strokeWidth={3} dot={{ r: 5, fill: "#ef4444" }} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {chartData.length > 0 && (
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5 text-xs font-medium text-slate-500">
          {chartData.map((d) => (
            <span key={d.name}>● {d.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}
