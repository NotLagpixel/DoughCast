import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";

const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const SalesTrendChart = ({ batches, predicted, predictedLow, predictedHigh, targetDate }) => {
  if (!batches || batches.length === 0) {
    return (
      <div
        data-testid="chart-empty-state"
        className="h-72 rounded-2xl bg-[#FDFBF7] border border-dashed border-[#EAE0D5] flex flex-col items-center justify-center text-center px-6"
      >
        <LineChartIcon className="h-7 w-7 text-[#A1887F]" />
        <p className="mt-2 text-sm font-medium text-[#3E2723]">
          Your trend chart will appear here
        </p>
        <p className="text-xs text-[#795548] mt-1 max-w-xs">
          Log a few days of batches and you'll see sold vs. baked plotted alongside tomorrow's prediction.
        </p>
      </div>
    );
  }

  const data = batches.map((b) => ({
    date: fmtDate(b.date),
    rawDate: b.date,
    Sold: b.sold,
    Baked: b.baked,
  }));

  if (predicted != null && targetDate) {
    data.push({
      date: fmtDate(targetDate),
      rawDate: targetDate,
      Predicted: predicted,
      PredLow: predictedLow,
      PredHigh: predictedHigh,
    });
  }

  return (
    <div data-testid="sales-trend-chart" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bakedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8A365" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#E8A365" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 5" stroke="#EAE0D5" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#A1887F"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#EAE0D5" }}
          />
          <YAxis
            stroke="#A1887F"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#EAE0D5" }}
            width={36}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #EAE0D5",
              fontFamily: "Manrope, sans-serif",
              fontSize: 12,
              backgroundColor: "#fff",
            }}
            labelStyle={{ color: "#3E2723", fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#795548", paddingTop: 8 }}
            iconType="circle"
          />
          <Area type="monotone" dataKey="Baked" stroke="#E8A365" strokeWidth={2} fill="url(#bakedFill)" />
          <Line type="monotone" dataKey="Sold" stroke="#D95A4E" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line
            type="monotone"
            dataKey="Predicted"
            stroke="#3E2723"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={{ r: 4, fill: "#3E2723" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesTrendChart;
