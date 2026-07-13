import { useState } from "react";
import { Users, Home, Calendar, TrendingUp, Medal, Activity, ArrowUpRight, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardStats, DateRangeFilter } from "@/hooks/useDashboardStats";

// Charts
import { AdmissionsExitsChart } from "@/components/dashboard/AdmissionsExitsChart";
import { DemographicsChart } from "@/components/dashboard/DemographicsChart";
import { ClientStatusChart } from "@/components/ClientStatusChart";
import { PlacementChart } from "@/components/dashboard/PlacementChart";
import { AftercareChart } from "@/components/dashboard/AftercareChart";

const LABEL_MAP: Record<DateRangeFilter, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "month": "This Month",
  "year": "This Year",
  "all": "All Time",
};

const Index = () => {
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const { stats, loading } = useDashboardStats(dateRange);

  const kpiCards = [
    {
      label: "Total Clients",
      value: stats?.totalClients ?? 0,
      sub: `${stats?.activeClients ?? 0} active`,
      icon: Users,
      accent: "from-green-500 to-emerald-600",
    },
    {
      label: "Home Visits",
      value: stats?.totalHomeVisits ?? 0,
      sub: "This period",
      icon: Home,
      accent: "from-yellow-400 to-amber-500",
    },
    {
      label: "Alumni",
      value: (stats?.clientStatusData?.filter(s =>
        ["Alumni - Placed", "Alumni - Awaiting Placement", "Alumni", "Complete", "Graduated"].includes(s.name)
      ).reduce((sum, s) => sum + s.value, 0)) ?? 0,
      sub: "Graduates",
      icon: Medal,
      accent: "from-orange-500 to-orange-600",
    },
    {
      label: "Admissions",
      value: stats?.admissions ?? 0,
      sub: "This period",
      icon: TrendingUp,
      accent: "from-red-500 to-rose-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6fb] w-full max-w-full">

      {/* Header */}
      <div className="sticky top-14 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 bg-green-600 rounded-lg flex-shrink-0">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">System Overview</h1>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Analytics & decision-making metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 flex-shrink-0">
            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400 flex-shrink-0" />
            <Select value={dateRange} onValueChange={(val: DateRangeFilter) => setDateRange(val)}>
              <SelectTrigger className="h-6 sm:h-7 bg-transparent text-slate-700 border-0 font-semibold text-xs sm:text-sm focus:ring-0 shadow-none p-0 w-[100px] sm:w-[130px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Period badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-medium text-slate-400">Viewing:</span>
          <span className="text-[10px] sm:text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 sm:px-2.5 py-0.5 rounded-full">
            {LABEL_MAP[dateRange]}
          </span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className={`bg-gradient-to-br ${card.accent} rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 sm:hover:-translate-y-0.5 p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 group relative overflow-hidden`}
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-5 -left-5 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5" />

              <div className="relative flex items-start justify-between">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm">
                  <card.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
                <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/40 group-hover:text-white/70 transition-colors" />
              </div>

              <div className="relative">
                {loading ? (
                  <div className="space-y-1.5">
                    <div className="h-6 sm:h-8 w-12 sm:w-16 bg-white/20 rounded-lg animate-pulse" />
                    <div className="h-2.5 w-16 sm:w-24 bg-white/10 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl sm:text-3xl font-extrabold text-white leading-none tracking-tight">{card.value}</p>
                    <p className="text-[10px] sm:text-xs text-white/70 font-semibold mt-1 sm:mt-1.5 uppercase tracking-wide">{card.label}</p>
                    <p className="text-[9px] sm:text-[11px] text-white/60 mt-0.5 hidden sm:block">{card.sub}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Section: Trends */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Trends</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="lg:col-span-1">
              <DemographicsChart data={stats?.demographicsData || []} loading={loading} />
            </div>
            <div className="lg:col-span-2">
              <AdmissionsExitsChart data={stats?.admissionsExitsData || []} loading={loading} />
            </div>
          </div>
        </div>

        {/* Section: Distribution */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Distribution</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <ClientStatusChart data={stats?.clientStatusData || []} loading={loading} />
            </div>
            <div>
              <PlacementChart data={stats?.reunificationData || []} loading={loading} />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <AftercareChart data={stats?.placementData || []} loading={loading} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
