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
  
  // Chart Data
  systemActivityData: { date: string; visits: number; sessions: number; medical: number }[];
  demographicsData: { name: string; value: number; fill: string }[];
  clientStatusData: { name: string; value: number; color: string }[];
  admissionsExitsData: { month: string; admissions: number; exits: number }[];
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
          exitsRes
        ] = await Promise.all([
          supabase.from("clients").select("*"),
          supabase.from("home_visits").select("*"),
          supabase.from("soap_notes").select("*"),
          supabase.from("medical_records").select("*"),
          supabase.from("exit_records").select("*")
        ]);

        if (clientsRes.error) throw clientsRes.error;
        if (visitsRes.error) throw visitsRes.error;
        if (soapNotesRes.error) throw soapNotesRes.error;
        if (medicalRes.error) throw medicalRes.error;
        if (exitsRes.error) throw exitsRes.error;

        const allClients = clientsRes.data || [];
        const allVisits = visitsRes.data || [];
        const allSoapNotes = soapNotesRes.data || [];
        const allMedical = medicalRes.data || [];
        const allExits = exitsRes.data || [];

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
          const date = format(parseISO(dateStr), 'MMM dd');
          if (!activityMap[date]) {
            activityMap[date] = { visits: 0, sessions: 0, medical: 0 };
          }
          activityMap[date][type]++;
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
          const month = format(parseISO(c.admission_date), 'MMM yyyy');
          if (!admExitsMap[month]) admExitsMap[month] = { admissions: 0, exits: 0 };
          admExitsMap[month].admissions++;
        });

        allExits.forEach(e => {
          if (!e.exit_date) return;
          const month = format(parseISO(e.exit_date), 'MMM yyyy');
          if (!admExitsMap[month]) admExitsMap[month] = { admissions: 0, exits: 0 };
          admExitsMap[month].exits++;
        });

        const admissionsExitsData = Object.keys(admExitsMap)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          .slice(-12) // Show last 12 months
          .map(month => ({
            month,
            ...admExitsMap[month]
          }));

        setStats({
          totalClients,
          activeClients,
          totalHomeVisits,
          totalCounsellingSessions,
          totalMedicalRecords,
          admissions,
          exits,
          systemActivityData: displayActivityData,
          demographicsData,
          clientStatusData,
          admissionsExitsData
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
