import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, startOfYear, isAfter, isBefore, isEqual, parseISO } from "date-fns";

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

  // Chart Data
  systemActivityData: { date: string; visits: number; sessions: number; medical: number }[];
  demographicsData: { name: string; value: number; fill: string }[];
  clientStatusData: { name: string; value: number; color: string }[];
  admissionsExitsData: { month: string; admissions: number; exits: number }[];
  placementData: { name: string; value: number; color: string }[];
  reunificationData: { name: string; value: number; color: string }[];
  programStats: {
    totalCasePlans: number;
    totalAftercareRecords: number;
    totalMedicalRecords: number;
    totalEducationStudents: number;
  };
}

const COLORS = [
  "hsl(160 84% 39%)", // Green
  "hsl(200 84% 55%)", // Blue
  "hsl(280 84% 60%)", // Purple
  "hsl(35 100% 55%)", // Orange
  "hsl(0 100% 70%)"   // Red
];

export const useDashboardStats = (dateRange: DateRangeFilter = "all") => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data from multiple tables
        const [
          clientsRes,
          visitsRes,
          soapNotesRes,
          medicalRes,
          exitsRes,
          aftercareRes,
          casePlansRes,
          subjectsRes
        ] = await Promise.all([
          supabase.from("clients").select("*"),
          supabase.from("home_visits").select("*"),
          supabase.from("soap_notes").select("*"),
          supabase.from("medical_records").select("*"),
          supabase.from("exit_records").select("*"),
          supabase.from("aftercare_records").select("*"),
          supabase.from("case_plans").select("id"),
          supabase.from("subjects").select("id")
        ]);

        if (clientsRes.error) {
          console.error("clients table error:", clientsRes.error);
          throw clientsRes.error;
        }
        if (visitsRes.error) console.warn("home_visits table error:", visitsRes.error);
        if (soapNotesRes.error) console.warn("soap_notes table error:", soapNotesRes.error);
        if (medicalRes.error) console.warn("medical_records table error:", medicalRes.error);
        if (exitsRes.error) console.warn("exit_records table error:", exitsRes.error);
        if (aftercareRes.error) console.warn("aftercare_records table error:", aftercareRes.error);
        if (casePlansRes?.error) console.warn("case_plans table error:", casePlansRes.error);
        if (subjectsRes?.error) console.warn("subjects table error:", subjectsRes.error);

        const allClients = clientsRes.data || [];
        const allVisits = visitsRes.data || [];
        const allSoapNotes = soapNotesRes.data || [];
        const allMedical = medicalRes.data || [];
        const allExits = exitsRes.data || [];
        const allAftercare = aftercareRes.data || [];
        const allCasePlans = casePlansRes?.data || [];
        const allSubjects = subjectsRes?.data || [];

        // Determine date range filter
        const now = new Date();
        let startDate: Date | null = null;

        switch (dateRange) {
          case "7d":
            startDate = subDays(now, 7);
            break;
          case "30d":
            startDate = subDays(now, 30);
            break;
          case "month":
            startDate = startOfMonth(now);
            break;
          case "year":
            startDate = startOfYear(now);
            break;
          case "all":
          default:
            startDate = null;
        }

        const isDateInRange = (dateString: string | null) => {
          if (!startDate || !dateString) return true;
          const date = new Date(dateString);
          return isAfter(date, startDate) || isEqual(date, startDate);
        };

        // Filter data based on date range
        const filteredClients = allClients.filter(c => isDateInRange(c.created_at));
        const filteredVisits = allVisits.filter(v => isDateInRange(v.visit_date));
        const filteredSoapNotes = allSoapNotes.filter(s => isDateInRange(s.session_date));
        const filteredMedical = allMedical.filter(m => isDateInRange(m.visit_date));
        const filteredExits = allExits.filter(e => isDateInRange(e.exit_date));

        // High-level Metrics
        const totalClients = allClients.length; // usually show all-time total clients
        const activeClients = allClients.filter(c => c.status?.toLowerCase() === "active").length;
        const totalHomeVisits = filteredVisits.length;
        const totalCounsellingSessions = filteredSoapNotes.length;
        const totalMedicalRecords = filteredMedical.length;
        const admissions = filteredClients.length;
        const exits = filteredExits.length;
        const activePlacements = allAftercare.filter(r => r.completion_status?.toLowerCase() === 'in progress').length;

        // --- Prepare Chart Data ---

        // 1. Client Status Distribution
        const statusCounts = allClients.reduce((acc: Record<string, number>, client) => {
          const status = client.status || "Unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        
        const clientStatusData = Object.keys(statusCounts).map((status, index) => ({
          name: status,
          value: statusCounts[status],
          color: COLORS[index % COLORS.length]
        }));

        // 2. Demographics Data (Gender)
        const genderCounts = allClients.reduce((acc: Record<string, number>, client) => {
          const gender = client.gender || "Unknown";
          acc[gender] = (acc[gender] || 0) + 1;
          return acc;
        }, {});

        const demographicsData = Object.keys(genderCounts).map((gender, index) => ({
          name: gender,
          value: genderCounts[gender],
          fill: COLORS[(index + 2) % COLORS.length]
        }));

        // 3. System Activity Data (Last 30 days grouped by week or simple trend if short range)
        // Let's aggregate by standard date format
        const activityMap: Record<string, { visits: number; sessions: number; medical: number }> = {};
        
        const addActivity = (dateStr: string | null, type: 'visits' | 'sessions' | 'medical') => {
          if (!dateStr) return;
          try {
            const parsed = parseISO(dateStr);
            if (isNaN(parsed.getTime())) return;
            const date = format(parsed, 'MMM dd');
            if (!activityMap[date]) {
              activityMap[date] = { visits: 0, sessions: 0, medical: 0 };
            }
            activityMap[date][type]++;
          } catch {
            // ignore invalid date
          }
        };

        filteredVisits.forEach(v => addActivity(v.visit_date, 'visits'));
        filteredSoapNotes.forEach(s => addActivity(s.session_date, 'sessions'));
        filteredMedical.forEach(m => addActivity(m.visit_date, 'medical'));

        // Sort activity data by date
        const systemActivityData = Object.keys(activityMap)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          .map(date => ({
            date,
            ...activityMap[date]
          }));
          
        // Limit points if there are too many (e.g., more than 30 points)
        const displayActivityData = systemActivityData.slice(-30);

        // 4. Admissions vs Exits (Grouped by Month)
        const admExitsMap: Record<string, { admissions: number; exits: number }> = {};
        
        allClients.forEach(c => {
          if (!c.admission_date) return;
          try {
            const parsed = parseISO(c.admission_date);
            if (isNaN(parsed.getTime())) return;
            const month = format(parsed, 'MMM yyyy');
            if (!admExitsMap[month]) admExitsMap[month] = { admissions: 0, exits: 0 };
            admExitsMap[month].admissions++;
          } catch {
            // ignore invalid date
          }
        });

        allExits.forEach(e => {
          if (!e.exit_date) return;
          try {
            const parsed = parseISO(e.exit_date);
            if (isNaN(parsed.getTime())) return;
            const month = format(parsed, 'MMM yyyy');
            if (!admExitsMap[month]) admExitsMap[month] = { admissions: 0, exits: 0 };
            admExitsMap[month].exits++;
          } catch {
            // ignore invalid date
          }
        });

        const admissionsExitsData = Object.keys(admExitsMap)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          .slice(-12) // Show last 12 months
          .map(month => ({
            month,
            ...admExitsMap[month]
          }));

        // 5. Placement Types & Status (from aftercare_records and alumni status)
        const placementCounts = allAftercare.reduce((acc: Record<string, number>, record) => {
          const type = record.placement_type?.trim();
          if (!type) return acc;
          // Format placement type string (e.g., "vocational_training" -> "Vocational Training")
          const formattedType = type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          acc[formattedType] = (acc[formattedType] || 0) + 1;
          return acc;
        }, {});

        // Count alumni who are awaiting placement
        const awaitingPlacementCount = allClients.filter(c => {
          const status = c.status || "";
          if (status === "Alumni - Awaiting Placement") return true;
          if (["Complete", "Alumni", "Graduated"].includes(status)) {
            return !allAftercare.some(a => a.client_id === c.id);
          }
          return false;
        }).length;

        if (awaitingPlacementCount > 0) {
          placementCounts["Awaiting Placement"] = awaitingPlacementCount;
        }

        const placementData = Object.keys(placementCounts).map((name, index) => ({
          name,
          value: placementCounts[name],
          color: name === "Awaiting Placement" ? "#f59e0b" : COLORS[index % COLORS.length]
        }));

        // 6. Nature of Reunification (from home_visits nature_of_reintegration)
        const reunificationCounts = allVisits.reduce((acc: Record<string, number>, visit) => {
          const val = visit.nature_of_reintegration?.trim();
          if (!val) return acc;
          const normalized = val.charAt(0).toUpperCase() + val.slice(1);
          acc[normalized] = (acc[normalized] || 0) + 1;
          return acc;
        }, {});

        const reunificationData = Object.keys(reunificationCounts).map((name, index) => ({
          name,
          value: reunificationCounts[name],
          color: COLORS[(index + 2) % COLORS.length]
        }));

        setStats({
          totalClients,
          activeClients,
          totalHomeVisits,
          totalCounsellingSessions,
          totalMedicalRecords,
          admissions,
          exits,
          activePlacements,
          systemActivityData: displayActivityData,
          demographicsData,
          clientStatusData,
          admissionsExitsData,
          placementData,
          reunificationData,
          programStats: {
            totalCasePlans: allCasePlans.length,
            totalAftercareRecords: allAftercare.length,
            totalMedicalRecords: allMedical.length,
            totalEducationStudents: allClients.filter(c => c.education_status === "Enrolled" || c.education_status === "Active").length,
          }
        });

      } catch (err: any) {
        console.error("Error fetching dashboard stats:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange]);

  return { stats, loading, error };
};
