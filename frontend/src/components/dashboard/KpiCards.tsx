import { Users, AlertTriangle, TrendingUp } from "lucide-react";
import { StatCard } from "../ui/StatCard";

interface KpiCardsProps {
  totalStudents: number;
  highRiskCount: number;
  avgScore: string | number;
}

export function KpiCards({
  totalStudents,
  highRiskCount,
  avgScore,
}: KpiCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Total Students"
        value={totalStudents.toLocaleString()}
        subtitle={`${Math.max(1, Math.floor(totalStudents * 0.8))} Active`}
        icon={Users}
        color="green"
      />
      <StatCard
        title="High Risk Students"
        value={highRiskCount}
        subtitle={highRiskCount > 0 ? "Needs attention" : "No concerns"}
        icon={AlertTriangle}
        color="red"
      />
      <StatCard
        title="Average Score"
        value={typeof avgScore === "number" ? `${avgScore}%` : avgScore === "N/A" ? "N/A" : `${avgScore}%`}
        subtitle="+1.2%"
        icon={TrendingUp}
        color="purple"
      />
    </div>
  );
}
