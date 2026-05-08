import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  TrendingUp,
  Sparkles,
  CloudSun,
  Calendar,
  ShieldCheck,
  Activity,
  Donut,
  Plus,
  LayoutDashboard as LayoutDashboardIcon,
  UserCircle2 as UserCircleIcon,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Probabilistic forecasts",
    body: "Get a confidence range for tomorrow's mochi donut demand — not just a single guess.",
  },
  {
    icon: CloudSun,
    title: "Weather + calendar aware",
    body: "Local weather and holidays automatically shape the prediction.",
  },
  {
    icon: Sparkles,
    title: "Flavor-level breakdown",
    body: "Forecasts per mochi flavor so you batch the right mix every morning.",
  },
  {
    icon: Activity,
    title: "Waste tracking",
    body: "Watch your over-bake rate trend down week over week.",
  },
  {
    icon: Calendar,
    title: "Daily & weekly views",
    body: "Plan tomorrow at a glance, or zoom out to the next 14 days.",
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    body: "Encrypted, owned by you, exportable any time.",
  },
];

const steps = [
  {
    n: "01",
    title: "Log yesterday's batch",
    body: "Enter how many you baked and how many sold — that's it.",
  },
  {
    n: "02",
    title: "We learn your rhythm",
    body: "Patterns emerge from days of the week, weather, and seasonality.",
  },
  {
    n: "03",
    title: "Bake the right amount",
    body: "Each evening you receive a clear quantity to prep for the next day.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar variant="marketing" />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="fade-in-up">
              <Badge
                data-testid="hero-badge"
                className="rounded-full bg-[#FAD4D0] text-[#C2493D] hover:bg-[#FAD4D0] border-0 px-3 py-1 font-medium"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Predictive baking, made simple
              </Badge>
              <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#3E2723] tracking-tight text-balance">
                Bake the right number of mochi donuts.
                <span className="block text-[#D95A4E]">Every single morning.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base sm:text-lg text-[#795548] leading-relaxed text-pretty">
                DoughCast turns your mochi donut sales history into tomorrow's batch plan. Less
                waste, fewer stockouts, and a calmer morning prep.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  size="lg"
                  data-testid="hero-cta-primary"
                  className="rounded-full bg-[#D95A4E] hover:bg-[#C2493D] text-white shadow-sm h-12 px-7"
                >
                  <Link to="/signup">
                    Get started — it's free <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  data-testid="hero-cta-secondary"
                  className="rounded-full border-[#EAE0D5] text-[#3E2723] hover:bg-[#F4F0EA] h-12 px-7"
                >
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>

              <div className="mt-10 flex items-center gap-6 text-xs text-[#795548]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#4CAF50]" />
                  Free, forever
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#E8A365]" />
                  Your data, your bakery
                </div>
              </div>
            </div>

            <div className="relative fade-in-up" style={{ animationDelay: "120ms" }}>
              <div className="absolute -inset-4 rounded-[2rem] bg-[#FAD4D0] -z-10 rotate-2" />
              <div className="relative overflow-hidden rounded-3xl border border-[#EAE0D5] shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1704500390269-1b226c48d130?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwyfHxiYWtlciUyMHdvcmtpbmclMjBtb3JuaW5nfGVufDB8fHx8MTc3NzY4MzAyNHww&ixlib=rb-4.1.0&q=85"
                  alt="Baker placing donuts in oven"
                  className="w-full h-[440px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3E2723]/50 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <Card className="rounded-2xl border-[#EAE0D5] bg-white/95 backdrop-blur shadow-md">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#795548]">
                          Tomorrow's bake
                        </p>
                        <p className="font-display text-2xl font-semibold text-[#3E2723] mt-1">
                          312 mochi donuts
                        </p>
                      </div>
                      <Badge className="rounded-full bg-[#FAD4D0] text-[#C2493D] hover:bg-[#FAD4D0] border-0">
                        92% confidence
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 lg:py-24 border-t border-[#EAE0D5] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#D95A4E]">Features</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-[#3E2723] tracking-tight">
              Everything a small bakery needs to plan with confidence.
            </h2>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {features.map((f) => (
              <Card
                key={f.title}
                data-testid={`feature-card-${f.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-2xl border-[#EAE0D5] bg-[#FDFBF7] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAD4D0] text-[#C2493D]">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display font-semibold text-lg text-[#3E2723]">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-[#795548] leading-relaxed">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 lg:py-24 bg-[#F4F0EA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#D95A4E]">How it works</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-[#3E2723] tracking-tight">
                Three steps. Zero spreadsheets.
              </h2>
              <p className="mt-4 text-[#795548] leading-relaxed max-w-lg">
                Built so a bakery owner with two minutes between batches can keep it running.
              </p>
            </div>
            <div className="space-y-4 stagger">
              {steps.map((s) => (
                <div
                  key={s.n}
                  data-testid={`how-step-${s.n}`}
                  className="flex gap-5 rounded-2xl border border-[#EAE0D5] bg-white p-6 hover:shadow-md transition-all duration-300"
                >
                  <span className="font-mono text-sm font-semibold text-[#D95A4E] shrink-0">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-[#3E2723]">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#795548]">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE PREVIEW */}
      <section id="mobile" className="py-20 lg:py-24 bg-white border-t border-[#EAE0D5] overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#D95A4E]">On the go</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-[#3E2723] tracking-tight text-balance">
                Built to live in your apron pocket.
              </h2>
              <p className="mt-4 text-[#795548] leading-relaxed max-w-lg">
                DoughCast is responsive end-to-end. Check tomorrow's forecast at the till, log
                a batch in two taps, and tweak your flavor mix on the bus home — same app, every screen.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-[#3E2723]">
                <li className="flex gap-2.5"><span className="h-1.5 w-1.5 rounded-full bg-[#D95A4E] mt-2" /> Sticky bottom bar for one-thumb logging</li>
                <li className="flex gap-2.5"><span className="h-1.5 w-1.5 rounded-full bg-[#D95A4E] mt-2" /> Auto-saves the moment you tap</li>
                <li className="flex gap-2.5"><span className="h-1.5 w-1.5 rounded-full bg-[#D95A4E] mt-2" /> Works offline-friendly on slow café Wi-Fi</li>
              </ul>
            </div>

            {/* Phone frame */}
            <div className="relative mx-auto" data-testid="mobile-preview-frame">
              <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-[#FAD4D0] via-[#F4F0EA] to-[#E8A365]/40 blur-3xl opacity-70 -z-10" />
              <div className="relative mx-auto w-[280px] sm:w-[320px] aspect-[9/19] rounded-[3rem] bg-[#3E2723] p-3 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 h-6 w-32 bg-[#3E2723] rounded-b-3xl z-10 flex items-end justify-center pb-1">
                  <div className="h-1.5 w-12 rounded-full bg-[#5D3A33]" />
                </div>
                {/* Screen */}
                <div className="relative h-full w-full rounded-[2.4rem] bg-[#FDFBF7] overflow-hidden">
                  <div className="px-4 pt-10 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D95A4E] text-white">
                          <Donut className="h-3 w-3" />
                        </span>
                        <span className="font-display text-xs font-semibold text-[#3E2723]">DoughCast</span>
                      </div>
                      <div className="h-6 w-6 rounded-full bg-[#E8A365] text-white text-[10px] font-semibold flex items-center justify-center">SM</div>
                    </div>
                  </div>

                  {/* Mini hero card */}
                  <div className="mx-3 mt-1 rounded-2xl bg-gradient-to-br from-[#3E2723] to-[#5D3A33] text-white p-4 relative overflow-hidden">
                    <div className="absolute inset-0 dot-pattern opacity-20" />
                    <div className="relative">
                      <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#FAD4D0]">
                        Tomorrow · predicted
                      </p>
                      <p className="font-display text-3xl font-semibold mt-2 leading-none">312</p>
                      <p className="text-[10px] text-white/70 mt-0.5">mochi donuts</p>
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="text-[8px] rounded-full bg-[#FAD4D0] text-[#C2493D] px-1.5 py-0.5 font-semibold">
                          92% confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="mx-3 mt-2 grid grid-cols-2 gap-2">
                    {[
                      { label: "Accuracy", value: "94%" },
                      { label: "Avg waste", value: "11" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-[#EAE0D5] bg-white p-2">
                        <p className="text-[8px] uppercase tracking-[0.18em] font-bold text-[#795548]">{s.label}</p>
                        <p className="font-display text-base font-semibold text-[#3E2723] mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mini flavor list */}
                  <div className="mx-3 mt-2 rounded-xl border border-[#EAE0D5] bg-white p-2.5">
                    <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#795548]">Flavors</p>
                    <div className="mt-1.5 space-y-1.5">
                      {[
                        { n: "Matcha", q: 75, w: 75 },
                        { n: "Ube", q: 62, w: 62 },
                        { n: "Strawberry", q: 50, w: 50 },
                      ].map((f) => (
                        <div key={f.n}>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#3E2723] font-medium">{f.n}</span>
                            <span className="text-[#795548] font-mono">{f.q}</span>
                          </div>
                          <div className="h-1 rounded-full bg-[#F4F0EA] overflow-hidden mt-0.5">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#D95A4E] to-[#E8A365]" style={{ width: `${f.w}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Floating bottom nav */}
                  <div className="absolute bottom-3 left-3 right-3 rounded-full bg-white/95 backdrop-blur border border-[#EAE0D5] shadow-md flex items-center justify-around py-1.5 px-1">
                    <div className="flex flex-col items-center px-2.5 py-0.5 rounded-full bg-[#F4F0EA]">
                      <LayoutDashboardIcon className="h-3.5 w-3.5 text-[#3E2723]" />
                      <span className="text-[7px] text-[#3E2723] font-semibold mt-0.5">Home</span>
                    </div>
                    <div className="flex items-center justify-center h-9 w-10 rounded-full bg-[#D95A4E] text-white shadow">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-center px-2.5 py-0.5 rounded-full">
                      <UserCircleIcon className="h-3.5 w-3.5 text-[#795548]" />
                      <span className="text-[7px] text-[#795548] font-medium mt-0.5">Account</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-20 lg:py-24 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#D95A4E]">Pricing</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-[#3E2723] tracking-tight">
            Free. Forever. Genuinely.
          </h2>
          <p className="mt-4 text-[#795548] max-w-xl mx-auto">
            DoughCast is free to use — log your batches, get tomorrow's prediction, tweak your settings. No paywalls.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              data-testid="pricing-cta-signup"
              className="rounded-full bg-[#D95A4E] hover:bg-[#C2493D] text-white h-12 px-7"
            >
              <Link to="/signup">Create your account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              data-testid="pricing-cta-dashboard"
              className="rounded-full text-[#795548] hover:bg-[#F4F0EA] h-12 px-7"
            >
              <Link to="/login">Sign in <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
