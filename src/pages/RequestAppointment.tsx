import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { OnlineBookingCheck } from "@/components/OnlineBookingCheck";

const RequestAppointment = () => {
  const { clinicId } = useParams<{ clinicId: string }>();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    treatment: "",
    dentist: "",
    date: "",
    time: "",
    notes: "",
  });
  const [treatments, setTreatments] = useState<any[]>([]);
  const [dentists, setDentists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Buscar tratamentos e dentistas da clínica
  useEffect(() => {
    if (clinicId) fetchData();
  }, [clinicId]);

  const fetchData = async () => {
    const [treatmentsResult, dentistsResult] = await Promise.all([
      supabase
        .from("treatment_types")
        .select("*")
        .eq("clinic_id", clinicId),
      supabase
        .from("dentists")
        .select(`
          id,
          work_hours,
          dentist_profiles!inner(full_name)
        `)
        .eq("clinic_id", clinicId)
    ]);

    if (treatmentsResult.error) {
      toast.error("Erro ao carregar tratamentos");
    } else {
      setTreatments(treatmentsResult.data || []);
    }

    if (dentistsResult.error) {
      toast.error("Erro ao carregar dentistas");
    } else {
      setDentists(dentistsResult.data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) {
      toast.error("Clínica inválida");
      return;
    }

    setLoading(true);

    const selectedTreatment = treatments.find((t) => t.id === form.treatment);

    const { error } = await supabase.from("appointment_requests").insert([
      {
        clinic_id: clinicId,
        patient_name: form.name,
        patient_phone: form.phone,
        treatment_type: selectedTreatment?.name,
        preferred_date: form.date,
        preferred_time: form.time,
        preferred_dentist_id: form.dentist || null,
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
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Solicitação enviada!</CardTitle>
            <CardDescription>
              Em breve você receberá a confirmação no WhatsApp.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <OnlineBookingCheck>
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Marcar Consulta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para solicitar uma consulta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                name="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(11) 91234-5678"
                required
              />
            </div>
            <div>
              <Label>Tipo de Consulta</Label>
              <Select
                value={form.treatment}
                onValueChange={(val) => setForm({ ...form, treatment: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tratamento" />
                </SelectTrigger>
                <SelectContent>
                  {treatments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — R$ {t.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dentista (Opcional)</Label>
              <Select
                value={form.dentist}
                onValueChange={(val) => setForm({ ...form, dentist: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um dentista (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.map((dentist) => (
                    <SelectItem key={dentist.id} value={dentist.id}>
                      {dentist.dentist_profiles?.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Preferida</Label>
              <Input
                type="date"
                name="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Horário Preferido</Label>
              <Input
                type="time"
                name="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Input
                name="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ex: Preciso de anestesia..."
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Solicitar Consulta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </OnlineBookingCheck>
  );
};

export default RequestAppointment;
