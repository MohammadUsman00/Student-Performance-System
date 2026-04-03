import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { StudentCard } from "./StudentCard";
import type { StudentView, PredictionView } from "../../hooks/useStudentData";

type RiskFilter = "all" | "High" | "Medium" | "Low";

interface StudentListProps {
  students: StudentView[];
  predictions: PredictionView[];
  /** If true, only show students flagged as High risk. */
  riskPoolMode?: boolean;
}

export function StudentList({ students, predictions, riskPoolMode }: StudentListProps) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>(riskPoolMode ? "High" : "all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filtered = useMemo(() => {
    let list = students;

    // Search by name or studentId
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q)
      );
    }

    // Risk filter
    const activeFilter = riskPoolMode ? "High" : riskFilter;
    if (activeFilter !== "all") {
      list = list.filter((s) => {
        const pred = predictions.find((p) => p.studentId === s.studentId);
        return pred?.riskLevel === activeFilter;
      });
    }

    return list;
  }, [students, predictions, search, riskFilter, riskPoolMode]);

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-white tracking-tight">
          {riskPoolMode ? "Risk Pool — High Risk Students" : "Scholastic Index"}
        </h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 transition-all"
            />
          </div>
          {!riskPoolMode && (
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu((v) => !v)}
                className={`glass px-4 py-2.5 rounded-xl border-white/10 transition-colors ${
                  riskFilter !== "all" ? "text-blue-400" : "text-slate-400 hover:text-white"
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-12 z-20 glass-card rounded-xl p-2 min-w-[140px] space-y-1 shadow-2xl border border-white/10">
                  {(["all", "Low", "Medium", "High"] as RiskFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setRiskFilter(f);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                        riskFilter === f
                          ? "bg-blue-500/20 text-blue-400"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {f === "all" ? "All Risks" : `${f} Risk`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl px-8 py-16 text-center text-slate-600 text-sm font-medium">
          {search.trim()
            ? "No students match your search."
            : riskPoolMode
            ? "No high-risk students detected."
            : "No students in the system yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((student) => {
            const prediction = predictions.find(
              (p) => p.studentId === student.studentId
            );
            return (
              <StudentCard
                key={student.studentId}
                name={student.name}
                studentId={student.studentId}
                studytime={student.studytime}
                absences={student.absences}
                prediction={prediction}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
