import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Donut, LayoutDashboard, LineChart, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const Navbar = ({ variant = "marketing" }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
  };
  const initials = (user?.bakery_name || user?.email || "BB").slice(0, 2).toUpperCase();

  const isActive = (path) => location.pathname === path;

  const navLinks =
    variant === "app"
      ? [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { to: "/dashboard#forecast", label: "Forecast", icon: LineChart },
          { to: "/dashboard#settings", label: "Settings", icon: Settings },
        ]
      : [
          { to: "/#features", label: "Features" },
          { to: "/#how-it-works", label: "How it works" },
          { to: "/#pricing", label: "Pricing" },
        ];

  return (
    <header
      data-testid="main-navbar"
      className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#FDFBF7]/80 border-b border-[#EAE0D5]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            data-testid="navbar-brand-link"
            className="flex items-center gap-2 group"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D95A4E] text-white shadow-sm group-hover:rotate-12 transition-transform duration-300">
              <Donut className="h-5 w-5" />
            </span>
            <span className="font-display font-semibold text-lg text-[#3E2723] tracking-tight">
              DoughCast
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                data-testid={`navbar-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "bg-[#F4F0EA] text-[#3E2723]"
                    : "text-[#795548] hover:text-[#3E2723] hover:bg-[#F4F0EA]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            {variant === "app" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="navbar-user-menu-trigger"
                    className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-[#F4F0EA] transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      {user?.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.bakery_name} /> : null}
                      <AvatarFallback className="bg-[#E8A365] text-white text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-[#3E2723] max-w-[140px] truncate">
                      {user?.bakery_name || "Baker"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <DropdownMenuLabel className="font-display">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild data-testid="user-menu-profile" className="rounded-lg cursor-pointer">
                    <Link to="/account">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile & Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} data-testid="user-menu-logout" className="rounded-lg text-[#D95A4E]">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  data-testid="navbar-login-btn"
                  className="rounded-full text-[#795548] hover:bg-[#F4F0EA] hover:text-[#3E2723]"
                >
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button
                  asChild
                  data-testid="navbar-signup-btn"
                  className="rounded-full bg-[#D95A4E] hover:bg-[#C2493D] text-white shadow-sm"
                >
                  <Link to="/signup">Start free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            data-testid="navbar-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#F4F0EA] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div data-testid="navbar-mobile-menu" className="md:hidden pb-4 pt-2 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                data-testid={`mobile-navbar-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-[#795548] hover:text-[#3E2723] hover:bg-[#F4F0EA]"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-[#EAE0D5] flex flex-col gap-2">
              {variant === "app" ? (
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  data-testid="mobile-navbar-logout"
                  className="w-full justify-start rounded-xl text-[#D95A4E]"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" data-testid="mobile-navbar-login" className="w-full rounded-full">
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild data-testid="mobile-navbar-signup" className="w-full rounded-full bg-[#D95A4E] hover:bg-[#C2493D] text-white">
                    <Link to="/signup">Start free</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
