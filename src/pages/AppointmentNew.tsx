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

export default function AppointmentNew() {
  const navigate = useNavigate();
  const clinicId = useRequireClinic();
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [form, setForm] = useState({
    patient_id: '',
    date: '',
    time: '',
    duration: '',
    status: 'scheduled',
    treatment_type: '',
    price: '',
    notes: ''
  });

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('clinic_id', clinicId);

      if (error) {
        toast.error('Erro ao carregar pacientes');
        return;
      }
      setPatients(data || []);
    };

    if (clinicId) fetchPatients();
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
              <Input
                name="time"
                value={form.time}
                onChange={handleChange}
                placeholder="hh:mm"
                maxLength={5}
                required
                title="Informe a hora no formato hh:mm"
              />
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
