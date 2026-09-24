import { useState } from "react";
import { Users, Home, Calendar, TrendingUp, Medal, Activity, ArrowUpRight, ChevronDown, Briefcase, Heart, MessageCircle, GraduationCap, Shield, Stethoscope } from "lucide-react";
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
      label: "Total Beneficiaries",
      value: stats?.totalClients ?? 0,
      sub: `${stats?.activeClients ?? 0} active cases`,
      icon: Users,
      accent: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      label: "Field Interventions",
      value: stats?.totalHomeVisits ?? 0,
      sub: "Home visits this period",
      icon: Home,
      accent: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      label: "Successful Reintegrations",
      value: (stats?.clientStatusData?.filter(s =>
        ["Alumni - Placed", "Alumni - Awaiting Placement", "Alumni", "Complete", "Graduated"].includes(s.name)
      ).reduce((sum, s) => sum + s.value, 0)) ?? 0,
      sub: "Graduates",
      icon: Medal,
      accent: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Placement Progress",
      value: stats?.activePlacements ?? 0,
      sub: "Active in-progress placements",
      icon: Briefcase,
      accent: "text-cyan-600 bg-cyan-50 border-cyan-100",
    },
  ];

  const programKpiCards = [
    {
      label: "Case Plans",
      value: stats?.programStats?.totalCasePlans ?? 0,
      sub: "Active social work plans",
      icon: Shield,
      accent: "text-violet-600 bg-violet-50 border-violet-100",
    },
    {
      label: "Counselling Sessions",
      value: stats?.totalCounsellingSessions ?? 0,
      sub: "SOAP notes recorded",
      icon: MessageCircle,
      accent: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Medical Referrals",
      value: stats?.programStats?.totalMedicalRecords ?? 0,
      sub: "Healthcare visits",
      icon: Stethoscope,
      accent: "text-rose-600 bg-rose-50 border-rose-100",
    },
    {
      label: "Aftercare Records",
      value: stats?.programStats?.totalAftercareRecords ?? 0,
      sub: "Placement tracking",
      icon: Heart,
      accent: "text-orange-600 bg-orange-50 border-orange-100",
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
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">Monitoring & Evaluation Hub</h1>
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

        {/* KPI Cards — 2 columns on mobile, 4 on desktop */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">Core Monitoring KPIs</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 relative overflow-hidden hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="relative flex items-start justify-between">
                  <div className={`p-2 rounded-lg sm:rounded-xl bg-white/10 border border-white/10`}>
                    <card.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/30" />
                </div>

                <div className="relative mt-2">
                  {loading ? (
                    <div className="space-y-1.5">
                      <div className="h-6 sm:h-8 w-12 sm:w-16 bg-white/20 rounded-lg animate-pulse" />
                      <div className="h-2.5 w-16 sm:w-24 bg-white/10 rounded animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl sm:text-3xl font-extrabold text-white leading-none tracking-tight">{card.value}</p>
                      <p className="text-[10px] sm:text-xs text-slate-300 font-semibold mt-1.5 uppercase tracking-wide">{card.label}</p>
                      <p className="text-[9px] sm:text-[11px] text-slate-400 mt-0.5 hidden sm:block">{card.sub}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Program Activities KPIs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 sm:px-6 py-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-white" />
            <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Program Activities Overview</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs text-white/80">Live</span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {programKpiCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${card.accent.split(" ")[1]}`}>
                      <card.icon className={`h-4 w-4 ${card.accent.split(" ")[0]}`} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</span>
                  </div>
                  <div>
                    {loading ? (
                      <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 leading-none">{card.value}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">{card.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Trends */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 sm:px-6 py-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-white" />
            <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Impact Metrics</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs text-white/80">Live</span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {/* Stack on mobile, side-by-side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Demographics</h3>
                <DemographicsChart data={stats?.demographicsData || []} loading={loading} />
              </div>
              <div className="lg:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Admissions & Exits Trend</h3>
                <AdmissionsExitsChart data={stats?.admissionsExitsData || []} loading={loading} />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 sm:px-6 py-3 flex items-center gap-2">
            <Medal className="h-4 w-4 text-white" />
            <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Program Outcomes</span>
          </div>
          <div className="p-4 sm:p-6">
            {/* 1 col mobile, 2 col tablet, 3 col desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Client Status</h3>
                <ClientStatusChart data={stats?.clientStatusData || []} loading={loading} />
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Placement Progress</h3>
                <PlacementChart data={stats?.reunificationData || []} loading={loading} />
              </div>
              <div className="sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <h3 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-3">Aftercare</h3>
                <AftercareChart data={stats?.placementData || []} loading={loading} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
