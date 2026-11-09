import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Home, Calendar, TrendingUp, Medal, Activity,
  Briefcase, Heart, MessageCircle, Shield, Stethoscope, BarChart2, Target,
  MapPin, GraduationCap, BookOpen, UserCheck, AlertTriangle, CheckCircle,
  Navigation, Lightbulb, ArrowRight,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardStats, DateRangeFilter } from "@/hooks/useDashboardStats";

// Charts
import { AdmissionsExitsChart }  from "@/components/dashboard/AdmissionsExitsChart";
import { DemographicsChart }     from "@/components/dashboard/DemographicsChart";
import { ClientStatusChart }     from "@/components/ClientStatusChart";
import { PlacementChart }        from "@/components/dashboard/PlacementChart";
import { AftercareChart }        from "@/components/dashboard/AftercareChart";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// ─── helpers ──────────────────────────────────────────────────────────────────

const RANGE_LABELS: Record<DateRangeFilter, string> = {
  "7d": "Last 7 days", "30d": "Last 30 days",
  "month": "This month", "year": "This year", "all": "All time",
};

// ─── MiniDonut ────────────────────────────────────────────────────────────────
function MiniDonut({
  data, loading, emptyLabel = "No data",
}: {
  data: { name: string; value: number; color: string }[];
  loading: boolean;
  emptyLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (loading) return (
    <div className="flex items-center justify-center h-[160px]">
      <Skeleton className="h-[120px] w-[120px] rounded-full" />
    </div>
  );
  if (!total) return (
    <div className="h-[160px] flex items-center justify-center border-2 border-dashed rounded-xl border-slate-100">
      <p className="text-xs font-medium text-slate-400">{emptyLabel}</p>
    </div>
  );
  return (
    <div>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
              paddingAngle={3} dataKey="value" labelLine={false} animationDuration={700}>
              {data.map((e, i) => <Cell key={i} fill={e.color} stroke="white" strokeWidth={2} />)}
            </Pie>
            <Tooltip content={({ active, payload }: any) =>
              active && payload?.length ? (
                <div className="bg-white border border-slate-100 rounded-xl shadow-xl p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: payload[0].payload.color }} />
                    <span className="font-bold text-slate-800">{payload[0].name}</span>
                  </div>
                  <p className="text-slate-400 mt-1 text-xs">
                    <span className="font-extrabold text-slate-900 text-base">{payload[0].value}</span>
                  </p>
                </div>
              ) : null} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 border-t border-slate-100 pt-3">
        {data.map(e => (
          <div key={e.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
              <span className="text-[11px] font-medium text-slate-500 truncate">{e.name}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[11px] font-bold text-slate-800">{e.value}</span>
              <span className="text-[10px] text-slate-300 w-6 text-right">
                {Math.round((e.value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
        <div className="flex justify-between border-t border-slate-100 pt-1.5">
          <span className="text-[11px] font-semibold text-slate-400">Total</span>
          <span className="text-[11px] font-extrabold text-slate-800">{total}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-0.5">{label}</p>
      {children}
    </section>
  );
}

// ─── KPI stat tile ─────────────────────────────────────────────────────────────
function StatTile({
  icon: Icon, iconBg, label, value, sub, loading, onClick,
}: {
  icon: any; iconBg: string; label: string; value: number;
  sub?: string; loading: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4
        ${onClick ? "cursor-pointer hover:shadow-md hover:border-slate-300 transition-all" : ""}`}
    >
      <div className={`p-3 rounded-xl flex-shrink-0 ${iconBg}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        {loading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-extrabold text-slate-900 leading-none">{value.toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-600 mt-1 leading-tight">{label}</p>
            {sub && <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{sub}</p>}
          </>
        )}
      </div>
      {onClick && <ArrowRight className="h-4 w-4 text-slate-300 flex-shrink-0" />}
    </div>
  );
}

// ─── Chart card ───────────────────────────────────────────────────────────────
function ChartCard({
  icon: Icon, iconBg, iconColor, title, subtitle, children, className = "",
}: {
  icon: any; iconBg: string; iconColor: string; title: string;
  subtitle: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2 rounded-lg flex-shrink-0 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 leading-tight">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const Index = () => {
  const navigate  = useNavigate();
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const { stats, loading } = useDashboardStats(dateRange);

  const reintegrations = (stats?.clientStatusData ?? [])
    .filter(s => ["Alumni - Placed","Alumni - Awaiting Placement","Alumni","Complete","Graduated"].includes(s.name))
    .reduce((sum, s) => sum + s.value, 0);

  // Quick-nav modules
  const modules = [
    { label: "Clients",        url: "/clients",              icon: Users,        c: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
    { label: "Register",       url: "/register",             icon: UserCheck,    c: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
    { label: "Counselling",    url: "/counselling",          icon: MessageCircle,c: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
    { label: "Case Plans",     url: "/case-plans",           icon: Shield,       c: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
    { label: "Aftercare",      url: "/aftercare",            icon: Heart,        c: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
    { label: "Education",      url: "/education",            icon: GraduationCap,c: "bg-teal-50 text-teal-700 hover:bg-teal-100" },
    { label: "Alumni",         url: "/alumni",               icon: Medal,        c: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
    { label: "Empowerment",    url: "/empowerment",          icon: Lightbulb,    c: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100" },
    { label: "Reintegration",  url: "/reintegration-plans",  icon: MapPin,       c: "bg-lime-50 text-lime-700 hover:bg-lime-100" },
    { label: "SOAP Notes",     url: "/soap-notes",           icon: BookOpen,     c: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100" },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f9] w-full">

      {/* ── Top bar ── */}
      <div className="sticky top-14 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-green-600 rounded-lg flex-shrink-0">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 leading-tight">M&amp;E Dashboard</h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">Monitoring &amp; Evaluation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <Select value={dateRange} onValueChange={(v: DateRangeFilter) => setDateRange(v)}>
              <SelectTrigger className="h-8 w-[140px] text-xs font-semibold border-slate-200 focus:ring-0 shadow-none">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

        {/* ── Hero summary strip ── */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl p-6 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold leading-tight">Programme Overview</h2>
              <p className="text-green-100 text-sm mt-0.5">{RANGE_LABELS[dateRange]}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Beneficiaries", value: stats?.totalClients ?? 0,              icon: Users },
              { label: "Active Clients",       value: stats?.activeClients ?? 0,             icon: UserCheck },
              { label: "Reintegrations",       value: reintegrations,                        icon: Medal },
              { label: "Total Exits",          value: (stats?.completedDischarges ?? 0) + (stats?.incompleteDischarges ?? 0), icon: CheckCircle },
            ].map(s => (
              <div key={s.label} className="bg-white/15 rounded-xl p-4 backdrop-blur-sm">
                <s.icon className="h-5 w-5 text-green-100 mb-2" />
                {loading
                  ? <Skeleton className="h-8 w-14 bg-white/20 mb-1" />
                  : <p className="text-3xl font-extrabold leading-none">{s.value.toLocaleString()}</p>}
                <p className="text-xs text-green-100 mt-1.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick navigation ── */}
        <Section label="Modules">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {modules.map(m => (
              <button key={m.label} onClick={() => navigate(m.url)}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border border-transparent text-xs font-semibold transition-all ${m.c}`}>
                <m.icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-[10px] leading-tight text-center">{m.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ── KPI grid ── */}
        <Section label="Key Metrics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <StatTile icon={Users}        iconBg="bg-indigo-500" label="Total Beneficiaries"      value={stats?.totalClients ?? 0}                              sub="All registered clients"           loading={loading} onClick={() => navigate("/clients")} />
            <StatTile icon={UserCheck}    iconBg="bg-emerald-500" label="Active Clients"          value={stats?.activeClients ?? 0}                             sub="Currently in programme"           loading={loading} onClick={() => navigate("/clients")} />
            <StatTile icon={Home}         iconBg="bg-cyan-500"    label="Home / Field Visits"     value={stats?.totalHomeVisits ?? 0}                           sub="Outreach & follow-up"             loading={loading} />
            <StatTile icon={Navigation}   iconBg="bg-fuchsia-500" label="Street Outreach"         value={stats?.totalStreetVisits ?? 0}                         sub="Street contact visits"            loading={loading} />
            <StatTile icon={MessageCircle}iconBg="bg-blue-500"    label="Counselling Sessions"    value={stats?.totalCounsellingSessions ?? 0}                  sub="SOAP notes recorded"              loading={loading} />
            <StatTile icon={Stethoscope}  iconBg="bg-rose-500"    label="Medical Referrals"       value={stats?.totalMedicalRecords ?? 0}                       sub="Healthcare visits"                loading={loading} />
            <StatTile icon={BookOpen}     iconBg="bg-teal-500"    label="Education Students"      value={stats?.totalEducationStudents ?? 0}                    sub="Enrolled in school"               loading={loading} onClick={() => navigate("/education")} />
            <StatTile icon={Shield}       iconBg="bg-violet-500"  label="Case Plans"              value={stats?.programStats?.totalCasePlans ?? 0}              sub="Social work plans"                loading={loading} onClick={() => navigate("/case-plans")} />
            <StatTile icon={Heart}        iconBg="bg-orange-500"  label="Aftercare Records"       value={stats?.programStats?.totalAftercareRecords ?? 0}       sub="Placement tracking"               loading={loading} onClick={() => navigate("/aftercare")} />
            <StatTile icon={Briefcase}    iconBg="bg-sky-500"     label="Active Placements"       value={stats?.activePlacements ?? 0}                          sub="In-progress placements"           loading={loading} onClick={() => navigate("/aftercare")} />
            <StatTile icon={MapPin}       iconBg="bg-lime-600"    label="Reintegration Plans"     value={stats?.totalReintegrationPlans ?? 0}                   sub="Field reintegrations"             loading={loading} />
            <StatTile icon={CheckCircle}  iconBg="bg-emerald-600" label="Complete Discharges"     value={stats?.completedDischarges ?? 0}                       sub="Successful completions"           loading={loading} />
          </div>
        </Section>

        {/* ── Discharge summary ── */}
        <Section label="Discharge Summary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-5">
              <div className="p-3.5 bg-emerald-100 rounded-xl flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                {loading ? <Skeleton className="h-8 w-16 mb-1" /> : (
                  <p className="text-3xl font-extrabold text-slate-900 leading-none">{stats?.completedDischarges ?? 0}</p>
                )}
                <p className="text-sm font-bold text-slate-700 mt-1">Complete Discharges</p>
                <p className="text-xs text-slate-400 mt-0.5">Successful programme completions</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-5">
              <div className="p-3.5 bg-amber-100 rounded-xl flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                {loading ? <Skeleton className="h-8 w-16 mb-1" /> : (
                  <p className="text-3xl font-extrabold text-slate-900 leading-none">{stats?.incompleteDischarges ?? 0}</p>
                )}
                <p className="text-sm font-bold text-slate-700 mt-1">Incomplete Discharges</p>
                <p className="text-xs text-slate-400 mt-0.5">Escaped, voluntary or early exits</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Demographics ── */}
        <Section label="Demographics">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ChartCard icon={Users} iconBg="bg-violet-100" iconColor="text-violet-600"
              title="Gender Distribution" subtitle="Breakdown by gender">
              <DemographicsChart data={stats?.demographicsData ?? []} loading={loading} />
            </ChartCard>
            <ChartCard icon={Users} iconBg="bg-cyan-100" iconColor="text-cyan-600"
              title="Age Distribution" subtitle="Clients grouped by age band">
              <MiniDonut data={stats?.ageDistributionData ?? []} loading={loading} emptyLabel="No age data" />
            </ChartCard>
            <ChartCard icon={Target} iconBg="bg-blue-100" iconColor="text-blue-600"
              title="Admission Types" subtitle="How clients entered the programme">
              <MiniDonut data={stats?.admissionTypeData ?? []} loading={loading} emptyLabel="No admission data" />
            </ChartCard>
          </div>
        </Section>

        {/* ── Admissions & exits trend ── */}
        <Section label="Admissions & Exits Trend">
          <ChartCard icon={BarChart2} iconBg="bg-orange-100" iconColor="text-orange-600"
            title="Monthly Admissions vs Exits" subtitle="Client flow over the last 12 months">
            <AdmissionsExitsChart data={stats?.admissionsExitsData ?? []} loading={loading} />
          </ChartCard>
        </Section>

        {/* ── Programme outcomes ── */}
        <Section label="Programme Outcomes">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ChartCard icon={Target} iconBg="bg-blue-100" iconColor="text-blue-600"
              title="Client Status" subtitle="Current status of all clients">
              <ClientStatusChart data={stats?.clientStatusData ?? []} loading={loading} />
            </ChartCard>
            <ChartCard icon={Home} iconBg="bg-emerald-100" iconColor="text-emerald-600"
              title="Placement Progress" subtitle="Nature of reunification">
              <PlacementChart data={stats?.reunificationData ?? []} loading={loading} />
            </ChartCard>
            <ChartCard icon={CheckCircle} iconBg="bg-teal-100" iconColor="text-teal-600"
              title="Discharge Types" subtitle="Complete vs incomplete exits">
              <MiniDonut data={stats?.dischargeTypeData ?? []} loading={loading} emptyLabel="No discharge data" />
            </ChartCard>
          </div>
        </Section>

        {/* ── Aftercare & reintegration ── */}
        {/* ── Courses & Placements Overview ── */}
        {(stats?.courseData?.length ?? 0) > 0 && (
          <Section label="Courses & Placements Overview">
            <div className="grid grid-cols-1 gap-4">
              {/* Horizontal bar chart — courses */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg flex-shrink-0 bg-orange-100">
                    <BookOpen className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight">Courses / Classes</h3>
                    <p className="text-xs text-slate-400 mt-0.5">What clients are currently studying</p>
                  </div>
                </div>
                {loading ? (
                  <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={(stats?.courseData?.length ?? 0) * 42 + 16}>
                    <BarChart
                      data={stats?.courseData ?? []}
                      layout="vertical"
                      margin={{ top: 0, right: 40, left: 4, bottom: 0 }}
                      barSize={20}
                    >
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="course" width={140}
                        tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        content={({ active, payload }: any) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm max-w-[220px]">
                              <p className="font-bold text-slate-800 mb-1">{d.course}</p>
                              <p className="text-orange-600 font-semibold mb-1">{d.count} client{d.count !== 1 ? "s" : ""}</p>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {d.clients.slice(0, 5).join(", ")}
                                {d.clients.length > 5 ? ` +${d.clients.length - 5} more` : ""}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} animationDuration={700}>
                        {(stats?.courseData ?? []).map((_: any, i: number) => (
                          <Cell key={i} fill={i === 0 ? "#f97316" : `rgba(249,115,22,${Math.max(0.35, 1 - i * 0.07)})`} />
                        ))}
                        <LabelList dataKey="count" position="right"
                          style={{ fontSize: 12, fontWeight: 700, fill: "#374151" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Institutions grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg flex-shrink-0 bg-teal-100">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">Institutions / Workshops</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Where clients are placed</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {(stats?.institutionData ?? []).map((row: any) => (
                  <div key={row.name} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-700 leading-snug">{row.name}</span>
                    <span className="text-lg font-extrabold text-slate-900 leading-none">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        <Section label="Aftercare & Reintegration">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChartCard icon={Briefcase} iconBg="bg-purple-100" iconColor="text-purple-600"
              title="Aftercare Placement Types" subtitle="Alumni placement categories">
              <AftercareChart data={stats?.placementData ?? []} loading={loading} />
            </ChartCard>
            <ChartCard icon={Heart} iconBg="bg-rose-100" iconColor="text-rose-600"
              title="Aftercare Completion Status" subtitle="Progress of aftercare programmes">
              <MiniDonut data={stats?.aftercareStatusData ?? []} loading={loading} emptyLabel="No aftercare data" />
            </ChartCard>
          </div>
        </Section>

      </div>
    </div>
  );
};

export default Index;
