import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarPlus, User, Clock, Stethoscope, Eye } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
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

const Calendar = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      case 'scheduled': return '#3b82f6'; // blue
      case 'completed': return '#10b981'; // green
      case 'cancelled': return '#ef4444'; // red
      default: return '#6b7280'; // gray
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

  const calendarEvents = appointments.map(appointment => ({
    id: appointment.id,
    title: `${appointment.title} - ${appointment.patients.profiles.full_name}`,
    start: appointment.appointment_date,
    end: appointment.duration_minutes 
      ? new Date(new Date(appointment.appointment_date).getTime() + appointment.duration_minutes * 60000).toISOString()
      : appointment.appointment_date,
    backgroundColor: getStatusColor(appointment.status),
    borderColor: getStatusColor(appointment.status),
    extendedProps: {
      appointment: appointment
    }
  }));

  const handleEventClick = (info: any) => {
    const appointment = info.event.extendedProps.appointment;
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

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
            <h1 className="text-3xl font-bold">Calendário</h1>
            <p className="text-muted-foreground">
              Visualize todas as consultas em um calendário interativo
            </p>
          </div>
          <Link to="/appointments/new">
            <Button>
              <CalendarPlus className="h-4 w-4 mr-2" />
              Nova Consulta
            </Button>
          </Link>
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                <span className="text-sm">Agendada</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                <span className="text-sm">Concluída</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                <span className="text-sm">Cancelada</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardContent className="p-6">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              height="auto"
              locale="pt-br"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              firstDay={1} // Monday
              dayMaxEvents={3}
              moreLinkText="mais"
              eventDisplay="block"
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
                startTime: '08:00',
                endTime: '18:00'
              }}
            />
          </CardContent>
        </Card>

        {/* Appointment Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            {selectedAppointment && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedAppointment.title}</DialogTitle>
                  <DialogDescription>
                    Detalhes da consulta
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-sm">
                      {getStatusText(selectedAppointment.status)}
                    </Badge>
                    {selectedAppointment.price && (
                      <span className="font-semibold">
                        R$ {selectedAppointment.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{selectedAppointment.patients.profiles.full_name}</span>
                    </div>
                    
                    {selectedAppointment.patients.profiles.phone && (
                      <div className="flex items-center text-sm">
                        <span className="ml-6 text-muted-foreground">
                          {selectedAppointment.patients.profiles.phone}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm">
                      <Stethoscope className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Dr. {selectedAppointment.dentists.profiles.full_name}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {formatDateTime(selectedAppointment.appointment_date).date} às {formatDateTime(selectedAppointment.appointment_date).time}
                        {selectedAppointment.duration_minutes && ` (${selectedAppointment.duration_minutes}min)`}
                      </span>
                    </div>
                    
                    {selectedAppointment.treatment_type && (
                      <div className="text-sm">
                        <span className="font-medium">Tipo: </span>
                        {selectedAppointment.treatment_type}
                      </div>
                    )}
                    
                    {selectedAppointment.description && (
                      <div className="text-sm">
                        <span className="font-medium">Observações: </span>
                        {selectedAppointment.description}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    <Button size="sm">
                      Editar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Calendar;