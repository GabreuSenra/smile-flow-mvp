import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function PatientNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);

  // 1️⃣ Buscar clinic_id do usuário logado
  useEffect(() => {
    async function fetchClinicId() {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('Sessão inválida, faça login novamente.');
        navigate('/auth');
        return;
      }

      const { data: membership, error: memberError } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .eq('user_id', session.user.id)
        .single();

      if (memberError || !membership) {
        toast.error('Não foi possível encontrar sua clínica.');
        navigate('/setup-clinic');
        return;
      }

      setClinicId(membership.clinic_id);
    }

    fetchClinicId();
  }, [navigate]);

  // 2️⃣ Cadastrar paciente
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!clinicId) {
        toast.error('Clínica não encontrada para este usuário.');
        return;
      }

      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);

      const full_name = formData.get('full_name') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;
      const cpf = formData.get('cpf') as string;
      const birth_date = formData.get('birth_date') as string;
      const address = formData.get('address') as string;
      const emergency_contact = formData.get('emergency_contact') as string;
      const allergies = formData.get('allergies') as string;
      const medical_conditions = formData.get('medical_conditions') as string;

      const { error } = await supabase
        .from('patients')
        .insert([{
          clinic_id: clinicId,
          full_name,
          email,
          phone,
          cpf,
          birth_date,
          address,
          emergency_contact,
          allergies,
          medical_conditions
        }]);

      if (error) throw error;

      toast.success('Paciente cadastrado com sucesso!');
      navigate('/patients');

    } catch (error: any) {
      console.error('Erro ao cadastrar paciente:', error);
      toast.error(error.message || 'Erro ao cadastrar paciente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Novo Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome completo</Label>
              <Input name="full_name" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" name="email" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input name="phone" />
            </div>
            <div>
              <Label>CPF</Label>
              <Input name="cpf" />
            </div>
            <div>
              <Label>Data de nascimento</Label>
              <Input type="date" name="birth_date" />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input name="address" />
            </div>
            <div>
              <Label>Contato de Emergência</Label>
              <Input name="emergency_contact" />
            </div>
            <div>
              <Label>Alergias</Label>
              <Textarea name="allergies" />
            </div>
            <div>
              <Label>Condições médicas</Label>
              <Textarea name="medical_conditions" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Salvando...' : 'Salvar Paciente'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
