const RISK_COLORS: Record<string, string> = {
  High: "risk-high",
  Medium: "risk-medium",
  Low: "risk-low",
};

export function RiskBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
        RISK_COLORS[level] || "bg-slate-500/20 text-slate-400 border border-slate-500/30"
      }`}
    >
      {level} Risk
    </span>
  );
}
