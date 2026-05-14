import { useState } from "react";
import { Users, Home, Presentation, Stethoscope, Calendar, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/MetricCard";
import { useDashboardStats, DateRangeFilter } from "@/hooks/useDashboardStats";

// Charts
import { AdmissionsExitsChart } from "@/components/dashboard/AdmissionsExitsChart";
import { DemographicsChart } from "@/components/dashboard/DemographicsChart";
import { ClientStatusChart } from "@/components/ClientStatusChart";

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

  return (
    <div className="min-h-screen bg-slate-50 w-full max-w-full font-sans">

      {/* Hero Header */}
      <div className="sticky top-14 z-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 h-20 flex items-center px-4 sm:px-8 w-full shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-400 via-transparent to-transparent pointer-events-none" />
        <div className="relative w-full flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">System Overview</h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">Analytics & decision-making metrics</p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm">
            <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <Select value={dateRange} onValueChange={(val: DateRangeFilter) => setDateRange(val)}>
              <SelectTrigger className="w-[130px] h-8 bg-transparent text-white border-0 font-semibold text-sm focus:ring-0 shadow-none p-0">
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

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

        {/* Active filter badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Showing:</span>
          <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold px-3 py-1 rounded-full">
            <RefreshCw className="h-3 w-3" />
            {LABEL_MAP[dateRange]}
          </span>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <MetricCard
            title="Total Clients"
            value={stats?.totalClients || 0}
            subtitle={`${stats?.activeClients || 0} active currently`}
            icon={Users}
            variant="primary"
            loading={loading}
          />
          <MetricCard
            title="Home Visits"
            value={stats?.totalHomeVisits || 0}
            subtitle="Conducted in period"
            icon={Home}
            variant="success"
            loading={loading}
          />
          <MetricCard
            title="Counselling Sessions"
            value={stats?.totalCounsellingSessions || 0}
            subtitle="Recorded in period"
            icon={Presentation}
            variant="warning"
            loading={loading}
          />
          <MetricCard
            title="Medical Interventions"
            value={stats?.totalMedicalRecords || 0}
            subtitle="Recorded in period"
            icon={Stethoscope}
            variant="danger"
            loading={loading}
          />
        </div>

        {/* Demographics + Admissions/Exits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="lg:col-span-1">
            <DemographicsChart
              data={stats?.demographicsData || []}
              loading={loading}
            />
          </div>
          <div className="lg:col-span-2">
            <AdmissionsExitsChart
              data={stats?.admissionsExitsData || []}
              loading={loading}
            />
          </div>
        </div>

        {/* Client Status — Full Width */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <ClientStatusChart data={stats?.clientStatusData || []} loading={loading} />
        </div>

      </div>
    </div>
  );
};

export default Index;
