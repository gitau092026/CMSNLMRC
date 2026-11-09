import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface PlacementChartProps {
  data?: ChartData[];
  loading?: boolean;
}

const PALETTE = [
  "#14b8a6", "#3b82f6", "#f59e0b", "#8b5cf6", "#64748b", "#e11d48"
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

export function PlacementChart({ data, loading }: PlacementChartProps) {
  const enriched = (data || []).map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));
  const total = enriched.reduce((sum, d) => sum + d.value, 0);
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
        <p className="text-sm font-medium text-slate-400">No reunification data</p>
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
              <span className="text-[11px] font-medium text-slate-500 truncate max-w-[110px]" title={entry.name}>{entry.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-800">{entry.value}</span>
              <span className="text-[10px] text-slate-300 w-7 text-right">
                {total > 0 ? `${Math.round((entry.value / total) * 100)}%` : "0%"}
              </span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-1">
          <span className="text-[11px] font-semibold text-slate-400">Total Reunified</span>
          <span className="text-[11px] font-extrabold text-slate-800">{total}</span>
        </div>
      </div>
    </div>
  );
}
