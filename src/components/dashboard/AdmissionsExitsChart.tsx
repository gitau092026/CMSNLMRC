import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface AdmissionsExitsChartProps {
  data: { month: string; admissions: number; exits: number }[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-xl p-3 text-sm min-w-[150px]">
        <p className="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wide">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center justify-between gap-6 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: p.fill }} />
              <span className="text-slate-500 text-xs">{p.name}</span>
            </div>
            <span className="font-bold text-slate-800">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AdmissionsExitsChart = ({ data, loading }: AdmissionsExitsChartProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-2 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
          Admissions
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
          Exits
        </div>
      </div>
      <div className="h-[220px] w-full">
        {loading ? (
          <div className="w-full h-full flex flex-col gap-3 p-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-full rounded" style={{ width: `${60 + i * 8}%` }} />
            ))}
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 4 }} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                dx={-4}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)", radius: 4 }} />
              <Bar dataKey="admissions" name="Admissions" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="exits" name="Exits" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed rounded-xl border-slate-100">
            <p className="text-sm font-medium text-slate-400">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};
