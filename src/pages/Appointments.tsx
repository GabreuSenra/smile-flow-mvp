import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Eye, Calendar as CalendarIcon, User, Clock, Stethoscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export default function Appointments() {
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
      case 'scheduled': return 'bg-blue-500 text-white';
      case 'confirmed': return 'bg-green-500 text-white';
      case 'completed': return 'bg-emerald-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      case 'no_show': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-6 text-center text-muted-foreground">Carregando consultas...</div>
      </div>
    );
  }

  function formatDate(date: string) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  function formatTime(date: string) {
    const [hour, minutes] = date.split(':');
    return `${hour}:${minutes}`;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Consultas</h1>
            <p className="text-muted-foreground">Gerencie as consultas da clínica</p>
          </div>
          <Link to="/appointments/new">
            <Button>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Nova Consulta
            </Button>
          </Link>
        </div>

        {appointments.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma consulta cadastrada.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="shadow-sm hover:shadow-md transition">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      {appointment.patients?.full_name || 'Paciente não informado'}
                    </CardTitle>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {appointment.treatment_type || 'Tratamento não especificado'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    { formatDate(appointment.date)}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatTime(appointment.time)} ({appointment.duration} min)
                  </div>
                  {appointment.price && (
                    <div className="text-sm font-semibold">
                      R$ {Number(appointment.price).toFixed(2)}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Link to={`/appointments/${appointment.id}/edit`}>
                      <Button size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
                    <Badge className={getStatusColor(selectedAppointment.status)}>
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
                    {selectedAppointment.date} às {selectedAppointment.time} ({selectedAppointment.duration} min)
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
}
