import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Home } from "lucide-react";

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
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function PlacementChart({ data, loading }: PlacementChartProps) {
  const enriched = (data || []).map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));
  const total = enriched.reduce((sum, d) => sum + d.value, 0);
  const hasData = enriched.length > 0 && total > 0;

  return (
    <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white h-full">
      <CardHeader className="pb-2 px-5 pt-5 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-50 rounded-lg">
            <Home className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Nature of Reunification</h3>
            <p className="text-xs text-slate-400 mt-0.5">Client reunification types</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-3">
        {loading ? (
          <div className="flex items-center justify-center h-[260px]">
            <Skeleton className="h-[150px] w-[150px] rounded-full" />
          </div>
        ) : hasData ? (
          <>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={enriched}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={82}
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
            <div className="mt-3 space-y-1.5 border-t border-slate-50 pt-3">
              {enriched.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                    <span className="text-xs font-medium text-slate-500 truncate max-w-[120px]" title={entry.name}>{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{entry.value}</span>
                    <span className="text-[10px] text-slate-300 w-8 text-right">
                      {total > 0 ? `${Math.round((entry.value / total) * 100)}%` : "0%"}
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                <span className="text-xs font-semibold text-slate-400">Total Reunified</span>
                <span className="text-xs font-extrabold text-slate-800">{total}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-[260px] flex flex-col items-center justify-center text-slate-300 border-2 border-dashed rounded-xl border-slate-100">
            <Home className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm font-medium text-slate-400">No reunification data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
