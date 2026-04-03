interface StatusIndicatorProps {
  mlOnline: boolean;
  mlTrained: boolean;
  checked: boolean;
}

export function StatusIndicator({ mlOnline, mlTrained, checked }: StatusIndicatorProps) {
  if (!checked) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/8">
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
        <span className="text-xs font-semibold text-slate-500">Checking…</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/8">
      <span
        className={`w-2 h-2 rounded-full ${
          mlOnline
            ? "bg-emerald-500 animate-pulse-glow"
            : "bg-red-500"
        }`}
      />
      <span
        className={`text-xs font-semibold ${
          mlOnline ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {mlOnline
          ? mlTrained
            ? "ML Ready"
            : "ML Online"
          : "ML Offline"}
      </span>
    </div>
  );
}
