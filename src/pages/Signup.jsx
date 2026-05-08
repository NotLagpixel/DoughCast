import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Donut, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

const perks = [
  "Daily mochi donut forecast tuned to your shop",
  "Custom datasets — your numbers, your model",
  "Weather + holiday signals included",
  "Free, forever",
];

export default function Signup() {
  const [bakery, setBakery] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(email, password, bakery);
      toast.success("Welcome to DoughCast!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] grid lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img
          src="https://images.unsplash.com/photo-1775906010906-766c9de3017f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwzfHxkb251dHMlMjBiYWtlcnklMjBkaXNwbGF5fGVufDB8fHx8MTc3NzY4MzAyNHww&ixlib=rb-4.1.0&q=85"
          alt="Donut display"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#3E2723]/75 via-[#3E2723]/45 to-[#E8A365]/40" />
        <div className="relative h-full flex flex-col justify-between p-10 text-white">
          <Link to="/" data-testid="signup-brand-link" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20">
              <Donut className="h-5 w-5" />
            </span>
            <span className="font-display font-semibold text-lg">DoughCast</span>
          </Link>
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#FAD4D0]">
              Join the bakery
            </p>
            <h2 className="mt-3 font-display text-3xl lg:text-4xl font-semibold tracking-tight">
              Plan less. Bake better. Sell out the right way.
            </h2>
            <ul className="mt-6 space-y-2.5 text-sm text-white/90">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <Check className="h-3 w-3" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md rounded-3xl border-[#EAE0D5] shadow-sm fade-in-up">
          <CardContent className="p-8 sm:p-10">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D95A4E] text-white">
                <Donut className="h-5 w-5" />
              </span>
              <span className="font-display font-semibold text-lg text-[#3E2723]">DoughCast</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#3E2723] tracking-tight">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-[#795548]">
              Free forever. No credit card.
            </p>

            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="bakery" className="text-sm font-medium text-[#795548] mb-1.5 block">
                  Bakery name
                </Label>
                <Input
                  id="bakery"
                  placeholder="Sunrise Donuts Co."
                  data-testid="signup-bakery-input"
                  value={bakery}
                  onChange={(e) => setBakery(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E] text-[#3E2723] placeholder:text-[#A1887F]"
                />
              </div>
              <div>
                <Label htmlFor="signup-email" className="text-sm font-medium text-[#795548] mb-1.5 block">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="baker@yourshop.com"
                  data-testid="signup-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E] text-[#3E2723] placeholder:text-[#A1887F]"
                />
              </div>
              <div>
                <Label htmlFor="signup-password" className="text-sm font-medium text-[#795548] mb-1.5 block">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="At least 6 characters"
                  data-testid="signup-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="h-11 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E] text-[#3E2723]"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                data-testid="signup-submit-btn"
                className="w-full h-11 rounded-full bg-[#D95A4E] hover:bg-[#C2493D] text-white font-medium"
              >
                {submitting ? "Creating…" : (<>Create account <ArrowRight className="ml-1.5 h-4 w-4" /></>)}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-[#795548]">
              Already have an account?{" "}
              <Link
                to="/login"
                data-testid="signup-login-link"
                className="font-medium text-[#D95A4E] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
