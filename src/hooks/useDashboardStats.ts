import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, startOfYear, isAfter, isEqual, parseISO } from "date-fns";
import { getClientIntake, getUniqueIntakes } from "@/utils/intakeUtils";

export type DateRangeFilter = "all" | "7d" | "30d" | "month" | "year";

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalHomeVisits: number;
  totalCounsellingSessions: number;
  totalMedicalRecords: number;
  admissions: number;
  exits: number;
  activePlacements: number;

  // Extended metrics
  totalStreetVisits: number;
  totalEducationStudents: number;
  totalReintegrationPlans: number;
  completedDischarges: number;
  incompleteDischarges: number;

  // Chart data
  systemActivityData: { date: string; visits: number; sessions: number; medical: number }[];
  demographicsData: { name: string; value: number; fill: string }[];
  clientStatusData: { name: string; value: number; color: string }[];
  admissionsExitsData: { month: string; admissions: number; exits: number }[];
  placementData: { name: string; value: number; color: string }[];
  reunificationData: { name: string; value: number; color: string }[];
  ageDistributionData: { name: string; value: number; color: string }[];
  dischargeTypeData: { name: string; value: number; color: string }[];
  aftercareStatusData: { name: string; value: number; color: string }[];
  admissionTypeData: { name: string; value: number; color: string }[];
  courseData: { course: string; count: number; clients: string[] }[];
  placementTypeData: { name: string; value: number; color: string }[];
  institutionData: { name: string; value: number; color: string }[];

  programStats: {
    totalCasePlans: number;
    totalAftercareRecords: number;
    totalMedicalRecords: number;
    totalEducationStudents: number;
  };
}

const COLORS = [
  "#16a34a", "#3b82f6", "#8b5cf6", "#f59e0b", "#e11d48",
  "#14b8a6", "#64748b", "#0ea5e9", "#d946ef", "#f43f5e",
];

interface RawClientRow {
  id: string;
  name: string;
  status: string;
  created_at: string;
  admission_date: string | null;
  age: number | null;
  gender: string | null;
  education_status: string | null;
  admission_type: string | null;
  notes?: string | null;
  intake?: string | null;
}
interface RawVisitRow { id: string; client_id?: string; visit_date: string; nature_of_reintegration: string | null }
interface RawSoapRow { id: string; client_id?: string; session_date: string }
interface RawMedicalRow { id: string; client_id?: string; visit_date: string }
interface RawExitRow { id: string; client_id?: string; exit_date: string; nature_of_discharge: string | null }
interface RawAftercareRow {
  id: string;
  client_id: string;
  completion_status: string;
  placement_type: string | null;
  placement_course: string | null;
  institution_workshop: string;
}
interface RawStreetVisitRow { id: string; visit_date: string }
interface RawCasePlanRow { id: string; client_id?: string }

interface RawDashboardData {
  allClients: RawClientRow[];
  allVisits: RawVisitRow[];
  allSoapNotes: RawSoapRow[];
  allMedical: RawMedicalRow[];
  allExits: RawExitRow[];
  allAftercare: RawAftercareRow[];
  allCasePlans: RawCasePlanRow[];
  allStreetVisits: RawStreetVisitRow[];
  timestamp: number;
}

const DASHBOARD_CACHE_KEY = "cms_dashboard_raw_cache";
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes fresh

