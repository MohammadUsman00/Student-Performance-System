import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  HelpCircle,
} from "lucide-react";

export type TabId = "dashboard" | "students" | "models" | "settings" | "help";

const NAV_ITEMS: { id: TabId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "students", icon: Users, label: "Student List" },
  { id: "models", icon: FileText, label: "Reports" },
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "help", icon: HelpCircle, label: "Help" },
];

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="sidebar w-60 flex flex-col py-6 shrink-0">
      <nav className="space-y-1 px-4 mt-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`sidebar-item w-full ${
              activeTab === item.id ? "sidebar-item--active" : ""
            }`}
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
