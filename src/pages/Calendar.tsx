import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarPlus, User, Clock, Ban, Plus } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  treatment_type: string | null;
  price: number | null;
  notes: string | null;
  patients: {
    full_name: string;
    phone: string | null;
  };
}

const Calendar = () => {
  const navigate = useNavigate();
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
          id,
          date,
          time,
          duration,
          status,
          treatment_type,
          price,
          notes,
          patients:patient_id (
            full_name,
            phone
          )
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

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
      case 'scheduled': return '#3b82f6';
      case 'confirmed': return '#10b981';
      case 'completed': return '#059669';
      case 'cancelled': return '#ef4444';
      case 'no_show': return '#facc15';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendada';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'Falta';
      default: return status;
    }
  };

  const calendarEvents = appointments.map((appointment) => {
    const startDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const endDateTime = new Date(startDateTime.getTime() + (appointment.duration || 0) * 60000);

    return {
      id: appointment.id,
      title: appointment.patients.full_name || 'Paciente não informado',
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      backgroundColor: getStatusColor(appointment.status),
      borderColor: getStatusColor(appointment.status),
      extendedProps: { appointment }
    };
  });

  const handleEventClick = (info: any) => {
    setSelectedAppointment(info.event.extendedProps.appointment);
    setDialogOpen(true);
  };

  const handleDateClick = (info: any) => {
    // Navegar para nova consulta com data pré-selecionada
    const dateStr = info.dateStr;
    navigate(`/appointments/new?date=${dateStr}`);
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return {
      date: dateObj.toLocaleDateString('pt-BR'),
      time: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-6">Carregando calendário...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Calendário</h1>
            <p className="text-muted-foreground">Visualize todas as consultas</p>
          </div>
          <Link to="/appointments/new">
            <Button>
              <CalendarPlus className="h-4 w-4 mr-2" />
              Nova Consulta
            </Button>
          </Link>
        </div>

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
              dateClick={handleDateClick}
              selectable={true}
              height="auto"
              locale="pt-br"
              buttonText={{
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia'
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
            />
          </CardContent>
        </Card>

        {/* Dialog de detalhes */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            {selectedAppointment && (
              <>
                <DialogHeader>
                  <DialogTitle>Detalhes da consulta</DialogTitle>
                  <DialogDescription>
                    Informações completas sobre a consulta
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Badge style={{ backgroundColor: getStatusColor(selectedAppointment.status), color: 'white' }}>
                      {getStatusText(selectedAppointment.status)}
                    </Badge>
                    {selectedAppointment.price && (
                      <span className="font-semibold">
                        R$ {Number(selectedAppointment.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    {selectedAppointment.patients.full_name}
                  </div>
                  {selectedAppointment.patients.phone && (
                    <div className="ml-6 text-sm text-muted-foreground">
                      {selectedAppointment.patients.phone}
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    {formatDateTime(selectedAppointment.date, selectedAppointment.time).date} às {formatDateTime(selectedAppointment.date, selectedAppointment.time).time} ({selectedAppointment.duration} min)
                  </div>
                  {selectedAppointment.treatment_type && (
                    <div className="text-sm">
                      <span className="font-medium">Tipo:</span> {selectedAppointment.treatment_type}
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Observações:</span> {selectedAppointment.notes}
                    </div>
                  )}
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
