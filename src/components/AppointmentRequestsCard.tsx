import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calendar as CalendarIcon, User, Clock, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AppointmentRequest {
  id: string;
  patient_name: string;
  patient_phone: string;
  treatment_type: string | null;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export const AppointmentRequestsCard = () => {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('appointment_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar solicitações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Listen for realtime changes
    const channel = supabase
      .channel('appointment-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointment_requests'
        },
        (payload) => {
          console.log('Nova solicitação recebida:', payload);
          setRequests(prev => [payload.new as AppointmentRequest, ...prev]);
          toast.success('Nova solicitação de consulta recebida!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAccept = async (request: AppointmentRequest) => {
    try {
      // First, check if we need to create a patient
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', request.patient_phone)
        .single();

      let patientId = existingPatient?.id;

      if (!existingPatient) {
        // Create new patient
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert([{
            full_name: request.patient_name,
            phone: request.patient_phone,
            clinic_id: await getClinicId()
          }])
          .select('id')
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      // Get treatment price if available
      let price = null;
      if (request.treatment_type) {
        const { data: treatment } = await supabase
          .from('treatment_types')
          .select('price')
          .eq('name', request.treatment_type)
          .single();
        
        if (treatment) price = treatment.price;
      }

      // Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          patient_id: patientId,
          clinic_id: await getClinicId(),
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

      setRequests(prev => prev.filter(r => r.id !== request.id));
      toast.success('Consulta aceita e agendada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao aceitar consulta: ' + error.message);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('appointment_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Solicitação rejeitada');
    } catch (error: any) {
      toast.error('Erro ao rejeitar consulta: ' + error.message);
    }
  };

  const getClinicId = async () => {
    const { data } = await supabase
      .from('clinic_members')
      .select('clinic_id')
      .single();
    return data?.clinic_id;
  };

  if (loading) return <div className="text-center">Carregando solicitações...</div>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Solicitações de Consulta
            {requests.length > 0 && (
              <Badge variant="secondary">{requests.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma solicitação pendente
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{request.patient_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Phone className="h-4 w-4" />
                      {request.patient_phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(request.preferred_date).toLocaleDateString('pt-BR')} às {request.preferred_time}
                    </div>
                    {request.treatment_type && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Tipo: {request.treatment_type}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request);
                        setDialogOpen(true);
                      }}
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAccept(request)}
                      className="text-green-600 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(request.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da Solicitação</DialogTitle>
                <DialogDescription>
                  Informações completas sobre a solicitação de consulta
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  {selectedRequest.patient_name}
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  {selectedRequest.patient_phone}
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  {new Date(selectedRequest.preferred_date).toLocaleDateString('pt-BR')} às {selectedRequest.preferred_time}
                </div>
                {selectedRequest.treatment_type && (
                  <div className="text-sm">
                    <span className="font-medium">Tipo:</span> {selectedRequest.treatment_type}
                  </div>
                )}
                {selectedRequest.notes && (
                  <div className="text-sm">
                    <span className="font-medium">Observações:</span> {selectedRequest.notes}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Solicitado em: {new Date(selectedRequest.created_at).toLocaleString('pt-BR')}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      handleAccept(selectedRequest);
                      setDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aceitar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleReject(selectedRequest.id);
                      setDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};