import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';

export function useRequireClinic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clinicId, setClinicId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data, error } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar clínica:', error);
        return;
      }

      if (!data?.clinic_id) {
        navigate('/setup-clinic');
      } else {
        setClinicId(data.clinic_id);
      }
    })();
  }, [user, navigate]);

  return clinicId;
}
