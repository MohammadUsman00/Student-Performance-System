import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

interface RiskPieChartProps {
  data: { name: string; value: number }[];
  highRiskCount: number;
}

export function RiskPieChart({ data, highRiskCount }: RiskPieChartProps) {
  return (
    <div className="glass-card p-8 rounded-3xl flex flex-col">
      <h3 className="text-xl font-black text-white tracking-tight mb-8">
        Risk Stratification
      </h3>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[240px] text-slate-600 text-sm font-medium">
            No risk data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                innerRadius={75}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                    stroke="rgba(0,0,0,0)"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
        {data.length > 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-[-10px]">
            <p className="text-3xl font-black text-white">{highRiskCount}</p>
            <p className="text-[10px] font-black tracking-widest text-red-500 uppercase">
              Critical
            </p>
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-8">
          {data.map((d) => (
            <div
              key={d.name}
              className="bg-slate-900/50 p-2 rounded-xl border border-white/5 text-center"
            >
              <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                {d.name}
              </p>
              <p className="text-sm font-black text-white">{d.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
