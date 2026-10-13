import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart2 } from "lucide-react";
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
    <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white h-full">
      <CardHeader className="pb-2 px-5 pt-5 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-orange-50 rounded-lg">
              <BarChart2 className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Admissions vs Exits</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly client flow comparison</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
              Admissions
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              Exits
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-5 pt-3">
        <div className="h-[220px] sm:h-[280px] w-full">
          {loading ? (
            <div className="w-full h-full flex flex-col gap-3 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded" style={{ width: `${60 + i * 8}%` }} />
              ))}
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 4 }} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                  dx={-4}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)", radius: 4 }} />
                <Bar dataKey="admissions" name="Admissions" fill="#4f46e5" radius={[5, 5, 0, 0]} maxBarSize={36} />
                <Bar dataKey="exits" name="Exits" fill="#f59e0b" radius={[5, 5, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed rounded-xl border-slate-100">
              <BarChart2 className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm font-medium text-slate-400">No data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
