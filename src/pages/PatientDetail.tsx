// PatientDetail.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null; // preferível YYYY-MM-DD
  address: string | null;
  emergency_contact: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  clinic_id?: string | null;
  created_at?: string | null;
}

/**
 * Converte várias formas de data pra formato YYYY-MM-DD aceitável pelo <input type="date" />
 */
function toInputDate(date?: string | null) {
  if (!date) return '';
  // ISO timestamp -> keep date part
  if (date.includes('T')) return date.split('T')[0];
  // já no formato yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  // dd/mm/yyyy -> converter
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [d, m, y] = date.split('/');
    return `${y}-${m}-${d}`;
  }
  // fallback
  return date;
}

/**
 * Form reutilizável. Pode receber `patient` (objeto) ou `patientId` (string)
 * onSaved é chamado quando o registro é salvo com sucesso (útil para fechar dialog / recarregar lista)
 */
export function PatientForm({
  patient,
  patientId,
  onSaved,
  onCancel,
}: {
  patient?: Patient | null;
  patientId?: string | null;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
    birth_date: '',
    address: '',
    emergency_contact: '',
    allergies: '',
    medical_conditions: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // debug rápido — abra o console e veja esses valores ao abrir o form
  useEffect(() => {
    console.debug('PatientForm mounted — props:', { patient, patientId });
  }, [patient, patientId]);

  // Se receber um `patient` já carregado (por exemplo vindo do array da list), preenche o form imediatamente.
  useEffect(() => {
    if (patient) {
      setForm({
        full_name: patient.full_name || '',
        email: patient.email || '',
        phone: patient.phone || '',
        cpf: patient.cpf || '',
        birth_date: toInputDate(patient.birth_date),
        address: patient.address || '',
        emergency_contact: patient.emergency_contact || '',
        allergies: patient.allergies || '',
        medical_conditions: patient.medical_conditions || '',
      });
      return;
    }
    // caso não tenha patient, se houver patientId, buscar do DB
    if (patientId) {
      fetchPatient(patientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, patientId]);

  async function fetchPatient(id: string) {
    setLoading(true);
    console.debug('Fetching patient by id:', id);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error fetching patient:', error);
        toast.error('Erro ao carregar paciente');
        return;
      }

      if (!data) {
        console.warn('Nenhum paciente retornado do banco para id', id);
        toast.error('Paciente não encontrado');
        return;
      }

      setForm({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        cpf: data.cpf || '',
        birth_date: toInputDate(data.birth_date),
        address: data.address || '',
        emergency_contact: data.emergency_contact || '',
        allergies: data.allergies || '',
        medical_conditions: data.medical_conditions || '',
      });
      console.debug('Patient fetched:', data);
    } catch (err: any) {
      console.error('Erro inesperado ao buscar paciente:', err);
      toast.error(err?.message || 'Erro ao carregar paciente');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  const targetId = patient?.id || patientId;
  if (!targetId) {
    toast.error('ID do paciente ausente — impossível salvar');
    return;
  }

  setSaving(true);
  try {
    const payload = {
      full_name: form.full_name || null,
      email: form.email || null,
      phone: form.phone || null,
      cpf: form.cpf || null,
      birth_date: form.birth_date || null, // já em YYYY-MM-DD
      address: form.address || null,
      emergency_contact: form.emergency_contact || null,
      allergies: form.allergies || null,
      medical_conditions: form.medical_conditions || null,
    };

    console.debug("Tentando atualizar paciente:", { id: targetId, payload });

    const { data, error } = await supabase
      .from("patients")
      .update(payload)
      .eq("id", targetId)
      .select(); // força retorno do registro atualizado

    if (error) {
      console.error("Erro Supabase update:", error);
      toast.error("Erro ao atualizar paciente");
      return;
    }

    if (!data || data.length === 0) {
      console.warn("Nenhum registro atualizado. Verifique RLS ou se o ID está correto.");
      toast.error("Paciente não foi atualizado.");
      return;
    }

    console.debug("Paciente atualizado com sucesso:", data);
    toast.success("Paciente atualizado com sucesso!");
    onSaved?.();
  } catch (err: any) {
    console.error("Erro inesperado ao salvar paciente:", err);
    toast.error(err?.message || "Erro ao salvar paciente");
  } finally {
    setSaving(false);
  }
}


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nome completo</Label>
        <Input
          name="full_name"
          value={form.full_name}
          onChange={(e) => handleChange('full_name', e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          name="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <Label>Telefone</Label>
        <Input
          name="phone"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <Label>CPF</Label>
        <Input
          name="cpf"
          value={form.cpf}
          onChange={(e) => handleChange('cpf', e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <Label>Data de nascimento</Label>
        <Input
          type="date"
          name="birth_date"
          value={form.birth_date}
          onChange={(e) => handleChange('birth_date', e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <Label>Endereço</Label>
        <Input
          name="address"
          value={form.address}
          onChange={(e) => handleChange('address', e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <Label>Contato de Emergência</Label>
        <Input
          name="emergency_contact"
          value={form.emergency_contact}
          onChange={(e) => handleChange('emergency_contact', e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <Label>Alergias</Label>
        <Textarea
          name="allergies"
          value={form.allergies}
          onChange={(e) => handleChange('allergies', e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <Label>Condições médicas</Label>
        <Textarea
          name="medical_conditions"
          value={form.medical_conditions}
          onChange={(e) => handleChange('medical_conditions', e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Paciente'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Página /patients/:id — usa PatientForm passando patientId.
 * Também exportamos PatientForm acima pra uso dentro do Dialog do Patients.tsx.
 */
export default function PatientDetailPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // simples UX: se não tiver id, mostra mensagem curta
  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Editar Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">ID do paciente ausente na rota.</p>
            <div className="flex justify-end mt-4">
              <Button onClick={() => navigate('/patients')}>Voltar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Editar Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm
            patientId={id}
            onSaved={() => navigate('/patients')}
            onCancel={() => navigate('/patients')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
