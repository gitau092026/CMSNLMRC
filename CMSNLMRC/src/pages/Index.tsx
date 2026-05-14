import { useState, useEffect } from "react";
import { Users, UserCheck, GraduationCap, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { ClientStatusChart } from "@/components/ClientStatusChart";
import { DepartmentPerformanceChart } from "@/components/DepartmentPerformanceChart";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*');

      if (error) throw error;

      const total = data?.length || 0;
      const active = data?.filter(c => c.status?.toLowerCase() === 'active').length || 0;
      const completed = data?.filter(c => c.status?.toLowerCase() === 'graduated').length || 0;
      
      // Calculate new this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newThisMonth = data?.filter(c => {
        const admissionDate = c.admission_date ? new Date(c.admission_date) : null;
        return admissionDate && admissionDate >= firstDayOfMonth;
      }).length || 0;

      setStats({ total, active, completed, newThisMonth });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      <div className="relative bg-gradient-primary h-24 flex items-center px-4 sm:px-6 lg:px-8 w-full max-w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-white/90">Welcome back, Admin! Here's your comprehensive overview</p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Clients"
            value={stats.total}
            subtitle={`${stats.newThisMonth} new this month`}
            icon={Users}
            variant="primary"
            trend={`${stats.newThisMonth} new this month`}
            trendUp={stats.newThisMonth > 0}
          />
          <MetricCard
            title="Active Clients"
            value={stats.active}
            subtitle={`${stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% of total`}
            icon={UserCheck}
            variant="success"
          />
          <MetricCard
            title="Completed Programs"
            value={stats.completed}
            subtitle={`${stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}% success rate`}
            icon={GraduationCap}
            variant="primary"
          />
          <MetricCard
            title="New This Month"
            value={stats.newThisMonth}
            icon={TrendingUp}
            variant="success"
            trend="Monthly growth"
            trendUp={stats.newThisMonth > 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientStatusChart />
          <DepartmentPerformanceChart />
        </div>
      </div>
    </div>
  );
};

export default Index;
