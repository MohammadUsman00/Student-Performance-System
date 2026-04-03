import { type LucideIcon } from "lucide-react";

export type StatCardColor = "green" | "red" | "purple" | "blue";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: StatCardColor;
}

export function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  const iconColors: Record<StatCardColor, string> = {
    green: "text-emerald-400",
    red: "text-red-400",
    purple: "text-purple-400",
    blue: "text-blue-400",
  };

  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">{title}</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs font-medium text-slate-500 mt-1.5">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl bg-white/5 ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
