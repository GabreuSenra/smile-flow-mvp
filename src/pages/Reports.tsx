import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Users, Calendar, DollarSign, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reportType, setReportType] = useState('monthly');
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [appointmentStats, setAppointmentStats] = useState<any[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    totalPatients: 0,
    averageTicket: 0
  });

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setDateRange({
      from: firstDay,
      to: lastDay
    });
  }, []);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchReportData();
    }
  }, [dateRange, reportType]);

  const fetchReportData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    try {
      const startDate = dateRange.from.toISOString().split('T')[0];
      const endDate = dateRange.to.toISOString().split('T')[0];

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            id,
            full_name
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      if (appointments) {
        const revenueByPeriod = processFinancialData(appointments, reportType);
        setFinancialData(revenueByPeriod);

        const statusStats = processAppointmentStats(appointments);
        setAppointmentStats(statusStats);

        const treatments = processTreatmentTypes(appointments);
        setTreatmentTypes(treatments);

        const totalRevenue = appointments
          .filter(apt => apt.status === 'completed')
          .reduce((sum, apt) => sum + (apt.price || 0), 0);

        const totalAppointments = appointments.length;
        const uniquePatients = new Set(appointments.map(apt => apt.patient_id)).size;
        const averageTicket = totalRevenue / (appointments.filter(apt => apt.status === 'completed').length || 1);

        setSummary({
          totalRevenue,
          totalAppointments,
          totalPatients: uniquePatients,
          averageTicket
        });
      }
    } catch (error: any) {
      toast.error('Erro ao carregar relatórios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const processFinancialData = (appointments: any[], type: string) => {
    const data: { [key: string]: number } = {};

    appointments.forEach(apt => {
      if (apt.status === 'completed' && apt.price) {
        const date = new Date(apt.date);
        let key: string;

        if (type === 'daily') {
          key = date.toISOString().split('T')[0];
        } else if (type === 'weekly') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        data[key] = (data[key] || 0) + apt.price;
      }
    });

    return Object.entries(data).map(([period, revenue]) => ({
      period,
      revenue: Number(revenue.toFixed(2))
    })).sort((a, b) => a.period.localeCompare(b.period));
  };

  const processAppointmentStats = (appointments: any[]) => {
    const statusCount: { [key: string]: number } = {};

    appointments.forEach(apt => {
      const status = apt.status || 'scheduled';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const statusLabels: { [key: string]: string } = {
      scheduled: 'Agendadas',
      completed: 'Concluídas',
      cancelled: 'Canceladas',
      confirmed: 'Confirmadas',
      no_show: 'Não Compareceu'
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      status
    }));
  };

  const processTreatmentTypes = (appointments: any[]) => {
    const treatmentCount: { [key: string]: number } = {};

    appointments.forEach(apt => {
      const treatment = apt.treatment_type || 'Outros';
      treatmentCount[treatment] = (treatmentCount[treatment] || 0) + 1;
    });

    return Object.entries(treatmentCount).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(var(--muted))',
    '#8884d8'
  ];

  // Transforma a lista de tratamentos em formato por período para gráfico de linhas
  const transformTreatmentDataByPeriod = (appointments: any[], type: string) => {
    const grouped: Record<string, any> = {};

    appointments.forEach(apt => {
      const date = new Date(apt.date);
      let period = '';
      if (type === 'daily') {
        period = apt.date;
      } else if (type === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        period = weekStart.toISOString().split('T')[0];
      } else {
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[period]) grouped[period] = { period };

      const treatment = apt.treatment_type || 'Outros';
      grouped[period][treatment] = (grouped[period][treatment] || 0) + 1;
    });

    return Object.values(grouped).sort((a: any, b: any) => a.period.localeCompare(b.period));
  };

  // Extrai todos os tipos de tratamento únicos para criar as linhas no gráfico
  const getTreatmentKeys = (appointments: any[]) => {
    const keys = new Set<string>();
    appointments.forEach(apt => {
      keys.add(apt.treatment_type || 'Outros');
    });
    return Array.from(keys);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-secondary rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-secondary rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">Analise o desempenho da sua clínica</p>
          </div>
          
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Agrupamento</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold">
                    R$ {summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Consultas</p>
                  <p className="text-2xl font-bold">{summary.totalAppointments}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pacientes Únicos</p>
                  <p className="text-2xl font-bold">{summary.totalPatients}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">
                    R$ {summary.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Receita por Período</CardTitle>
              <CardDescription>Evolução da receita ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Receita',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Appointment Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Status das Consultas</CardTitle>
              <CardDescription>Distribuição por status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={appointmentStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {appointmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
