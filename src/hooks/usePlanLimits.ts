import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { toast } from 'sonner';

interface PlanLimits {
  patients: number;
  dentists: number;
  rooms: number;
  onlineBooking: boolean;
}

interface CurrentCounts {
  patients: number;
  dentists: number;
  rooms: number;
}

export function usePlanLimits() {
  const { subscription_tier, subscribed } = useSubscription();
  const [currentCounts, setCurrentCounts] = useState<CurrentCounts>({
    patients: 0,
    dentists: 0,
    rooms: 0
  });
  const [loading, setLoading] = useState(true);

  // Define limits based on plan
  const getPlanLimits = (): PlanLimits => {
    // If not subscribed or on trial, use basic limits
    if (!subscribed || !subscription_tier) {
      return {
        patients: 100,
        dentists: 2,
        rooms: 2,
        onlineBooking: false
      };
    }

    switch (subscription_tier) {
      case 'basic':
        return {
          patients: 100,
          dentists: 2,
          rooms: 2,
          onlineBooking: false
        };
      case 'premium':
        return {
          patients: 500,
          dentists: 5,
          rooms: 3,
          onlineBooking: true
        };
      case 'enterprise':
        return {
          patients: -1, // unlimited
          dentists: -1, // unlimited
          rooms: -1, // unlimited
          onlineBooking: true
        };
      default:
        return {
          patients: 100,
          dentists: 2,
          rooms: 2,
          onlineBooking: false
        };
    }
  };

  const fetchCurrentCounts = async () => {
    try {
      setLoading(true);

      // Get user's clinic
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: clinicMember } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .eq('user_id', userData.user.id)
        .single();

      if (!clinicMember) return;

      // Count patients
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicMember.clinic_id);

      // Count dentists
      const { count: dentistsCount } = await supabase
        .from('dentists')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicMember.clinic_id);

      // Count rooms from clinic settings
      const { data: roomSettings } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('clinic_id', clinicMember.clinic_id)
        .eq('setting_key', 'rooms');

      let roomsCount = 0;
      if (roomSettings && roomSettings.length > 0) {
        const rooms = roomSettings[0].setting_value as any[];
        roomsCount = rooms ? rooms.length : 0;
      }

      setCurrentCounts({
        patients: patientsCount || 0,
        dentists: dentistsCount || 0,
        rooms: roomsCount
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentCounts();
  }, []);

  const planLimits = getPlanLimits();

  const checkLimit = (type: 'patients' | 'dentists' | 'rooms'): boolean => {
    const limit = planLimits[type];
    const current = currentCounts[type];

    // -1 means unlimited
    if (limit === -1) return true;

    return current < limit;
  };

  const showLimitError = (type: 'patients' | 'dentists' | 'rooms') => {
    const limit = planLimits[type];
    const planName = subscription_tier || 'básico';
    
    toast.error(
      `Limite atingido! Seu plano ${planName} permite no máximo ${limit} ${
        type === 'patients' ? 'pacientes' :
        type === 'dentists' ? 'dentistas' : 'salas'
      }. Faça upgrade para continuar.`,
      {
        action: {
          label: 'Ver Planos',
          onClick: () => window.location.href = '/plans'
        }
      }
    );
  };

  const canAddPatient = (): boolean => {
    if (!checkLimit('patients')) {
      showLimitError('patients');
      return false;
    }
    return true;
  };

  const canAddDentist = (): boolean => {
    if (!checkLimit('dentists')) {
      showLimitError('dentists');
      return false;
    }
    return true;
  };

  const canAddRoom = (): boolean => {
    if (!checkLimit('rooms')) {
      showLimitError('rooms');
      return false;
    }
    return true;
  };

  const hasOnlineBooking = (): boolean => {
    return planLimits.onlineBooking;
  };

  return {
    planLimits,
    currentCounts,
    loading,
    canAddPatient,
    canAddDentist,
    canAddRoom,
    hasOnlineBooking,
    refreshCounts: fetchCurrentCounts,
    subscription_tier: subscription_tier || 'basic'
  };
}