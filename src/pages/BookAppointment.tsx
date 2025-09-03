import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface TreatmentType {
  id: string;
  name: string;
  price: number;
}

interface AvailableSlot {
  time: string;
  available: boolean;
}

const BookAppointment = () => {
  const { code } = useParams<{ code: string }>();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    treatment: "",
    notes: "",
  });
  const [treatments, setTreatments] = useState<TreatmentType[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [clinicId, setClinicId] = useState<string | null>(null);

  // Horários disponíveis padrão (8h às 18h, intervalos de 30min)
  const generateTimeSlots = () => {
    const slots: AvailableSlot[] = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({ time, available: true });
      }
    }
    return slots;
  };

  useEffect(() => {
    if (code) {
      fetchClinicByCode();
    }
  }, [code]);

  useEffect(() => {
    if (clinicId) {
      fetchTreatments();
    }
  }, [clinicId]);

  useEffect(() => {
    if (selectedDate && code) {
      checkAvailability();
    }
  }, [selectedDate, code]);

  const fetchClinicByCode = async () => {
    const { data, error } = await supabase
      .from("clinics")
      .select("id, name")
      .eq('public_code', code)
      .single(); 

    if (error) {
      toast.error("Erro ao buscar clínica: " + error.message);
      return;
    }

    if (!data) {
      toast.error("Clínica não encontrada" + error.message);
      return;
    }

    setClinicName(data.name);
    setClinicId(data.id);
  };

  const fetchTreatments = async () => {
    const { data, error } = await supabase
      .from("treatment_types")
      .select("*")
      .eq("clinic_id", clinicId);
    if (error) {
      toast.error("Erro ao carregar tratamentos" + error.message);
    } else {
      setTreatments(data || []);
    }
  };

  const checkAvailability = async () => {
    if (!selectedDate) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayOfWeek = selectedDate.getDay();

    // Buscar configurações de bloqueio da clínica
    const { data: settings } = await supabase
      .from("clinic_settings")
      .select("setting_value")
      .eq("clinic_id", clinicId)
      .eq("setting_key", "schedule_blocks")
      .single();

    let blockedDays: number[] = [0, 6]; // Sunday and Saturday by default
    let blockedTimeRanges: { start: string; end: string }[] = [
      { start: '00:00', end: '08:00' },
      { start: '18:00', end: '23:59' }
    ];

    if (settings?.setting_value) {
      const parsedSettings = settings.setting_value as any;
      if (parsedSettings && typeof parsedSettings === 'object') {
        blockedDays = parsedSettings.blockedDays || blockedDays;
        blockedTimeRanges = parsedSettings.blockedTimeRanges || blockedTimeRanges;
      }
    }

    // Verificar se o dia está bloqueado
    if (blockedDays.includes(dayOfWeek)) {
      setAvailableSlots([]);
      return;
    }

    // Buscar consultas já agendadas para o dia
    const { data: appointments } = await supabase
      .from("appointments")
      .select("time, duration")
      .eq("clinic_id", clinicId)
      .eq("date", dateStr)
      .neq("status", "cancelled");

    const slots = generateTimeSlots();
    const occupiedTimes = new Set();

    // Marcar horários ocupados por consultas existentes
    appointments?.forEach(apt => {
      const startTime = apt.time;
      const duration = apt.duration || 60;
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;

      // Marcar todos os slots que se sobrepõem
      for (let i = 0; i < duration; i += 30) {
        const slotMinutes = startMinutes + i;
        const slotHour = Math.floor(slotMinutes / 60);
        const slotMin = slotMinutes % 60;
        const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMin.toString().padStart(2, '0')}`;
        occupiedTimes.add(slotTime);
      }
    });

    // Marcar horários bloqueados pelas configurações
    blockedTimeRanges.forEach(range => {
      const [startHour, startMinute] = range.start.split(':').map(Number);
      const [endHour, endMinute] = range.end.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      slots.forEach(slot => {
        const [slotHour, slotMinute] = slot.time.split(':').map(Number);
        const slotMinutes = slotHour * 60 + slotMinute;

        if (slotMinutes >= startMinutes && slotMinutes <= endMinutes) {
          occupiedTimes.add(slot.time);
        }
      });
    });

    // Atualizar disponibilidade
    const updatedSlots = slots.map(slot => ({
      ...slot,
      available: !occupiedTimes.has(slot.time)
    }));

    setAvailableSlots(updatedSlots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !selectedDate || !selectedTime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    const selectedTreatment = treatments.find((t) => t.id === form.treatment);
    const dateStr = selectedDate.toISOString().split('T')[0];

    const { error } = await supabase.from("appointment_requests").insert([
      {
        clinic_id: clinicId,
        patient_name: form.name,
        patient_phone: form.phone,
        treatment_type: selectedTreatment?.name || null,
        preferred_date: dateStr,
        preferred_time: selectedTime,
        notes: form.notes,
      },
    ]);

    setLoading(false);

    if (error) {
      toast.error("Erro ao solicitar consulta: " + error.message);
    } else {
      setSubmitted(true);
      toast.success("Sua solicitação foi enviada! Aguarde a confirmação.");
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Solicitação Enviada!</CardTitle>
            <CardDescription>
              Sua solicitação de consulta foi enviada com sucesso.
              A clínica entrará em contato para confirmar o agendamento.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Agendar Consulta</h1>
          {clinicName && (
            <p className="text-muted-foreground text-lg">{clinicName}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calendário */}
          <Card>
            <CardHeader>
              <CardTitle>Escolha uma Data</CardTitle>
              <CardDescription>
                Selecione o dia em que gostaria de ser atendido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0} // Desabilitar domingos e datas passadas
                className="rounded-md border"
              />

              {selectedDate && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Horários Disponíveis</h4>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className="text-xs"
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Seus Dados</CardTitle>
              <CardDescription>
                Preencha as informações para solicitar o agendamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="treatment">Tipo de Consulta</Label>
                  <Select
                    value={form.treatment}
                    onValueChange={(val) => setForm({ ...form, treatment: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tratamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {treatments.map((treatment) => (
                        <SelectItem key={treatment.id} value={treatment.id}>
                          {treatment.name} - R$ {treatment.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Alguma observação especial ou sintoma que gostaria de relatar..."
                    rows={3}
                  />
                </div>

                {selectedDate && selectedTime && (
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Resumo do Agendamento</h4>
                    <p className="text-sm text-muted-foreground">
                      Data: {selectedDate.toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Horário: {selectedTime}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !selectedDate || !selectedTime}
                >
                  {loading ? "Enviando..." : "Solicitar Agendamento"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;