import { Search, Bell, Menu } from "lucide-react";

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <div className="topbar h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Logo + Menu */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/25">
            A
          </div>
          <span className="text-lg font-extrabold text-white tracking-tight">
            Acade<span className="text-indigo-400">MLytics</span>
          </span>
        </div>
        <button
          onClick={onMenuClick}
          className="ml-4 p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Search */}
      <div className="relative w-80">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-white/5 border border-white/8 rounded-xl py-2 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/30 transition-all"
        />
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-5">
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/30">
            1
          </span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
            AT
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">A. Thompson</p>
            <p className="text-xs text-slate-500">Dean</p>
          </div>
        </div>
      </div>
    </div>
  );
}
