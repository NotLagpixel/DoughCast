import { Link } from "react-router-dom";
import { LayoutDashboard, Plus, UserCircle2 } from "lucide-react";

/**
 * Mobile-only bottom navigation. Hidden on md+ screens.
 * onLogBatch: callback to open the LogBatchDialog (only used on /dashboard).
 */
export const MobileBottomNav = ({ active, onLogBatch }) => {
  const items = [
    { key: "dashboard", to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { key: "log", label: "Log", icon: Plus, action: "log" },
    { key: "account", to: "/account", label: "Account", icon: UserCircle2 },
  ];

  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="md:hidden fixed bottom-16 inset-x-3 z-50"
    >
      <div className="mx-auto max-w-md rounded-full bg-white/95 backdrop-blur-xl border border-[#EAE0D5] shadow-lg flex items-center justify-around p-1.5">
        {items.map((it) => {
          const isActive = active === it.key;
          const Icon = it.icon;
          if (it.action === "log") {
            return (
              <button
                key={it.key}
                onClick={onLogBatch}
                data-testid="mobile-nav-log"
                disabled={!onLogBatch}
                className="flex flex-col items-center justify-center h-12 w-14 rounded-full bg-[#D95A4E] text-white shadow-md hover:bg-[#C2493D] transition-colors disabled:opacity-60"
                aria-label="Log batch"
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          }
          return (
            <Link
              key={it.key}
              to={it.to}
              data-testid={`mobile-nav-${it.key}`}
              className={`flex flex-col items-center justify-center h-12 px-4 rounded-full transition-colors ${
                isActive ? "bg-[#F4F0EA] text-[#3E2723]" : "text-[#795548] hover:bg-[#F4F0EA]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5 font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
