import { useAuth } from '@/components/auth/AuthProvider';
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
  LogOut,
  Stethoscope
} from 'lucide-react';

const Dashboard = () => {
  const { signOut, user } = useAuth();

  const stats = [
    {
      title: 'Pacientes Ativos',
      value: '156',
      change: '+12%',
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'Consultas Hoje',
      value: '8',
      change: '+2',
      icon: Calendar,
      color: 'text-accent'
    },
    {
      title: 'Próxima Consulta',
      value: '14:30',
      change: 'em 2h',
      icon: Clock,
      color: 'text-warning'
    },
    {
      title: 'Receita Mensal',
      value: 'R$ 24.500',
      change: '+18%',
      icon: TrendingUp,
      color: 'text-success'
    }
  ];

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
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">SmileFlow</h1>
              <p className="text-sm text-muted-foreground">Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Dentista</p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

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
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-soft transition-all"
                  onClick={() => {
                    // TODO: Navigate to action.href
                    console.log('Navigate to:', action.href);
                  }}
                >
                  <action.icon className="h-8 w-8 text-primary" />
                  <div className="text-center">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </Button>
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
              {[
                { time: '09:00', patient: 'Maria Silva', type: 'Limpeza' },
                { time: '10:30', patient: 'João Santos', type: 'Extração' },
                { time: '14:00', patient: 'Ana Costa', type: 'Consulta' },
                { time: '15:30', patient: 'Pedro Lima', type: 'Tratamento' }
              ].map((appointment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-primary font-medium">
                      {appointment.time}
                    </div>
                    <div>
                      <p className="font-medium">{appointment.patient}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.type}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Pacientes Recentes</CardTitle>
              <CardDescription>Últimos pacientes cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Carlos Oliveira', date: 'Cadastrado hoje', status: 'Novo' },
                { name: 'Lucia Ferreira', date: 'Ontem', status: 'Ativo' },
                { name: 'Roberto Silva', date: '2 dias atrás', status: 'Ativo' },
                { name: 'Marina Costa', date: '3 dias atrás', status: 'Retorno' }
              ].map((patient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-medium">
                        {patient.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.date}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-full">
                    {patient.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;