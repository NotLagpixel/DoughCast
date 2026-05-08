import { useEffect, useState, useCallback, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  TrendingUp, TrendingDown, Sparkles, CloudSun, Calendar, RefreshCw, Plus,
  Activity, AlertTriangle, MapPin, PartyPopper, Trash2, Check, Loader2, MoonStar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";
import LogBatchDialog from "@/components/LogBatchDialog";
import SalesTrendChart from "@/components/SalesTrendChart";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Link } from "react-router-dom";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// JS getDay(): 0=Sun..6=Sat. Python weekday(): 0=Mon..6=Sun. Backend uses Python convention.

const fmtDateShort = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function Dashboard() {
  const { user } = useAuth();
  const [forecast, setForecast] = useState(null);
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved
  const hasLoadedOnce = useRef(false);
  const lastSavedSerialized = useRef(null);
  const saveTimerRef = useRef(null);

  const loadAll = useCallback(async () => {
    try {
      const [f, b, s, st] = await Promise.all([
        api.get("/forecast/tomorrow"),
        api.get("/batches"),
        api.get("/settings"),
        api.get("/stats"),
      ]);
      setForecast(f.data);
      setBatches(b.data);
      setStats(st.data);
      setSettings(s.data);
      lastSavedSerialized.current = JSON.stringify(s.data);
      hasLoadedOnce.current = true;
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Could not load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh forecast/stats without resetting settings draft
  const refreshDerived = useCallback(async () => {
    try {
      const [f, st] = await Promise.all([
        api.get("/forecast/tomorrow"),
        api.get("/stats"),
      ]);
      setForecast(f.data);
      setStats(st.data);
    } catch (e) {
      // silent
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Real-time: refresh when tab regains focus
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) refreshDerived();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refreshDerived]);

  // Debounced auto-save on any settings change
  useEffect(() => {
    if (!settings || !hasLoadedOnce.current) return;
    const current = JSON.stringify(settings);
    if (current === lastSavedSerialized.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.put("/settings", {
          bakery_name: settings.bakery_name,
          location_label: settings.location_label,
          latitude: Number(settings.latitude),
          longitude: Number(settings.longitude),
          use_weather: settings.use_weather,
          use_holidays: settings.use_holidays,
          conservative_buffer: Number(settings.conservative_buffer),
          flavors: settings.flavors,
        });
        lastSavedSerialized.current = JSON.stringify(data);
        setSaveStatus("saved");
        refreshDerived();
        // fade indicator back to idle
        setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 1400);
      } catch (e) {
        setSaveStatus("idle");
        toast.error(formatApiErrorDetail(e.response?.data?.detail) || "Auto-save failed");
      }
    }, 650);

    return () => saveTimerRef.current && clearTimeout(saveTimerRef.current);
  }, [settings, refreshDerived]);

  const refresh = async () => {
    setRefreshing(true);
    await loadAll();
    toast.success("Forecast refreshed");
  };

  const updateSetting = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const deleteBatch = async (id) => {
    try {
      await api.delete(`/batches/${id}`);
      toast.success("Batch removed");
      await loadAll();
    } catch (e) {
      toast.error("Could not delete");
    }
  };

  const updateFlavor = (idx, patch) => {
    const flavors = [...settings.flavors];
    flavors[idx] = { ...flavors[idx], ...patch };
    updateSetting({ flavors });
  };
  const addFlavor = () => updateSetting({ flavors: [...settings.flavors, { name: "New flavor", weight: 5 }] });
  const removeFlavor = (idx) => {
    const flavors = settings.flavors.filter((_, i) => i !== idx);
    updateSetting({ flavors });
  };

  if (loading || !forecast || !settings) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] pb-32 md:pb-0">
        <Navbar variant="app" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-[#795548] text-sm">Loading dashboard…</div>
        </div>
        <MobileBottomNav active="dashboard" />
      </div>
    );
  }

  const today = new Date();
  const todayLabel = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const tomorrowLabel = new Date(forecast.target_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  const statCards = [
    { label: "Forecast accuracy", value: stats?.total_baked_7d ? `${stats.accuracy_pct}%` : "—",
      hint: stats?.total_baked_7d ? "last 7 days" : "log batches to compute", icon: Activity },
    { label: "Avg waste / day", value: stats ? stats.avg_waste_per_day : 0, hint: `${stats?.total_waste_7d || 0} total waste 7d`, icon: TrendingDown },
    { label: "Stockouts (7d)", value: stats?.stockouts_7d ?? 0, hint: "days you sold out", icon: AlertTriangle },
    { label: "Total sold (7d)", value: stats?.total_sold_7d ?? 0, hint: stats?.week_over_week_change ? `${stats.week_over_week_change > 0 ? "+" : ""}${stats.week_over_week_change}% WoW` : "—", icon: TrendingUp },
  ];

  const SaveIndicator = () => {
    if (saveStatus === "saving") {
      return (
        <span data-testid="settings-save-status" className="flex items-center gap-1.5 text-xs text-[#795548]">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </span>
      );
    }
    if (saveStatus === "saved") {
      return (
        <span data-testid="settings-save-status" className="flex items-center gap-1.5 text-xs text-[#4CAF50]">
          <Check className="h-3 w-3" /> All saved
        </span>
      );
    }
    return (
      <span data-testid="settings-save-status" className="text-xs text-[#A1887F]">
        Auto-saving
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32 md:pb-0">
      <Navbar variant="app" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 fade-in-up">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#795548]">{todayLabel}</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#3E2723] tracking-tight">
              {settings.bakery_name || user?.bakery_name || "Your bakery"}
            </h1>
            <p className="mt-1.5 text-sm text-[#795548]">
              {batches.length === 0
                ? "Log your first batch to start training the forecast."
                : `${batches.length} day${batches.length === 1 ? "" : "s"} of data feeding tomorrow's prediction.`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={refresh}
              disabled={refreshing}
              data-testid="dashboard-refresh-btn"
              className="rounded-full border-[#EAE0D5] bg-white hover:bg-[#F4F0EA] text-[#3E2723]"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button
              onClick={() => setLogOpen(true)}
              data-testid="dashboard-log-batch-btn"
              className="rounded-full bg-[#D95A4E] hover:bg-[#C2493D] text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Log batch
            </Button>
          </div>
        </div>

        {/* PREDICTION HERO */}
        <section data-testid="prediction-hero" className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5 stagger">
          <Card className={`lg:col-span-2 rounded-3xl border-[#EAE0D5] text-white overflow-hidden relative ${
            forecast.is_closed
              ? "bg-gradient-to-br from-[#5C4A45] to-[#7A6861]"
              : "bg-gradient-to-br from-[#3E2723] to-[#5D3A33]"
          }`}>
            <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />
            <CardContent className="relative p-7 sm:p-10">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FAD4D0]" />
                  <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#FAD4D0]">
                    {tomorrowLabel} · predicted bake
                  </p>
                </div>
                {forecast.is_closed && (
                  <Badge
                    data-testid="forecast-closed-badge"
                    className="rounded-full bg-[#F4F0EA] text-[#3E2723] hover:bg-[#F4F0EA] border-0 flex items-center gap-1"
                  >
                    <MoonStar className="h-3 w-3" />
                    {forecast.closed_reason || "Typically closed"}
                  </Badge>
                )}
              </div>
              <div className={`mt-6 flex items-end gap-4 flex-wrap ${forecast.is_closed ? "opacity-70" : ""}`}>
                <p data-testid="forecast-predicted-value" className="font-display text-6xl sm:text-7xl font-semibold tracking-tight">
                  {forecast.predicted}
                </p>
                <p className="font-display text-2xl text-white/70 mb-2">mochi donuts</p>
              </div>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <Badge data-testid="forecast-confidence-badge" className="rounded-full bg-[#FAD4D0] text-[#C2493D] hover:bg-[#FAD4D0] border-0">
                  {forecast.confidence}% confidence
                </Badge>
                <span className="text-sm text-white/70">Range: {forecast.range_low} – {forecast.range_high}</span>
                <span className="text-xs text-white/50">· baseline {forecast.baseline}</span>
              </div>

              <Separator className="my-7 bg-white/10" />

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60">Weather</p>
                  <p className="mt-1.5 flex items-center gap-1.5 font-medium" data-testid="forecast-weather">
                    <CloudSun className="h-4 w-4 text-[#E8A365]" /> {forecast.weather_label}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60">Day</p>
                  <p className="mt-1.5 flex items-center gap-1.5 font-medium">
                    <Calendar className="h-4 w-4 text-[#E8A365]" /> {forecast.weekday}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/60">Holiday</p>
                  <p className="mt-1.5 flex items-center gap-1.5 font-medium" data-testid="forecast-holiday">
                    <PartyPopper className="h-4 w-4 text-[#E8A365]" />
                    {forecast.is_holiday ? forecast.holiday_name : "None"}
                  </p>
                </div>
              </div>

              {forecast.notes?.length > 0 && (
                <div className="mt-5 text-xs text-white/70 space-y-1">
                  {forecast.notes.map((n, i) => (
                    <p key={i} data-testid={`forecast-note-${i}`}>· {n}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flavor mix */}
          <Card data-testid="flavor-breakdown-card" className="rounded-3xl border-[#EAE0D5] bg-white">
            <CardHeader className="p-7 pb-3">
              <CardTitle className="font-display text-lg text-[#3E2723] flex items-center justify-between">
                Flavor mix
                <Badge variant="outline" className="rounded-full border-[#EAE0D5] text-[#795548] font-normal">
                  tomorrow
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-7 pb-7 space-y-3">
              {forecast.flavors.map((f) => (
                <div key={f.name} data-testid={`flavor-row-${f.name.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[#3E2723]">{f.name}</span>
                    <span className="font-mono text-[#795548]">
                      {f.qty} <span className="text-[#A1887F]">· {f.share}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-[#F4F0EA] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#D95A4E] to-[#E8A365]"
                      style={{ width: `${Math.max(2, f.share)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* STATS */}
        <section className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {statCards.map((s) => (
            <Card
              key={s.label}
              data-testid={`stat-card-${s.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="rounded-2xl border-[#EAE0D5] bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.18em] font-bold text-[#795548]">{s.label}</p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAD4D0] text-[#C2493D]">
                    <s.icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl font-semibold text-[#3E2723] tracking-tight">{s.value}</p>
                <p className="mt-1 text-xs text-[#795548]">{s.hint}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* CHART + SETTINGS */}
        <section id="forecast" className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card data-testid="sales-trend-card" className="lg:col-span-2 rounded-3xl border-[#EAE0D5] bg-white">
            <CardHeader className="p-7 pb-3">
              <CardTitle className="font-display text-lg text-[#3E2723]">Sales trend</CardTitle>
              <p className="text-xs text-[#795548] mt-1">
                Sold vs. baked, with tomorrow's prediction overlaid
              </p>
            </CardHeader>
            <CardContent className="px-3 sm:px-7 pb-7">
              <SalesTrendChart
                batches={batches}
                predicted={forecast.predicted}
                predictedLow={forecast.range_low}
                predictedHigh={forecast.range_high}
                targetDate={forecast.target_date}
              />
            </CardContent>
          </Card>

          {/* Settings */}
          <Card id="settings" data-testid="inventory-settings-card" className="rounded-3xl border-[#EAE0D5] bg-white">
            <CardHeader className="p-7 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-lg text-[#3E2723]">Bakery settings</CardTitle>
                  <p className="text-xs text-[#795548] mt-1">Tune how forecasts are generated</p>
                </div>
                <SaveIndicator />
              </div>
              <Link
                to="/account"
                data-testid="settings-account-link"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#D95A4E] hover:underline"
              >
                Manage profile & password →
              </Link>
            </CardHeader>
            <CardContent className="px-7 pb-7 space-y-5">
              <div>
                <Label className="text-sm font-medium text-[#3E2723]">Bakery name</Label>
                <Input
                  value={settings.bakery_name}
                  onChange={(e) => updateSetting({ bakery_name: e.target.value })}
                  data-testid="setting-bakery-name"
                  className="mt-1.5 h-10 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E]"
                />
                <p className="text-xs text-[#795548] mt-1">Shown at the top of your dashboard.</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#3E2723] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Location (for weather)
                </Label>
                <Input
                  placeholder="City, State"
                  value={settings.location_label}
                  onChange={(e) => updateSetting({ location_label: e.target.value })}
                  data-testid="setting-location-label"
                  className="mt-1.5 h-10 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E]"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number" step="0.0001" placeholder="Latitude"
                    value={settings.latitude}
                    onChange={(e) => updateSetting({ latitude: e.target.value })}
                    data-testid="setting-latitude"
                    className="h-10 rounded-xl bg-white border-[#EAE0D5] text-sm"
                  />
                  <Input
                    type="number" step="0.0001" placeholder="Longitude"
                    value={settings.longitude}
                    onChange={(e) => updateSetting({ longitude: e.target.value })}
                    data-testid="setting-longitude"
                    className="h-10 rounded-xl bg-white border-[#EAE0D5] text-sm"
                  />
                </div>
                <p className="text-xs text-[#795548] mt-1">Coordinates power the live weather adjustment.</p>
              </div>

              <Separator className="bg-[#EAE0D5]" />

              <div>
                <Label className="text-sm font-medium text-[#3E2723] flex items-center gap-1.5">
                  <MoonStar className="h-3.5 w-3.5" /> Closed days
                </Label>
                <p className="text-xs text-[#795548] mt-0.5">Tap the days your shop is typically closed.</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5" data-testid="closed-days-picker">
                  {DAYS.map((d, i) => {
                    const active = (settings.closed_days || []).includes(i);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const current = new Set(settings.closed_days || []);
                          if (current.has(i)) current.delete(i); else current.add(i);
                          updateSetting({ closed_days: Array.from(current).sort() });
                        }}
                        data-testid={`closed-day-${d.toLowerCase()}`}
                        aria-pressed={active}
                        className={`h-9 px-3 rounded-full text-xs font-semibold transition-colors border ${
                          active
                            ? "bg-[#3E2723] text-white border-[#3E2723]"
                            : "bg-white text-[#795548] border-[#EAE0D5] hover:bg-[#F4F0EA]"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-[#EAE0D5]" />

              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-sm font-medium text-[#3E2723]">Use weather data</Label>
                  <p className="text-xs text-[#795548]">Sun boosts demand, rain/snow reduces it.</p>
                </div>
                <Switch
                  data-testid="setting-weather-switch"
                  checked={settings.use_weather}
                  onCheckedChange={(v) => updateSetting({ use_weather: v })}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-sm font-medium text-[#3E2723]">Holiday awareness</Label>
                  <p className="text-xs text-[#795548]">+25% bump on US holidays.</p>
                </div>
                <Switch
                  data-testid="setting-holiday-switch"
                  checked={settings.use_holidays}
                  onCheckedChange={(v) => updateSetting({ use_holidays: v })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-[#3E2723]">Conservative mode</Label>
                  <span className="font-mono text-xs text-[#795548]">
                    -{Math.round((Number(settings.conservative_buffer) || 0) * 100)}%
                  </span>
                </div>
                <Slider
                  data-testid="setting-conservative-slider"
                  value={[Number(settings.conservative_buffer) || 0]}
                  onValueChange={(v) => updateSetting({ conservative_buffer: v[0] })}
                  min={0} max={0.4} step={0.01}
                  className="[&_[role=slider]]:bg-[#D95A4E] [&_[role=slider]]:border-[#D95A4E]"
                />
                <p className="text-xs text-[#795548] mt-1.5">Lean toward less waste — shaves the prediction.</p>
              </div>

              <Separator className="bg-[#EAE0D5]" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Label className="text-sm font-medium text-[#3E2723]">Flavor mix</Label>
                    <p className="text-xs text-[#795548]">Weights split tomorrow's total across flavors.</p>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={addFlavor}
                    data-testid="add-flavor-btn"
                    className="rounded-full text-[#D95A4E] hover:bg-[#FAD4D0] h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {settings.flavors.map((f, i) => (
                    <div key={i} className="flex gap-2 items-center" data-testid={`flavor-edit-${i}`}>
                      <Input
                        value={f.name}
                        onChange={(e) => updateFlavor(i, { name: e.target.value })}
                        className="h-9 rounded-xl bg-white border-[#EAE0D5] text-sm flex-1"
                      />
                      <Input
                        type="number" min="1" max="100"
                        value={f.weight}
                        onChange={(e) => updateFlavor(i, { weight: Number(e.target.value) || 1 })}
                        className="h-9 w-16 rounded-xl bg-white border-[#EAE0D5] text-sm font-mono"
                      />
                      <button
                        onClick={() => removeFlavor(i)}
                        data-testid={`remove-flavor-${i}`}
                        className="text-[#A1887F] hover:text-[#D95A4E] p-1.5 rounded-full hover:bg-[#FAD4D0]"
                        aria-label="Remove flavor"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* RECENT BATCHES */}
        <section className="mt-6">
          <Card data-testid="recent-batches-card" className="rounded-3xl border-[#EAE0D5] bg-white">
            <CardHeader className="p-7 pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="font-display text-lg text-[#3E2723]">Your batches</CardTitle>
                <p className="text-xs text-[#795548] mt-1">
                  {batches.length === 0 ? "Nothing logged yet — add your first day." : `Showing ${batches.length} day${batches.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <Button
                onClick={() => setLogOpen(true)}
                variant="ghost"
                data-testid="batches-add-btn"
                className="rounded-full text-[#D95A4E] hover:bg-[#FAD4D0] hover:text-[#C2493D]"
              >
                <Plus className="h-4 w-4 mr-1" /> Add day
              </Button>
            </CardHeader>
            <CardContent className="px-2 sm:px-4 pb-4">
              {batches.length === 0 ? (
                <div className="text-center py-10 text-[#795548] text-sm" data-testid="batches-empty-state">
                  Once you log a batch it will appear here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#EAE0D5] hover:bg-transparent">
                        <TableHead className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#795548]">Date</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#795548]">Baked</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#795548]">Sold</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#795548]">Waste</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#795548]">Note</TableHead>
                        <TableHead className="text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...batches].reverse().map((b) => (
                        <TableRow
                          key={b.id}
                          data-testid={`batch-row-${b.date}`}
                          className="border-[#EAE0D5] hover:bg-[#FDFBF7]"
                        >
                          <TableCell className="font-medium text-[#3E2723]">{fmtDateShort(b.date)}</TableCell>
                          <TableCell className="font-mono text-[#3E2723]">{b.baked}</TableCell>
                          <TableCell className="font-mono text-[#3E2723]">{b.sold}</TableCell>
                          <TableCell className="font-mono text-[#795548]">{b.waste}</TableCell>
                          <TableCell className="text-[#795548] text-sm max-w-[180px] truncate">{b.note || "—"}</TableCell>
                          <TableCell className="text-right">
                            <button
                              onClick={() => deleteBatch(b.id)}
                              data-testid={`delete-batch-${b.date}`}
                              className="text-[#A1887F] hover:text-[#D95A4E] p-1.5 rounded-full hover:bg-[#FAD4D0]"
                              aria-label="Delete batch"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <LogBatchDialog open={logOpen} onOpenChange={setLogOpen} onSaved={loadAll} />
      <MobileBottomNav active="dashboard" onLogBatch={() => setLogOpen(true)} />
    </div>
  );
}
