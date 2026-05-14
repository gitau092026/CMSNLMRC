import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const data = [
  { name: "Active", value: 52.1, color: "hsl(160 84% 39%)" },
  { name: "Voluntary Discharge", value: 30.5, color: "hsl(0 84.2% 60.2%)" },
  { name: "Escape", value: 10.2, color: "hsl(0 100% 70%)" },
  { name: "Early Reintegration", value: 7.2, color: "hsl(200 84% 55%)" },
];

export function ClientStatusChart() {
  return (
    <Card className="relative overflow-hidden border-border">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-card-accent-primary" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Client Status Distribution
        </CardTitle>
        <CardDescription>Comprehensive overview of all client statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value, entry: any) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
