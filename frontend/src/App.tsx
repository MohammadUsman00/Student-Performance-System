import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

import { TopBar } from "./components/layout/TopBar";
import { Sidebar, type TabId } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { KpiCards } from "./components/dashboard/KpiCards";
import { ModelComparisonChart } from "./components/dashboard/ModelComparisonChart";
import { GradeDistribution } from "./components/dashboard/GradeDistribution";
import { StudentRiskTable } from "./components/dashboard/StudentRiskTable";
import { ModelTable } from "./components/models/ModelTable";
import { StudentList } from "./components/students/StudentList";
import { IngestStudentModal } from "./components/students/IngestStudentModal";
import { DatasetUploadModal } from "./components/students/DatasetUploadModal";

import { useStudentData } from "./hooks/useStudentData";
import { useMlService } from "./hooks/useMlService";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [ingestOpen, setIngestOpen] = useState(false);
  const [datasetOpen, setDatasetOpen] = useState(false);

  // Data hooks
  const {
    students,
    predictions,
    totalStudents,
    highRiskCount,
    avgScore,
  } = useStudentData();

  const {
    modelMetrics,
    activeModelConfig,
    isTraining,
    isPredicting,
    mlHealth,
    handleTrain,
    handlePredictAll,
    predictSingle,
    setActiveModel,
  } = useMlService();

  const seedSampleData = useMutation(api.init.seed);
  const [seedStatus, setSeedStatus] = useState<"idle" | "loading" | "ok" | "skipped" | "error">("idle");
  const [seedDetail, setSeedDetail] = useState<string | null>(null);

  const handleSeedSampleData = useCallback(async () => {
    setSeedStatus("loading");
    setSeedDetail(null);
    try {
      const result = await seedSampleData();
      if (result?.skipped) {
        setSeedStatus("skipped");
        setSeedDetail(
          `Database already has ${result.existingCount} student(s).`
        );
      } else {
        setSeedStatus("ok");
        setSeedDetail(`Inserted ${result.insertedStudents} sample students.`);
      }
    } catch (e) {
      setSeedStatus("error");
      setSeedDetail(
        e instanceof Error ? e.message : "Seed failed."
      );
    }
  }, [seedSampleData]);

  const handlePredictStudent = useCallback(
    async (studentId: string) => {
      try {
        await predictSingle({ studentId });
      } catch (e) {
        console.error("Prediction failed:", e);
      }
    },
    [predictSingle]
  );

  return (
    <div className="min-h-screen bg-tech-pattern flex flex-col">
      {/* Top Bar */}
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 relative z-10">
          {/* Empty state / seed banner */}
          {totalStudents === 0 && (
            <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/8 px-5 py-4 animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-amber-200 font-medium">
                    No students yet. Seed sample data or upload a dataset to get started.
                  </p>
                  {seedDetail && (
                    <p className={`text-xs mt-1 ${seedStatus === "error" ? "text-red-300" : "text-amber-300/70"}`}>
                      {seedDetail}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={seedStatus === "loading"}
                  onClick={() => void handleSeedSampleData()}
                  className="shrink-0 rounded-lg bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/30 disabled:opacity-50 transition-all"
                >
                  {seedStatus === "loading" ? "Seeding…" : "Seed Sample Data"}
                </button>
              </div>
            </div>
          )}

          <Header
            mlOnline={mlHealth.online}
            mlTrained={mlHealth.trained}
            mlChecked={mlHealth.checked}
            onIngestClick={() => setIngestOpen(true)}
            onDatasetClick={() => setDatasetOpen(true)}
          />

          {/* ─── Dashboard Tab ─── */}
          {activeTab === "dashboard" && (
            <div className="animate-fade-in space-y-8">
              <KpiCards
                totalStudents={totalStudents}
                highRiskCount={highRiskCount}
                avgScore={avgScore}
              />

              {/* Charts Row */}
              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-3">
                  <ModelComparisonChart metrics={modelMetrics} />
                </div>
                <div className="col-span-2">
                  <GradeDistribution predictions={predictions} />
                </div>
              </div>

              {/* Risk Table */}
              <StudentRiskTable students={students} predictions={predictions} />
            </div>
          )}

          {/* ─── Student List Tab ─── */}
          {activeTab === "students" && (
            <div className="animate-fade-in">
              <StudentList students={students} predictions={predictions} />
            </div>
          )}

          {/* ─── Reports (Models) Tab ─── */}
          {activeTab === "models" && (
            <ModelTable
              modelMetrics={modelMetrics}
              activeModelName={activeModelConfig?.modelName}
              isTraining={isTraining}
              isPredicting={isPredicting}
              mlOnline={mlHealth.online}
              onTrain={handleTrain}
              onPredictAll={handlePredictAll}
              onSetActive={(modelName) => setActiveModel({ modelName })}
            />
          )}

          {/* ─── Settings Tab ─── */}
          {activeTab === "settings" && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
              <p className="text-slate-500 text-sm mb-8">System configuration and preferences</p>
              <div className="grid grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4">ML Service</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Endpoint</span>
                      <span className="font-mono text-slate-300">localhost:8000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className={mlHealth.online ? "text-emerald-400" : "text-red-400"}>
                        {mlHealth.online ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Models Trained</span>
                      <span className="text-slate-300">{mlHealth.trained ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4">Database</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Backend</span>
                      <span className="font-mono text-slate-300">Convex</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Students</span>
                      <span className="text-slate-300">{totalStudents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Predictions</span>
                      <span className="text-slate-300">{predictions.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Help Tab ─── */}
          {activeTab === "help" && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">Help</h2>
              <p className="text-slate-500 text-sm mb-8">Quick start guide</p>
              <div className="glass-card rounded-2xl p-8 space-y-6 max-w-2xl">
                {[
                  { step: "1", title: "Add Students", desc: "Use 'Add Student' for single entry or 'Upload Dataset' for bulk CSV import." },
                  { step: "2", title: "Train Models", desc: "Go to Reports tab and click 'Retrain Models' to train all ML algorithms." },
                  { step: "3", title: "Generate Predictions", desc: "Click 'Predict All' to generate risk scores for all students." },
                  { step: "4", title: "Analyze Results", desc: "View the Dashboard for charts, grade distribution, and the risk analysis table." },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-sm font-bold text-indigo-400 shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <IngestStudentModal
        open={ingestOpen}
        onOpenChange={setIngestOpen}
        onPredictStudent={handlePredictStudent}
        mlOnline={mlHealth.online}
      />
      <DatasetUploadModal
        open={datasetOpen}
        onOpenChange={setDatasetOpen}
      />
    </div>
  );
}
