import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SetupClinic() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);

      // Garantir que a sessão está ativa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('Sessão inválida. Faça login novamente.');
        navigate('/auth');
        return;
      }

      const name = formData.get('name') as string;
      const phone = formData.get('phone') as string;
      const address = formData.get('address') as string;
      const email = formData.get('email') as string;

      // 1️⃣ Inserir clínica
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .insert([{
          owner_id: session.user.id,
          name,
          phone,
          address,
          email
        }])
        .select()
        .single();

      if (clinicError) throw clinicError;

      // 2️⃣ Inserir vínculo do usuário como membro
      const { error: memberError } = await supabase
        .from('clinic_members')
        .insert([{
          clinic_id: clinic.id,
          user_id: session.user.id,
          role: 'owner'
        }]);

      if (memberError) throw memberError;

      toast.success('Clínica criada com sucesso!');
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Erro ao criar clínica:', error);
      toast.error(error.message || 'Erro ao criar clínica');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Configurar Clínica</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome da clínica</Label>
              <Input name="name" required />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input name="phone" />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input name="address" />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Salvando...' : 'Salvar e continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
