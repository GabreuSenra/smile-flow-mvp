import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function DentistNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);

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
      const cro_number = formData.get('cro_number') as string;
      const specialization = formData.get('specialization') as string;

      // Primeiro, criar o perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          full_name,
          email,
          phone,
          user_role: 'dentist'
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // Depois, criar o dentista
      const { error: dentistError } = await supabase
        .from('dentists')
        .insert([{
          clinic_id: clinicId,
          profile_id: profileData.id,
          cro_number,
          specialization: specialization || null,
          work_hours: {
            monday: { start: "08:00", end: "18:00" },
            tuesday: { start: "08:00", end: "18:00" },
            wednesday: { start: "08:00", end: "18:00" },
            thursday: { start: "08:00", end: "18:00" },
            friday: { start: "08:00", end: "18:00" }
          }
        }]);

      if (dentistError) throw dentistError;

      toast.success('Dentista cadastrado com sucesso!');
      navigate('/dentists');

    } catch (error: any) {
      console.error('Erro ao cadastrar dentista:', error);
      toast.error(error.message || 'Erro ao cadastrar dentista');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Novo Dentista</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome completo</Label>
              <Input name="full_name" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" name="email" required />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input name="phone" />
            </div>
            <div>
              <Label>Número CRO</Label>
              <Input name="cro_number" required />
            </div>
            <div>
              <Label>Especialização</Label>
              <Input name="specialization" placeholder="Ex: Ortodontia, Endodontia, etc." />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Salvando...' : 'Salvar Dentista'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}