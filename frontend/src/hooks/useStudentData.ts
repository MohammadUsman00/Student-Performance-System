import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "../../../convex/_generated/api";

export interface StudentView {
  studentId: string;
  name: string;
  absences: number;
  previousMarks: number;
  studytime: number;
}

export interface PredictionView {
  studentId: string;
  predictedScore: number;
  riskLevel: string;
}

export function useStudentData() {
  const students = useQuery(api.students.list.list) ?? [];
  const predictions = useQuery(api.ml.predictions.getPredictions) ?? [];

  const totalStudents = students.length;

  const highRiskCount = useMemo(
    () => (predictions as PredictionView[]).filter((p) => p.riskLevel === "High").length,
    [predictions]
  );

  const avgScore = useMemo(() => {
    if (predictions.length === 0) return "N/A";
    const sum = (predictions as PredictionView[]).reduce((acc, p) => acc + p.predictedScore, 0);
    return (sum / predictions.length).toFixed(1);
  }, [predictions]);

  /** Chart data: per-student predicted vs previous scores. */
  const scoreChartData = useMemo(
    () =>
      (students as StudentView[]).slice(0, 10).map((s) => ({
        name: s.name.split(" ")[0],
        score:
          (predictions as PredictionView[]).find((p) => p.studentId === s.studentId)
            ?.predictedScore || 0,
        attendance: s.absences,
        prev: s.previousMarks,
      })),
    [students, predictions]
  );

  /** Pie chart data for risk distribution. */
  const riskPieData = useMemo(
    () =>
      [
        { name: "Low", value: (predictions as PredictionView[]).filter((p) => p.riskLevel === "Low").length },
        { name: "Medium", value: (predictions as PredictionView[]).filter((p) => p.riskLevel === "Medium").length },
        { name: "High", value: (predictions as PredictionView[]).filter((p) => p.riskLevel === "High").length },
      ].filter((d) => d.value > 0),
    [predictions]
  );

  return {
    students: students as StudentView[],
    predictions: predictions as PredictionView[],
    totalStudents,
    highRiskCount,
    avgScore,
    scoreChartData,
    riskPieData,
  };
}
