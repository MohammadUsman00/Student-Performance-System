import { UserPlus, Upload } from "lucide-react";
import { StatusIndicator } from "../ui/StatusIndicator";

interface HeaderProps {
  mlOnline: boolean;
  mlTrained: boolean;
  mlChecked: boolean;
  onIngestClick: () => void;
  onDatasetClick: () => void;
}

export function Header({
  mlOnline,
  mlTrained,
  mlChecked,
  onIngestClick,
  onDatasetClick,
}: HeaderProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Student Performance Dashboard
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">
            {dateStr} | {timeStr}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusIndicator mlOnline={mlOnline} mlTrained={mlTrained} checked={mlChecked} />
          <button
            onClick={onDatasetClick}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-slate-300 hover:bg-white/8 hover:text-white transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Dataset
          </button>
          <button
            onClick={onIngestClick}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>
    </div>
  );
}
