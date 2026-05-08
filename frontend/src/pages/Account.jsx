import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import AccountTab from "@/components/AccountTab";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function Account() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32 md:pb-0">
      <Navbar variant="app" />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Link
          to="/dashboard"
          data-testid="account-back-link"
          className="inline-flex items-center gap-1.5 text-sm text-[#795548] hover:text-[#3E2723] mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="mb-7 fade-in-up">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#795548]">
            Profile & settings
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#3E2723] tracking-tight">
            Your account
          </h1>
          <p className="mt-1.5 text-sm text-[#795548]">
            Update your profile picture, login details, and password.
          </p>
        </div>

        <Card data-testid="account-card" className="rounded-3xl border-[#EAE0D5] bg-white">
          <CardContent className="p-7 sm:p-9">
            <AccountTab />
          </CardContent>
        </Card>
      </main>

      <MobileBottomNav active="account" />
    </div>
  );
}
