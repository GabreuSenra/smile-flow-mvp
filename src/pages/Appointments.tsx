import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CalendarPlus, 
  Search, 
  Calendar,
  Clock,
  User,
  Stethoscope
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  appointment_date: string;
  title: string;
  description: string | null;
  status: string;
  treatment_type: string | null;
  price: number | null;
  duration_minutes: number | null;
  patients: {
    profiles: {
      full_name: string;
      phone: string | null;
    };
  };
  dentists: {
    profiles: {
      full_name: string;
    };
  };
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            profiles:profile_id (
              full_name,
              phone
            )
          ),
          dentists:dentist_id (
            profiles:profile_id (
              full_name
            )
          )
        `)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar consultas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendada';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.patients.profiles.full_name.toLowerCase().includes(search.toLowerCase()) ||
      appointment.title.toLowerCase().includes(search.toLowerCase()) ||
      (appointment.treatment_type && appointment.treatment_type.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-secondary rounded"></div>
              ))}
            </div>
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
            <h1 className="text-3xl font-bold">Consultas</h1>
            <p className="text-muted-foreground">
              Gerencie as consultas da clínica
            </p>
          </div>
          <Link to="/appointments/new">
            <Button>
              <CalendarPlus className="h-4 w-4 mr-2" />
              Nova Consulta
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente, título ou tipo de tratamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="scheduled">Agendada</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  {search || statusFilter !== 'all' 
                    ? 'Nenhuma consulta encontrada com os filtros aplicados.' 
                    : 'Nenhuma consulta agendada ainda.'
                  }
                </p>
                {!search && statusFilter === 'all' && (
                  <Link to="/appointments/new">
                    <Button className="mt-4">
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Agendar Primeira Consulta
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.appointment_date);
              
              return (
                <Card key={appointment.id} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(appointment.status)}`}></div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-4">
                            <h3 className="font-semibold text-lg">{appointment.title}</h3>
                            <Badge variant="outline">
                              {getStatusText(appointment.status)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {appointment.patients.profiles.full_name}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {date}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {time}
                              {appointment.duration_minutes && ` (${appointment.duration_minutes}min)`}
                            </div>
                            {appointment.dentists?.profiles && (
                              <div className="flex items-center">
                                <Stethoscope className="h-3 w-3 mr-1" />
                                Dr. {appointment.dentists.profiles.full_name}
                              </div>
                            )}
                          </div>
                          
                          {appointment.treatment_type && (
                            <p className="text-sm text-muted-foreground">
                              Tipo: {appointment.treatment_type}
                            </p>
                          )}
                          
                          {appointment.description && (
                            <p className="text-sm text-muted-foreground">
                              {appointment.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {appointment.price && (
                          <p className="font-semibold text-lg">
                            R$ {appointment.price.toFixed(2)}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;