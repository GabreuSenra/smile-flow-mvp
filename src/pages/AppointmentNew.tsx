import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useRequireClinic } from '@/hooks/useRequireClinic';
import { useDentistAvailability } from '@/hooks/useDentistAvailability';

export default function AppointmentNew() {
  const navigate = useNavigate();
  const clinicId = useRequireClinic();
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [dentists, setDentists] = useState<any[]>([]);
  const [form, setForm] = useState({
    patient_id: '',
    dentist_id: '',
    date: '',
    time: '',
    duration: '',
    status: 'scheduled',
    treatment_type: '',
    price: '',
    notes: ''
  });
  
  const { availability, loading: availabilityLoading } = useDentistAvailability({
    date: form.date ? formatDateToDB(form.date) : '',
    clinicId: clinicId || '',
    selectedDentistId: form.dentist_id,
    duration: parseInt(form.duration) || 60
  });

  useEffect(() => {
    const fetchData = async () => {
      const [patientsResult, dentistsResult] = await Promise.all([
        supabase
          .from('patients')
          .select('id, full_name')
          .eq('clinic_id', clinicId),
        supabase
          .from('dentists')
          .select(`
            id,
            work_hours,
            dentist_profiles!inner(full_name)
          `)
          .eq('clinic_id', clinicId)
      ]);

      if (patientsResult.error) {
        toast.error('Erro ao carregar pacientes');
        return;
      }
      if (dentistsResult.error) {
        toast.error('Erro ao carregar dentistas');
        return;
      }
      
      setPatients(patientsResult.data || []);
      setDentists(dentistsResult.data || []);
    };

    if (clinicId) fetchData();
  }, [clinicId]);

  useEffect(() => {
    if (patientSearch.trim() === '') {
      setFilteredPatients([]);
    } else {
      setFilteredPatients(
        patients.filter(p =>
          p.full_name.toLowerCase().includes(patientSearch.toLowerCase())
        )
      );
    }
  }, [patientSearch, patients]);

  function formatDateToDB(date: string) {
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}`;
  }

  function formatDateFromDB(date: string) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    // Máscara de data
    if (name === 'date') {
      let v = value.replace(/\D/g, '');
      if (v.length >= 3 && v.length <= 4) v = v.replace(/^(\d{2})(\d+)/, '$1/$2');
      if (v.length > 4) v = v.replace(/^(\d{2})(\d{2})(\d+)/, '$1/$2/$3');
      setForm(prev => ({ ...prev, [name]: v }));
      return;
    }

    // Máscara de hora
    if (name === 'time') {
      let v = value.replace(/\D/g, '');
      if (v.length >= 3) v = v.replace(/^(\d{2})(\d+)/, '$1:$2');
      setForm(prev => ({ ...prev, [name]: v }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!clinicId) {
      toast.error('Clínica não encontrada');
      return;
    }

    const { error } = await supabase.from('appointments').insert({
      clinic_id: clinicId,
      patient_id: form.patient_id,
      dentist_id: form.dentist_id || null,
      date: formatDateToDB(form.date),
      time: form.time,
      duration: parseInt(form.duration, 10),
      status: form.status as "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show",
      treatment_type: form.treatment_type,
      price: parseFloat(form.price),
      notes: form.notes
    });

    if (error) {
      toast.error('Erro ao criar agendamento: ' + error.message);
    } else {
      toast.success('Agendamento criado com sucesso');
      navigate('/appointments');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Novo Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Paciente */}
            <div>
              <Label>
                Paciente <span className="text-red-500">*</span>
              </Label>
              <Input
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Digite para buscar paciente"
                required
                title="Selecione um paciente"
              />
              {filteredPatients.length > 0 && (
                <div className="border rounded mt-1 bg-white shadow max-h-40 overflow-y-auto">
                  {filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, patient_id: p.id }));
                        setPatientSearch(p.full_name);
                        setFilteredPatients([]);
                      }}
                    >
                      {p.full_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dentista */}
            <div>
              <Label>Dentista (Opcional)</Label>
              <select
                name="dentist_id"
                value={form.dentist_id}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option value="">Selecione um dentista</option>
                {dentists.map((dentist) => (
                  <option key={dentist.id} value={dentist.id}>
                    {dentist.dentist_profiles?.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <Label>
                Data <span className="text-red-500">*</span>
              </Label>
              <Input
                name="date"
                value={form.date}
                onChange={handleChange}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                required
                title="Informe a data no formato dd/mm/aaaa"
              />
            </div>

            {/* Hora */}
            <div>
              <Label>
                Hora <span className="text-red-500">*</span>
              </Label>
              {form.date && form.dentist_id ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Horários disponíveis:
                  </div>
                  {availabilityLoading ? (
                    <div className="text-sm">Carregando horários...</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availability
                        .find(d => d.dentistId === form.dentist_id)
                        ?.availableSlots.filter(slot => slot.available)
                        .map(slot => (
                          <Button
                            key={slot.time}
                            type="button"
                            variant={form.time === slot.time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setForm(prev => ({ ...prev, time: slot.time }))}
                          >
                            {slot.time}
                          </Button>
                        )) || <div className="text-sm text-muted-foreground">Nenhum horário disponível</div>}
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  placeholder={!form.date ? "Selecione uma data primeiro" : !form.dentist_id ? "Selecione um dentista primeiro" : "hh:mm"}
                  maxLength={5}
                  required
                  title="Informe a hora no formato hh:mm"
                  disabled={!form.date || !form.dentist_id}
                />
              )}
            </div>

            {/* Duração */}
            <div>
              <Label>
                Duração (min) <span className="text-red-500">*</span>
              </Label>
              <Input
                name="duration"
                type="number"
                value={form.duration}
                onChange={handleChange}
                required
                title="Informe a duração em minutos"
              />
            </div>

            {/* Status */}
            <div>
              <Label>
                Status <span className="text-red-500">*</span>
              </Label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
                title="Selecione o status"
              >
                <option value="scheduled">Agendada</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
                <option value="no_show">Falta</option>
              </select>
            </div>

            {/* Tipo de tratamento */}
            <div>
              <Label>
                Tipo de Tratamento <span className="text-red-500">*</span>
              </Label>
              <Input
                name="treatment_type"
                value={form.treatment_type}
                onChange={handleChange}
                required
                title="Informe o tipo de tratamento"
              />
            </div>

            {/* Preço */}
            <div>
              <Label>
                Preço <span className="text-red-500">*</span>
              </Label>
              <Input
                name="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
                title="Informe o preço"
              />
            </div>

            {/* Observações */}
            <div>
              <Label>Observações</Label>
              <Textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Anotações adicionais"
              />
            </div>

            <Button type="submit" className="w-full">
              Criar Agendamento
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