const loadStoredCache = (): RawDashboardData | null => {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveStoredCache = (data: RawDashboardData) => {
  try {
    sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage quota exceeded or disabled
  }
};

let rawCache: RawDashboardData | null = loadStoredCache();

export const invalidateDashboardCache = () => {
  rawCache = null;
  try {
    sessionStorage.removeItem(DASHBOARD_CACHE_KEY);
  } catch {
    // ignore
  }
};

function computeStatsFromRaw(
  raw: RawDashboardData,
  dateRange: DateRangeFilter,
  intakeFilter: string = "all"
): DashboardStats {
  const rawClients = raw.allClients || [];
  const rawVisits = raw.allVisits || [];
  const rawSoapNotes = raw.allSoapNotes || [];
  const rawMedical = raw.allMedical || [];
  const rawExits = raw.allExits || [];
  const rawAftercare = raw.allAftercare || [];
  const rawCasePlans = raw.allCasePlans || [];
  const rawStreetVisits = raw.allStreetVisits || [];

  // ── Intake / Cohort filter ──
  let allClients = rawClients;
  let allVisits = rawVisits;
  let allSoapNotes = rawSoapNotes;
  let allMedical = rawMedical;
  let allExits = rawExits;
  let allAftercare = rawAftercare;
  let allCasePlans = rawCasePlans;
  const allStreetVisits = rawStreetVisits;

  if (intakeFilter && intakeFilter !== "all") {
    allClients = rawClients.filter(c => getClientIntake(c) === intakeFilter);
    const clientIds = new Set(allClients.map(c => c.id));
    allVisits = rawVisits.filter(v => !v.client_id || clientIds.has(v.client_id));
    allSoapNotes = rawSoapNotes.filter(s => !s.client_id || clientIds.has(s.client_id));
    allMedical = rawMedical.filter(m => !m.client_id || clientIds.has(m.client_id));
    allExits = rawExits.filter(e => !e.client_id || clientIds.has(e.client_id));
    allAftercare = rawAftercare.filter(a => clientIds.has(a.client_id));
    allCasePlans = rawCasePlans.filter(cp => !cp.client_id || clientIds.has(cp.client_id));
  }

  // ── Date range filter ──
  const now = new Date();
  let startDate: Date | null = null;
  switch (dateRange) {
    case "7d":    startDate = subDays(now, 7); break;
    case "30d":   startDate = subDays(now, 30); break;
    case "month": startDate = startOfMonth(now); break;
    case "year":  startDate = startOfYear(now); break;
    default:      startDate = null;
  }

  const inRange = (dateStr: string | null): boolean => {
    if (!startDate || !dateStr) return true;
    try {
      const d = parseISO(dateStr);
      return isAfter(d, startDate) || isEqual(d, startDate);
    } catch {
      return true;
    }
  };

  const filteredClients   = allClients.filter(c  => inRange(c.created_at));
  const filteredVisits    = allVisits.filter(v   => inRange(v.visit_date));
  const filteredSoapNotes = allSoapNotes.filter(s => inRange(s.session_date));
  const filteredMedical   = allMedical.filter(m  => inRange(m.visit_date));
  const filteredExits     = allExits.filter(e    => inRange(e.exit_date));
  const filteredStreet    = allStreetVisits.filter(s => inRange(s.visit_date));

  // ── Scalar KPIs ──
  const totalClients             = allClients.length;
  const activeClients            = allClients.filter(c => (c.status ?? "").toLowerCase() === "active").length;
  const totalHomeVisits          = filteredVisits.length;
  const totalCounsellingSessions = filteredSoapNotes.length;
  const totalMedicalRecords      = filteredMedical.length;
  const admissions               = filteredClients.length;
  const exits                    = filteredExits.length;
  const activePlacements         = allAftercare.filter(r => (r.completion_status ?? "").toLowerCase() === "in progress").length;
  const totalStreetVisits        = filteredStreet.length;
  const totalEducationStudents   = allClients.filter(c => ["enrolled", "active"].includes((c.education_status ?? "").toLowerCase())).length;
  const completedDischarges      = allExits.filter(e => e.nature_of_discharge === "Complete").length;
  const incompleteDischarges     = allExits.filter(e => e.nature_of_discharge === "Incomplete").length;
  const totalReintegrationPlans  = allVisits.filter(v => (v.nature_of_reintegration ?? "").trim() !== "").length;

  // ── Chart: Client Status ──
  const statusCounts = allClients.reduce<Record<string, number>>((acc, c) => {
    const s = c.status || "Unknown";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const clientStatusData = Object.entries(statusCounts).map(([name, value], i) => ({
    name, value, color: COLORS[i % COLORS.length],
  }));

  // ── Chart: Demographics (gender) ──
  const genderCounts = allClients.reduce<Record<string, number>>((acc, c) => {
    const g = c.gender || "Unknown";
    acc[g] = (acc[g] ?? 0) + 1;
    return acc;
  }, {});
  const demographicsData = Object.entries(genderCounts).map(([name, value], i) => ({
    name, value, fill: COLORS[(i + 2) % COLORS.length],
  }));

  // ── Chart: Age Distribution ──
  const ageBuckets: Record<string, number> = {
    "Under 10": 0, "10–13": 0, "14–17": 0, "18–21": 0, "22+": 0,
  };
  allClients.forEach(c => {
    const age = c.age ?? 0;
    if      (age < 10)  ageBuckets["Under 10"]++;
    else if (age <= 13) ageBuckets["10–13"]++;
    else if (age <= 17) ageBuckets["14–17"]++;
    else if (age <= 21) ageBuckets["18–21"]++;
    else                ageBuckets["22+"]++;
  });
  const ageDistributionData = Object.entries(ageBuckets)
    .filter(([, v]) => v > 0)
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  // ── Chart: Admission Type ──
  const admTypeCounts = allClients.reduce<Record<string, number>>((acc, c) => {
    const t = c.admission_type || "Unknown";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const admissionTypeData = Object.entries(admTypeCounts)
    .filter(([name]) => name !== "Unknown")
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  // ── Chart: System Activity (last 30 days) ──
  const activityMap: Record<string, { visits: number; sessions: number; medical: number }> = {};
  const addActivity = (dateStr: string | null, type: "visits" | "sessions" | "medical") => {
    if (!dateStr) return;
    try {
      const d = parseISO(dateStr);
      if (isNaN(d.getTime())) return;
      const key = format(d, "MMM dd");
      if (!activityMap[key]) activityMap[key] = { visits: 0, sessions: 0, medical: 0 };
      activityMap[key][type]++;
    } catch { /* ignore */ }
  };
  filteredVisits.forEach(v    => addActivity(v.visit_date,   "visits"));
  filteredSoapNotes.forEach(s  => addActivity(s.session_date, "sessions"));
  filteredMedical.forEach(m   => addActivity(m.visit_date,   "medical"));
  const systemActivityData = Object.keys(activityMap)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map(date => ({ date, ...activityMap[date] }))
    .slice(-30);

  // ── Chart: Admissions vs Exits (monthly, last 12 months) ──
  const admExitsMap: Record<string, { admissions: number; exits: number }> = {};
  allClients.forEach(c => {
    if (!c.admission_date) return;
    try {
      const m = format(parseISO(c.admission_date), "MMM yyyy");
      if (!admExitsMap[m]) admExitsMap[m] = { admissions: 0, exits: 0 };
      admExitsMap[m].admissions++;
    } catch { /* ignore */ }
  });
  allExits.forEach(e => {
    if (!e.exit_date) return;
    try {
      const m = format(parseISO(e.exit_date), "MMM yyyy");
      if (!admExitsMap[m]) admExitsMap[m] = { admissions: 0, exits: 0 };
      admExitsMap[m].exits++;
    } catch { /* ignore */ }
  });
  const admissionsExitsData = Object.keys(admExitsMap)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-12)
    .map(month => ({ month, ...admExitsMap[month] }));

  // ── Chart: Aftercare Placement Types ──
  const placementCounts = allAftercare.reduce<Record<string, number>>((acc, r) => {
    const t = (r.placement_type ?? "").trim();
    if (!t) return acc;
    const label = t
      .split(/[_\s]+/)
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  // Alumni awaiting placement (no aftercare record yet)
  const awaitingCount = allClients.filter(c => {
    const s = c.status ?? "";
    if (s === "Alumni - Awaiting Placement") return true;
    if (["Complete", "Alumni", "Graduated"].includes(s))
      return !allAftercare.some(a => a.client_id === c.id);
    return false;
  }).length;
  if (awaitingCount > 0) placementCounts["Awaiting Placement"] = awaitingCount;
  const placementData = Object.entries(placementCounts).map(([name, value], i) => ({
    name,
    value,
    color: name === "Awaiting Placement" ? "#f59e0b" : COLORS[i % COLORS.length],
  }));

  // ── Chart: Nature of Reunification ──
  const reunCounts = allVisits.reduce<Record<string, number>>((acc, v) => {
    const val = (v.nature_of_reintegration ?? "").trim();
    if (!val) return acc;
    const norm = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    acc[norm] = (acc[norm] ?? 0) + 1;
    return acc;
  }, {});
  const reunificationData = Object.entries(reunCounts).map(([name, value], i) => ({
    name, value, color: COLORS[(i + 2) % COLORS.length],
  }));

  // ── Chart: Discharge Types ──
  const dischargeCounts = allExits.reduce<Record<string, number>>((acc, e) => {
    const t = e.nature_of_discharge || "Unknown";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const dischargeTypeData = Object.entries(dischargeCounts).map(([name, value], i) => ({
    name, value, color: COLORS[i % COLORS.length],
  }));

  // ── Chart: Aftercare Completion Status ──
  const aftercareStatusCounts = allAftercare.reduce<Record<string, number>>((acc, r) => {
    const s = (r.completion_status ?? "Unknown").trim();
    const label = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  const aftercareStatusData = Object.entries(aftercareStatusCounts).map(([name, value], i) => ({
    name, value, color: COLORS[i % COLORS.length],
  }));

  // ── Chart: Courses / Classes ──
  const courseCounts = allAftercare.reduce<Record<string, { count: number; clients: string[] }>>((acc, r) => {
    const k = (r.placement_course ?? "").trim() || "(No course specified)";
    if (!acc[k]) acc[k] = { count: 0, clients: [] };
    acc[k].count++;
    if (r.client_id) {
      const client = allClients.find((c: any) => c.id === r.client_id);
      if (client?.name) acc[k].clients.push(client.name);
    }
    return acc;
  }, {});
  const courseData = Object.entries(courseCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([course, info]) => ({ course, count: info.count, clients: info.clients }));

  // ── Chart: Placement Type breakdown ──
  const placementTypeCounts = allAftercare.reduce<Record<string, number>>((acc, r) => {
    const raw = (r.placement_type ?? "").trim();
    const label = raw === "vocational_training" ? "Vocational Training"
      : raw === "school" ? "School"
      : raw === "apprenticeship" ? "Apprenticeship"
      : raw || "Unspecified";
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  const placementTypeData = Object.entries(placementTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  // ── Chart: Institutions / Workshops ──
  const instCounts = allAftercare.reduce<Record<string, number>>((acc, r) => {
    const k = (r.institution_workshop ?? "").trim() || "Unknown";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const institutionData = Object.entries(instCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  return {
    totalClients,
    activeClients,
    totalHomeVisits,
    totalCounsellingSessions,
    totalMedicalRecords,
    admissions,
    exits,
    activePlacements,
    totalStreetVisits,
    totalEducationStudents,
    totalReintegrationPlans,
    completedDischarges,
    incompleteDischarges,
    systemActivityData,
    demographicsData,
    clientStatusData,
    admissionsExitsData,
    placementData,
    reunificationData,
    ageDistributionData,
    dischargeTypeData,
    aftercareStatusData,
    admissionTypeData,
    courseData,
    placementTypeData,
    institutionData,
    programStats: {
      totalCasePlans: allCasePlans.length,
      totalAftercareRecords: allAftercare.length,
      totalMedicalRecords: allMedical.length,
      totalEducationStudents,
    },
  };
}

export const useDashboardStats = (
  dateRange: DateRangeFilter = "all",
  intakeFilter: string = "all"
) => {
  const initialCache = rawCache || loadStoredCache();
  const [stats, setStats] = useState<DashboardStats | null>(() => {
    if (initialCache) {
      try {
        return computeStatsFromRaw(initialCache, dateRange, intakeFilter);
      } catch {
        return null;
      }
    }
    return null;
  });
  // Instant 0ms display if cache exists in memory or sessionStorage
  const [loading, setLoading] = useState<boolean>(!initialCache);
  const [error, setError] = useState<Error | null>(null);

  const availableIntakes = useMemo(() => {
    const currentCache = rawCache || loadStoredCache();
    if (!currentCache || !currentCache.allClients) return ["36th Intake", "35th Intake"];
    return getUniqueIntakes(currentCache.allClients);
  }, [stats]);

  useEffect(() => {
    let isMounted = true;

    // Guaranteed safety timeout: Never leave dashboard stuck on skeletons
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 3500);

    const fetchStats = async () => {
      const currentCache = rawCache || loadStoredCache();

      // If cache is fresh, display immediately
      if (currentCache && Date.now() - currentCache.timestamp < CACHE_TTL_MS) {
        if (isMounted) {
          try {
            setStats(computeStatsFromRaw(currentCache, dateRange, intakeFilter));
          } catch (e) {
            console.warn("Error computing stats from cache:", e);
          }
          setLoading(false);
        }
        return;
      }

      try {
        if (!currentCache && isMounted) setLoading(true);
        setError(null);

        let rawData: RawDashboardData | null = null;

        // 1. Fast Path: Single unified RPC call with 2.5s strict timeout
        try {
          const rpcPromise = supabase.rpc("get_dashboard_raw_data");
          const timeoutPromise = new Promise<{ data: any; error: any }>((res) =>
            setTimeout(() => res({ data: null, error: new Error("RPC timeout") }), 2500)
          );
          const { data: rpcData, error: rpcError } = await Promise.race([rpcPromise, timeoutPromise]);
          if (!rpcError && rpcData && typeof rpcData === "object") {
            const parsed = rpcData as Record<string, unknown>;
            rawData = {
              allClients: (parsed.allClients as RawClientRow[]) ?? [],
              allVisits: (parsed.allVisits as RawVisitRow[]) ?? [],
              allSoapNotes: (parsed.allSoapNotes as RawSoapRow[]) ?? [],
              allMedical: (parsed.allMedical as RawMedicalRow[]) ?? [],
              allExits: (parsed.allExits as RawExitRow[]) ?? [],
              allAftercare: (parsed.allAftercare as RawAftercareRow[]) ?? [],
              allCasePlans: (parsed.allCasePlans as RawCasePlanRow[]) ?? [],
              allStreetVisits: (parsed.allStreetVisits as RawStreetVisitRow[]) ?? [],
              timestamp: Date.now(),
            };
          }
        } catch (rpcErr) {
          console.warn("get_dashboard_raw_data RPC error, falling back to parallel queries:", rpcErr);
        }

        // 2. Fallback Path: Parallel queries across tables with 3.5s timeout
        if (!rawData) {
          const parallelPromise = Promise.all([
            supabase.from("clients").select("id, name, status, created_at, admission_date, age, gender, education_status, admission_type, notes"),
            supabase.from("home_visits").select("id, client_id, visit_date, nature_of_reintegration"),
            supabase.from("soap_notes").select("id, client_id, session_date"),
            supabase.from("medical_records").select("id, client_id, visit_date"),
            supabase.from("exit_records").select("id, client_id, exit_date, nature_of_discharge"),
            supabase.from("aftercare_records").select("id, client_id, completion_status, placement_type, placement_course, institution_workshop"),
            supabase.from("case_plans").select("id, client_id"),
            supabase.from("street_visits").select("id, visit_date"),
          ]);

          const timeoutPromise = new Promise<null>((res) => setTimeout(() => res(null), 3500));
          const results = await Promise.race([parallelPromise, timeoutPromise]);

          if (results) {
            const [
              clientsRes, visitsRes, soapNotesRes, medicalRes,
              exitsRes, aftercareRes, casePlansRes, streetVisitsRes
            ] = results;

            rawData = {
              allClients: (clientsRes?.data as RawClientRow[]) ?? [],
              allVisits: (visitsRes?.data as RawVisitRow[]) ?? [],
              allSoapNotes: (soapNotesRes?.data as RawSoapRow[]) ?? [],
              allMedical: (medicalRes?.data as RawMedicalRow[]) ?? [],
              allExits: (exitsRes?.data as RawExitRow[]) ?? [],
              allAftercare: (aftercareRes?.data as RawAftercareRow[]) ?? [],
              allCasePlans: (casePlansRes?.data as RawCasePlanRow[]) ?? [],
              allStreetVisits: (streetVisitsRes?.data as RawStreetVisitRow[]) ?? [],
              timestamp: Date.now(),
            };
          }
        }

        if (rawData) {
          rawCache = rawData;
          saveStoredCache(rawData);

          if (isMounted) {
            setStats(computeStatsFromRaw(rawData, dateRange, intakeFilter));
          }
        }
      } catch (err: any) {
        console.error("Dashboard stats error:", err);
        if (isMounted) setError(err);
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [dateRange, intakeFilter]);

  return { stats, loading, error, availableIntakes };
};
