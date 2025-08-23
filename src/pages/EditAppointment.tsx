import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Appointment {
  date: string;
  time: string;
  duration: number;
  patient_id: string;
  treatment_type: string | null;
  price: number | null;
  status: string;
  notes: string | null;
}

export default function EditAppointment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Erro ao carregar consulta");
      console.error(error);
    } else {
      // ✅ Corrige a inversão de dia/mês ao carregar
      if (data?.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        const [year, month, day] = data.date.split("-");
        data.date = `${day}/${month}/${year}`;
      }
      setAppointment(data);
    }
    setLoading(false);
  };

  const handleChange = (field: keyof Appointment, value: any) => {
    setAppointment((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  // Máscara para Data (DD/MM/AAAA)
  const handleDateChange = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length >= 5) v = v.replace(/^(\d{2})(\d{2})(\d)/, "$1/$2/$3");
    if (v.length >= 10) v = v.replace(/^(\d{2})\/(\d{2})\/(\d{4}).*/, "$1/$2/$3");
    handleChange("date", v);
  };

  // Máscara para Hora (HH:MM)
  const handleTimeChange = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length >= 3) v = v.replace(/^(\d{2})(\d)/, "$1:$2");
    if (v.length >= 5) v = v.replace(/^(\d{2}):(\d{2}).*/, "$1:$2");
    handleChange("time", v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    // ✅ Converte DD/MM/AAAA para YYYY-MM-DD antes de salvar
    const [day, month, year] = appointment.date.split("/");
    const dateForDB = `${year}-${month}-${day}`;

    const { error } = await supabase
      .from("appointments")
      .update({
        ...appointment,
        date: dateForDB
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar consulta");
      console.error(error);
    } else {
      toast.success("Consulta atualizada com sucesso!");
      navigate("/appointments");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-6 text-center text-muted-foreground">
          Carregando consulta...
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-6 text-center text-muted-foreground">
          Consulta não encontrada.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Editar Consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                placeholder="DD/MM/AAAA"
                value={appointment.date}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                title="Informe a data no formato DD/MM/AAAA"
              />
            </div>

            <div>
              <Label htmlFor="time">Hora *</Label>
              <Input
                id="time"
                placeholder="HH:MM"
                value={appointment.time}
                onChange={(e) => handleTimeChange(e.target.value)}
                required
                title="Informe a hora no formato HH:MM"
              />
            </div>

            <div>
              <Label htmlFor="duration">Duração (minutos) *</Label>
              <Input
                id="duration"
                type="number"
                value={appointment.duration}
                onChange={(e) => handleChange("duration", Number(e.target.value))}
                required
                min={1}
                title="Informe a duração da consulta em minutos"
              />
            </div>

            <div>
              <Label htmlFor="treatment_type">Tipo de Tratamento</Label>
              <Input
                id="treatment_type"
                value={appointment.treatment_type || ""}
                onChange={(e) => handleChange("treatment_type", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="price">Preço</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={appointment.price || ""}
                onChange={(e) => handleChange("price", Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                className="w-full border rounded px-3 py-2"
                value={appointment.status}
                onChange={(e) => handleChange("status", e.target.value)}
                required
                title="Selecione o status da consulta"
              >
                <option value="scheduled">Agendada</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
                <option value="no_show">Falta</option>
              </select>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={appointment.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => navigate("/appointments")}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
