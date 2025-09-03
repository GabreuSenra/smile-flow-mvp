import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { 
  LogOut,
  Stethoscope,
  Menu,
  Bell,
  Check,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Navigation } from './Navigation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AppointmentRequest {
  id: string;
  patient_name: string;
  patient_phone: string;
  treatment_type: string | null;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  created_at: string;
}

export const Header = () => {
  const { signOut, user } = useAuth();
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);

  const fetchAppointmentRequests = async () => {
    const { data, error } = await supabase
      .from("appointment_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setAppointmentRequests(data);
    }
  };

  useEffect(() => {
    fetchAppointmentRequests();

    // Listen for realtime changes
    const channel = supabase
      .channel('header-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointment_requests'
        },
        (payload) => {
          console.log('Nova solicitação recebida no header:', payload);
          setAppointmentRequests(prev => [payload.new as AppointmentRequest, ...prev.slice(0, 4)]);
          toast.success('Nova solicitação de consulta!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAcceptRequest = async (request: AppointmentRequest) => {
    try {
      // Check if patient exists
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', request.patient_phone)
        .single();

      let patientId = existingPatient?.id;

      if (!existingPatient) {
        // Create new patient
        const { data: clinicMember } = await supabase
          .from('clinic_members')
          .select('clinic_id')
          .single();

        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert([{
            full_name: request.patient_name,
            phone: request.patient_phone,
            clinic_id: clinicMember?.clinic_id
          }])
          .select('id')
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      // Get treatment price
      let price = null;
      if (request.treatment_type) {
        const { data: treatment } = await supabase
          .from('treatment_types')
          .select('price')
          .eq('name', request.treatment_type)
          .single();
        
        if (treatment) price = treatment.price;
      }

      // Get clinic ID
      const { data: clinicMember } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .single();

      // Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          patient_id: patientId,
          clinic_id: clinicMember?.clinic_id,
          date: request.preferred_date,
          time: request.preferred_time,
          treatment_type: request.treatment_type,
          notes: request.notes,
          price: price,
          status: 'scheduled'
        }]);

      if (appointmentError) throw appointmentError;

      // Delete the request
      const { error: deleteError } = await supabase
        .from('appointment_requests')
        .delete()
        .eq('id', request.id);

      if (deleteError) throw deleteError;

      setAppointmentRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success('Consulta aceita e agendada!');
    } catch (error: any) {
      toast.error('Erro ao aceitar consulta: ' + error.message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('appointment_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setAppointmentRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Solicitação rejeitada');
    } catch (error: any) {
      toast.error('Erro ao rejeitar consulta: ' + error.message);
    }
  };

  const unreadCount = appointmentRequests.length;

  return (
    <header className="border-b bg-card shadow-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">OdontoFlow</h1>
              <p className="text-sm text-muted-foreground">Sistema Odontológico</p>
            </div>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <Navigation />
        </div>

        <div className="flex items-center space-x-4">
          {/* 🔔 Sininho de notificações */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative">
                <Bell className="h-6 w-6 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
              <h3 className="font-semibold mb-2">Solicitações de Consulta</h3>
              {appointmentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {appointmentRequests.map((request) => (
                    <div key={request.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{request.patient_name}</p>
                          <p className="text-xs text-muted-foreground">{request.patient_phone}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.preferred_date).toLocaleDateString('pt-BR')} às {request.preferred_time}
                          </p>
                          {request.treatment_type && (
                            <p className="text-xs text-muted-foreground">
                              Tipo: {request.treatment_type}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcceptRequest(request)}
                            className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          <div className="text-right">
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Dentista</p>
          </div>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <Navigation />
            </SheetContent>
          </Sheet>

          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};
