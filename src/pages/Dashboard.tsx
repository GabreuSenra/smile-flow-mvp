import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
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
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    {
      title: 'Pacientes Ativos',
      value: '0',
      change: '0',
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'Consultas Hoje',
      value: '0',
      change: '0',
      icon: Calendar,
      color: 'text-accent'
    },
    {
      title: 'Próxima Consulta',
      value: '--:--',
      change: 'sem agendamento',
      icon: Clock,
      color: 'text-warning'
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 0,00',
      change: 'R$ 0,00',
      icon: TrendingUp,
      color: 'text-success'
    }
  ]);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch active patients count
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAppointments, count: todayCount } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            profiles:profile_id (
              full_name
            )
          ),
          dentists:dentist_id (
            profiles:profile_id (
              full_name
            )
          )
        `, { count: 'exact' })
        .gte('appointment_date', `${today}T00:00:00`)
        .lt('appointment_date', `${today}T23:59:59`)
        .order('appointment_date', { ascending: true });

      // Fetch next appointment
      const now = new Date().toISOString();
      const { data: nextAppointment } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            profiles:profile_id (
              full_name
            )
          )
        `)
        .gte('appointment_date', now)
        .eq('status', 'scheduled')
        .order('appointment_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      // Fetch monthly revenue (current month completed appointments)
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString();
      
      const { data: monthlyAppointments } = await supabase
        .from('appointments')
        .select('price')
        .eq('status', 'completed')
        .gte('appointment_date', startOfMonth)
        .lte('appointment_date', endOfMonth);

      const monthlyRevenue = monthlyAppointments?.reduce((sum, apt) => sum + (apt.price || 0), 0) || 0;

      // Fetch recent patients
      const { data: recentPatientsData } = await supabase
        .from('patients')
        .select(`
          *,
          profiles:profile_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(4);

      // Update stats
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
          value: (todayCount || 0).toString(),
          change: `${todayCount || 0} agendadas`,
          icon: Calendar,
          color: 'text-accent'
        },
        {
          title: 'Próxima Consulta',
          value: nextAppointment ? new Date(nextAppointment.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
          change: nextAppointment ? nextAppointment.patients?.profiles?.full_name || 'Paciente' : 'sem agendamento',
          icon: Clock,
          color: 'text-warning'
        },
        {
          title: 'Receita Mensal',
          value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          change: `${monthlyAppointments?.length || 0} consultas`,
          icon: TrendingUp,
          color: 'text-success'
        }
      ]);

      setRecentAppointments(todayAppointments?.slice(0, 4) || []);
      setRecentPatients(recentPatientsData || []);

    } catch (error: any) {
      toast.error('Erro ao carregar dados do dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Novo Paciente',
      description: 'Cadastrar novo paciente',
      icon: UserPlus,
      href: '/patients/new'
    },
    {
      title: 'Agendar Consulta',
      description: 'Nova consulta no calendário',
      icon: CalendarPlus,
      href: '/appointments/new'
    },
    {
      title: 'Ver Calendário',
      description: 'Visualizar agenda completa',
      icon: Calendar,
      href: '/calendar'
    },
    {
      title: 'Relatórios',
      description: 'Relatórios e estatísticas',
      icon: FileText,
      href: '/reports'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div>
          <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta!</h2>
          <p className="text-muted-foreground">
            Aqui está um resumo das suas atividades de hoje.
          </p>
        </div>

        {/* Stats Grid */}
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

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as funções mais utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.href}>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-soft transition-all w-full"
                  >
                  <action.icon className="h-8 w-8 text-primary" />
                  <div className="text-center">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Próximas Consultas</CardTitle>
              <CardDescription>Consultas agendadas para hoje</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma consulta agendada para hoje
                </p>
              ) : (
                recentAppointments.map((appointment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-primary font-medium">
                        {new Date(appointment.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <p className="font-medium">{appointment.patients?.profiles?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.treatment_type || appointment.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Pacientes Recentes</CardTitle>
              <CardDescription>Últimos pacientes cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentPatients.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum paciente cadastrado ainda
                </p>
              ) : (
                recentPatients.map((patient, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-medium">
                          {patient.profiles?.full_name?.charAt(0) || 'P'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{patient.profiles?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-full">
                      Ativo
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;