import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart2 } from "lucide-react";

interface AdmissionsExitsChartProps {
  data: { month: string; admissions: number; exits: number }[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-4 text-sm min-w-[160px]">
        <p className="font-bold text-gray-800 mb-2 border-b pb-1">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.fill }} />
              <span className="text-gray-500 text-xs">{p.name}</span>
            </div>
            <span className="font-bold text-gray-800">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AdmissionsExitsChart = ({ data, loading }: AdmissionsExitsChartProps) => {
  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white h-full">
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-xl">
              <BarChart2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Admissions vs Exits</h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Monthly comparison of incoming and outgoing clients</p>
            </div>
          </div>
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-orange-500" />
              Admissions
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-400" />
              Exits
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-6">
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                  dx={-4}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)", radius: 4 }} />
                <Bar dataKey="admissions" name="Admissions" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="exits" name="Exits & Graduations" fill="#fb7185" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed rounded-xl border-slate-100">
              <BarChart2 className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm font-medium">No admissions / exits data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
