import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRequireClinic } from '@/hooks/useRequireClinic';
import { useSubscription } from '@/hooks/useSubscription';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  Users,
  Clock,
  TrendingUp,
  UserPlus,
  CalendarPlus,
  FileText,
  Crown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppointmentRow = {
  id: string;
  date: string;
  time: string;
  duration?: number | null;
  status?: string | null;
  treatment_type?: string | null;
  price?: number | null;
  notes?: string | null;
  patient_id?: string | null;
};

type AppointmentView = AppointmentRow & {
  patient?: { id: string; full_name?: string } | null;
};

type PatientShort = {
  id: string;
  full_name: string;
  created_at: string;
};

const pad = (n: number) => n.toString().padStart(2, '0');

const getTodayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const dateTimeToDateObj = (dateStr: string, timeStr: string) => {
  const timeShort = (timeStr ?? '00:00').slice(0, 5);
  return new Date(`${dateStr}T${timeShort}:00`);
};

export default function Dashboard() {
  const { user } = useAuth();
  const clinicId = useRequireClinic(); // This will redirect to /setup-clinic if no clinic is found
  const { subscribed, subscription_tier, subscription_end, loading: subscriptionLoading, openCustomerPortal } = useSubscription();
  const [stats, setStats] = useState([
    { title: 'Pacientes Ativos', value: '0', change: '0', icon: Users, color: 'text-primary' },
    { title: 'Consultas Hoje', value: '0', change: '0', icon: Calendar, color: 'text-accent' },
    { title: 'Próxima Consulta', value: '--:--', change: 'sem agendamento', icon: Clock, color: 'text-warning' },
    { title: 'Receita Mensal', value: 'R$ 0,00', change: 'R$ 0,00', icon: TrendingUp, color: 'text-success' },
  ]);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentView[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentView[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<AppointmentView[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatientShort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const todayDate = getTodayISO();
      const now = new Date();

      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      const { data: apptsData, error: apptsError } = await supabase
        .from('appointments')
        .select('id,date,time,duration,status,treatment_type,price,notes,patient_id')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (apptsError) throw apptsError;

      const appts = (apptsData ?? []) as AppointmentRow[];

      const patientIds = Array.from(new Set(appts.map(a => a.patient_id).filter(Boolean) as string[]));
      let patientsMap = new Map<string, PatientShort>();
      if (patientIds.length > 0) {
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('id,full_name,created_at')
          .in('id', patientIds);
        if (patientsError) throw patientsError;
        (patientsData ?? []).forEach((p: any) => patientsMap.set(p.id, p));
      }

      const apptViews: AppointmentView[] = appts.map(a => ({
        ...a,
        patient: a.patient_id ? patientsMap.get(a.patient_id) ?? null : null
      }));

      const todayList = apptViews.filter(a => a.date === todayDate)
        .sort((x, y) => (x.time ?? '').localeCompare(y.time ?? ''));
      setTodayAppointments(todayList);

      const upcomingList = apptViews.filter(a => {
        const dt = dateTimeToDateObj(a.date ?? '', a.time ?? '');
        return dt.getTime() >= new Date(`${todayDate}T00:00:00`).getTime();
      }).sort((a, b) => {
        if (a.date === b.date) return (a.time ?? '').localeCompare(b.time ?? '');
        return (a.date ?? '').localeCompare(b.date ?? '');
      });
      setUpcomingAppointments(upcomingList);

      const pendingList = apptViews.filter(a => {
        const dt = dateTimeToDateObj(a.date ?? '', a.time ?? '');
        return dt.getTime() < now.getTime() && ['scheduled', 'confirmed'].includes(a.status || '');
      }).slice(0, 6);
      setPendingAppointments(pendingList);

      const next = upcomingList.find(a => {
        if (!a.date || !a.time) return false;
        const dt = dateTimeToDateObj(a.date, a.time);
        return dt.getTime() > now.getTime();
      }) || null;

      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const startMonth = `${year}-${pad(month)}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endMonth = `${year}-${pad(month)}-${pad(lastDay)}`;

      const { data: monthlyAppointments } = await supabase
        .from('appointments')
        .select('price')
        .eq('status', 'completed')
        .gte('date', startMonth)
        .lte('date', endMonth);

      const monthlyRevenue = (monthlyAppointments ?? []).reduce(
        (sum: number, a: any) => sum + (a.price || 0),
        0
      );

      const { data: recentPatientsData } = await supabase
        .from('patients')
        .select('id,full_name,created_at')
        .order('created_at', { ascending: false })
        .limit(4);
      setRecentPatients(recentPatientsData ?? []);

      setStats([
        {
          title: 'Pacientes Ativos',
          value: (patientsCount || 0).toString(),
          change: `${patientsCount || 0} total`,
          icon: Users,
          color: 'text-primary'
        },
        {
          title: 'Consultas Hoje',
          value: (todayList.length || 0).toString(),
          change: `${todayList.length || 0} agendadas`,
          icon: Calendar,
          color: 'text-accent'
        },
        {
          title: 'Próxima Consulta',
          value: next ? new Date(dateTimeToDateObj(next.date!, next.time!).getTime()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
          change: next ? (next.patient?.full_name || 'Paciente') : 'sem agendamento',
          icon: Clock,
          color: 'text-warning'
        },
        {
          title: 'Receita Mensal',
          value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          change: `${(monthlyAppointments || []).length || 0} consultas`,
          icon: TrendingUp,
          color: 'text-success'
        }
      ]);

    } catch (error: any) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard: ' + (error?.message ?? String(error)));
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: 'Novo Paciente', description: 'Cadastrar novo paciente', icon: UserPlus, href: '/patients/new' },
    { title: 'Agendar Consulta', description: 'Nova consulta no calendário', icon: CalendarPlus, href: '/appointments/new' },
    { title: 'Ver Calendário', description: 'Visualizar agenda completa', icon: Calendar, href: '/calendar' },
    { title: 'Relatórios', description: 'Relatórios e estatísticas', icon: FileText, href: '/reports' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta!</h2>
          <p className="text-muted-foreground">Aqui está um resumo das suas atividades de hoje.</p>
        </div>

        {/* Subscription Status */}
        {!subscriptionLoading && (
          <Card className={subscribed ? "border-green-200 bg-green-50/50" : "border-orange-200 bg-orange-50/50"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Status da Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  {subscribed ? (
                    <>
                      <p className="text-sm text-muted-foreground">Plano Ativo</p>
                      <p className="font-semibold capitalize">{subscription_tier}</p>
                      {subscription_end && (
                        <p className="text-xs text-muted-foreground">
                          Renova em: {new Date(subscription_end).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Sem assinatura ativa</p>
                      <p className="font-semibold">Período de teste</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {subscribed ? (
                    <Button onClick={openCustomerPortal} variant="outline">
                      Gerenciar Assinatura
                    </Button>
                  ) : (
                    <Button onClick={() => window.location.href = '/plans'}>
                      Ver Planos
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-secondary ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse rapidamente as funções mais utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.href}>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-soft transition-all w-full">
                    <action.icon className="h-8 w-8 text-primary" />
                    <div className="text-center">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Próximas Consultas & Pendentes & Pacientes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-card lg:col-span-1">
            <CardHeader>
              <CardTitle>Próximas Consultas</CardTitle>
              <CardDescription>Consultas agendadas (hoje e futuros)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma consulta futura</p>
              ) : (
                upcomingAppointments.slice(0, 6).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <p className="font-medium">{appointment.patient?.full_name || 'Paciente'}</p>
                      <p className="text-sm text-muted-foreground">{appointment.treatment_type || '—'}</p>
                    </div>
                    <span className="text-primary font-medium">
                      {dateTimeToDateObj(appointment.date ?? '', appointment.time ?? '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card lg:col-span-1 ">
            <CardHeader>
              <CardTitle>Consultas Pendentes</CardTitle>
              <CardDescription>
                Consultas que já passaram e não foram concluídas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingAppointments.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhuma pendência
                </div>
              ) : (
                pendingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-primary"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {appointment.patient?.full_name || 'Paciente'}
                      </p>
                      <p className="text-sm text-muted-foreground text-white">
                        {appointment.treatment_type || '—'}
                      </p>
                      <span className="text-yellow-500 font-medium">
                        {dateTimeToDateObj(
                          appointment.date ?? '',
                          appointment.time ?? ''
                        ).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={async () => {
                          const { error } = await supabase
                            .from('appointments')
                            .update({ status: 'completed' })
                            .eq('id', appointment.id);
                          if (error) {
                            toast.error('Erro ao concluir');
                          } else {
                            toast.success('Consulta concluída');
                            fetchDashboardData();
                          }
                        }}
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={async () => {
                          const { error } = await supabase
                            .from('appointments')
                            .update({ status: 'no_show' })
                            .eq('id', appointment.id);
                          if (error) {
                            toast.error('Erro ao cancelar');
                          } else {
                            toast.success('Consulta cancelada');
                            fetchDashboardData();
                          }
                        }}
                      >
                        X
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>




          <Card className="shadow-card lg:col-span-1">
            <CardHeader>
              <CardTitle>Pacientes Recentes</CardTitle>
              <CardDescription>Últimos pacientes cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentPatients.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhum paciente cadastrado ainda</p>
              ) : (
                recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-medium">
                          {patient.full_name?.charAt(0) || 'P'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{patient.full_name}</p>
                        <p className="text-sm text-muted-foreground">{new Date(patient.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-full">Ativo</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
