import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface PerformanceChartProps {
  data: { name: string; score: number; prev: number }[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="col-span-2 glass-card p-8 rounded-3xl min-h-[450px]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">
            Performance Trajectory
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Predicted marks vs Previous performance
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 tracking-tighter uppercase">
            Predicted
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 tracking-tighter uppercase">
            Baseline
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[320px] text-slate-600 text-sm font-medium">
          No prediction data yet — run predictions to see the trajectory.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 12, fontWeight: 700 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 12, fontWeight: 700 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "16px",
                color: "#fff",
              }}
              itemStyle={{ color: "#60a5fa" }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorScore)"
            />
            <Area
              type="monotone"
              dataKey="prev"
              stroke="#8b5cf6"
              strokeWidth={4}
              strokeDasharray="5 5"
              fill="transparent"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
