import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';

interface OnlineBookingCheckProps {
  children: React.ReactNode;
}

interface ClinicSubscription {
  subscription_plan: string | null;
  subscription_active: boolean | null;
}

export function OnlineBookingCheck({ children }: OnlineBookingCheckProps) {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [subscription, setSubscription] = useState<ClinicSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, [clinicId]);

  const checkSubscription = async () => {
    if (!clinicId) {
      setError(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('subscription_plan, subscription_active')
        .eq('id', clinicId)
        .single();

      if (error) {
        console.error('Error fetching clinic subscription:', error);
        setError(true);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const hasOnlineBooking = () => {
    if (!subscription) return false;
    
    const plan = subscription.subscription_plan || 'basic';
    const isActive = subscription.subscription_active !== false;
    
    return isActive && (plan === 'premium' || plan === 'enterprise');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-secondary rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-secondary rounded w-1/2 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Erro</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Não foi possível carregar as informações da clínica.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasOnlineBooking()) {
    const planName = subscription?.subscription_plan || 'basic';
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Agendamento Online Não Disponível</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Esta clínica está no plano <span className="capitalize font-medium">{planName}</span>, 
              que não inclui agendamento online.
            </p>
            
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium">Disponível nos planos:</span>
              </div>
              <div className="text-sm space-y-1">
                <div>✓ Premium - A partir de R$ 99/mês</div>
                <div>✓ Enterprise - A partir de R$ 150/mês</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Entre em contato diretamente com a clínica para agendar sua consulta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}