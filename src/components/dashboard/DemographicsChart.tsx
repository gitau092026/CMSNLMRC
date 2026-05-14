import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users } from "lucide-react";

interface DemographicsChartProps {
  data: { name: string; value: number; fill: string }[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: payload[0].payload.fill }} />
          <span className="font-bold text-gray-800">{payload[0].name}</span>
        </div>
        <p className="text-gray-500 mt-1">
          <span className="font-extrabold text-gray-900 text-base">{payload[0].value}</span> clients
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
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const DemographicsChart = ({ data, loading }: DemographicsChartProps) => {
  const hasData = data && data.length > 0 && data.some(d => d.value > 0);
  const total = data?.reduce((sum, d) => sum + d.value, 0) || 0;

  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white h-full">
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Client Demographics</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Distribution by gender</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {loading ? (
          <div className="h-[260px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hasData ? (
          <>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                    animationDuration={800}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="mt-3 space-y-2">
              {data.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: entry.fill }} />
                    <span className="text-sm font-medium text-gray-600">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{entry.value}</span>
                    <span className="text-xs text-gray-400 w-10 text-right">
                      {total > 0 ? `${Math.round((entry.value / total) * 100)}%` : "0%"}
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2 mt-2">
                <span className="text-sm font-semibold text-gray-500">Total</span>
                <span className="text-sm font-extrabold text-gray-900">{total}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-[260px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed rounded-xl border-slate-100">
            <Users className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm font-medium">No demographic data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
