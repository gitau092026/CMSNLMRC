import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface AftercareChartProps {
  data?: ChartData[];
  loading?: boolean;
}

const PALETTE = [
  "#3b82f6", "#8b5cf6", "#14b8a6", "#f59e0b", "#64748b", "#e11d48", "#0ea5e9"
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-xl p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: payload[0].payload.color }} />
          <span className="font-bold text-slate-800">{payload[0].name}</span>
        </div>
        <p className="text-slate-400 mt-1 text-xs">
          <span className="font-extrabold text-slate-900 text-base">{payload[0].value}</span> clients
        </p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.06) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function AftercareChart({ data, loading }: AftercareChartProps) {
  const enriched = (data || []).map((d, i) => ({
    ...d,
    color: d.color || (d.name === "Awaiting Placement" ? "#f59e0b" : PALETTE[i % PALETTE.length])
  }));
  const total = enriched.reduce((sum, d) => sum + d.value, 0);
  const placedTotal = enriched.filter(d => d.name !== "Awaiting Placement").reduce((sum, d) => sum + d.value, 0);
  const awaitingTotal = enriched.find(d => d.name === "Awaiting Placement")?.value || 0;
  const hasData = enriched.length > 0 && total > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Skeleton className="h-[140px] w-[140px] rounded-full" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="h-[200px] flex flex-col items-center justify-center text-slate-300 border-2 border-dashed rounded-xl border-slate-100">
        <p className="text-sm font-medium text-slate-400">No placement data</p>
      </div>
    );
  }

  return (
    <div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enriched}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
              animationDuration={700}
            >
              {enriched.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
        {enriched.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
              <span className="text-[11px] font-medium text-slate-500 truncate max-w-[130px]" title={entry.name}>{entry.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-800">{entry.value}</span>
              <span className="text-[10px] text-slate-400 w-7 text-right font-medium">
                {total > 0 ? `${Math.round((entry.value / total) * 100)}%` : "0%"}
              </span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Alumni</span>
          <div className="text-right">
            <span className="text-[11px] font-extrabold text-slate-800">{total}</span>
            {awaitingTotal > 0 && (
              <span className="text-[10px] text-slate-400 ml-1 font-medium">
                ({placedTotal} placed, {awaitingTotal} awaiting)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
