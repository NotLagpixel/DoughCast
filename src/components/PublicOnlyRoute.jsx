import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Donut } from "lucide-react";

export const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#795548]">
          <Donut className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Warming the oven…</span>
        </div>
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export default PublicOnlyRoute;
