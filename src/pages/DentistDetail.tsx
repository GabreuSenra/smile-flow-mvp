import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export interface Dentist {
  id: string;
  cro_number: string;
  specialization: string | null;
  work_hours: any;
  clinic_id: string;
  profile_id: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
}

export function DentistForm({
  dentist,
  dentistId,
  onSaved,
  onCancel,
}: {
  dentist?: Dentist | null;
  dentistId?: string | null;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    cro_number: '',
    specialization: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (dentist) {
      setForm({
        full_name: dentist.profiles?.full_name || '',
        email: dentist.profiles?.email || '',
        phone: dentist.profiles?.phone || '',
        cro_number: dentist.cro_number || '',
        specialization: dentist.specialization || '',
      });
      return;
    }
    if (dentistId) {
      fetchDentist(dentistId);
    }
  }, [dentist, dentistId]);

  async function fetchDentist(id: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dentists')
        .select(`
          *,
          profiles:profile_id (
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error fetching dentist:', error);
        toast.error('Erro ao carregar dentista');
        return;
      }

      if (!data) {
        toast.error('Dentista não encontrado');
        return;
      }

      setForm({
        full_name: data.profiles?.full_name || '',
        email: data.profiles?.email || '',
        phone: data.profiles?.phone || '',
        cro_number: data.cro_number || '',
        specialization: data.specialization || '',
      });
    } catch (err: any) {
      console.error('Erro inesperado ao buscar dentista:', err);
      toast.error(err?.message || 'Erro ao carregar dentista');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetId = dentist?.id || dentistId;
    const profileId = dentist?.profiles?.id || dentist?.profile_id;
    
    if (!targetId || !profileId) {
      toast.error('ID do dentista ausente — impossível salvar');
      return;
    }

    setSaving(true);
    try {
      // Atualizar o perfil primeiro
      const profilePayload = {
        full_name: form.full_name || null,
        email: form.email || null,
        phone: form.phone || null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', profileId);

      if (profileError) {
        console.error('Erro Supabase update profile:', profileError);
        toast.error('Erro ao atualizar perfil do dentista');
        return;
      }

      // Depois atualizar o dentista
      const dentistPayload = {
        cro_number: form.cro_number || null,
        specialization: form.specialization || null,
      };

      const { data, error } = await supabase
        .from('dentists')
        .update(dentistPayload)
        .eq('id', targetId)
        .select();

      if (error) {
        console.error('Erro Supabase update dentist:', error);
        toast.error('Erro ao atualizar dentista');
        return;
      }

      if (!data || data.length === 0) {
        console.warn('Nenhum registro atualizado. Verifique RLS ou se o ID está correto.');
        toast.error('Dentista não foi atualizado.');
        return;
      }

      toast.success('Dentista atualizado com sucesso!');
      onSaved?.();
    } catch (err: any) {
      console.error('Erro inesperado ao salvar dentista:', err);
      toast.error(err?.message || 'Erro ao salvar dentista');
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
          required
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
        <Label>Número CRO</Label>
        <Input
          name="cro_number"
          value={form.cro_number}
          onChange={(e) => handleChange('cro_number', e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div>
        <Label>Especialização</Label>
        <Input
          name="specialization"
          value={form.specialization}
          onChange={(e) => handleChange('specialization', e.target.value)}
          placeholder="Ex: Ortodontia, Endodontia, etc."
          disabled={loading}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || saving}>
          {saving ? 'Salvando...' : 'Salvar Dentista'}
        </Button>
      </div>
    </form>
  );
}

export default function DentistDetailPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Editar Dentista</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">ID do dentista ausente na rota.</p>
            <div className="flex justify-end mt-4">
              <Button onClick={() => navigate('/dentists')}>Voltar</Button>
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
          <CardTitle>Editar Dentista</CardTitle>
        </CardHeader>
        <CardContent>
          <DentistForm
            dentistId={id}
            onSaved={() => navigate('/dentists')}
            onCancel={() => navigate('/dentists')}
          />
        </CardContent>
      </Card>
    </div>
  );
}