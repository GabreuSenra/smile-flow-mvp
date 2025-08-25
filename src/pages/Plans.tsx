import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Building2, Users, Calendar, FileText, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  trial_active: boolean;
  trial_end: string | null;
}

const Plans = () => {
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  const plans = [
    {
      id: 'basic',
      name: 'Básico',
      price: 'R$ 49',
      period: '/mês',
      priceId: 'price_basic_monthly', // Substitua pelo Price ID real do Stripe
      description: 'Ideal para clínicas pequenas',
      icon: Building2,
      features: [
        'Até 100 pacientes',
        'Agenda básica',
        '2 dentistas',
        'Relatórios simples',
        'Suporte por email'
      ],
      color: 'bg-blue-500'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'R$ 99',
      period: '/mês',
      priceId: 'price_premium_monthly', // Substitua pelo Price ID real do Stripe
      description: 'Perfeito para clínicas em crescimento',
      icon: Crown,
      features: [
        'Até 500 pacientes',
        'Agenda avançada',
        '5 dentistas',
        'Relatórios completos',
        'Lembretes automáticos',
        'Integração WhatsApp',
        'Suporte prioritário'
      ],
      color: 'bg-purple-500',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'R$ 150',
      period: '/mês',
      priceId: 'price_enterprise_monthly', // Substitua pelo Price ID real do Stripe
      description: 'Para clínicas grandes e redes',
      icon: Zap,
      features: [
        'Pacientes ilimitados',
        'Múltiplas clínicas',
        'Dentistas ilimitados',
        'Analytics avançados',
        'API personalizada',
        'Backup automático',
        'Suporte 24/7',
        'Gerente dedicado'
      ],
      color: 'bg-gradient-to-r from-orange-500 to-red-500'
    }
  ];

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Plano não encontrado');

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.priceId, planName: plan.name }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      toast.error('Erro ao criar checkout: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      // Open Stripe customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      toast.error('Erro ao abrir portal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlan = () => {
    if (!subscriptionStatus) return null;
    
    if (subscriptionStatus.trial_active) {
      return 'trial';
    }
    
    if (subscriptionStatus.subscribed && subscriptionStatus.subscription_tier) {
      return subscriptionStatus.subscription_tier;
    }
    
    return null;
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Escolha seu Plano</h1>
          <p className="text-xl text-muted-foreground">
            Selecione o plano ideal para sua clínica odontológica
          </p>
          
          {subscriptionStatus?.trial_active && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="font-semibold text-blue-800">Período de Avaliação</h3>
              <p className="text-sm text-blue-600">
                Sua avaliação gratuita expira em{' '}
                {subscriptionStatus.trial_end && 
                  new Date(subscriptionStatus.trial_end).toLocaleDateString('pt-BR')
                }
              </p>
            </div>
          )}
          
          {subscriptionStatus?.subscribed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="font-semibold text-green-800">Plano Ativo</h3>
              <p className="text-sm text-green-600">
                Você está no plano {subscriptionStatus.subscription_tier?.toUpperCase()}
                {subscriptionStatus.subscription_end && (
                  <> • Próxima cobrança: {new Date(subscriptionStatus.subscription_end).toLocaleDateString('pt-BR')}</>
                )}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleManageSubscription}
                disabled={loading}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Gerenciar Assinatura
              </Button>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;
            const isTrialActive = currentPlan === 'trial';
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} 
                ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Mais Popular</Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary">Plano Atual</Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <div className={`w-12 h-12 rounded-full ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : "default"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading || isCurrentPlan}
                  >
                    {loading ? 'Processando...' : 
                     isCurrentPlan ? 'Plano Atual' :
                     isTrialActive ? 'Assinar Agora' : 'Escolher Plano'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Comparação de Recursos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Recursos</th>
                      <th className="text-center p-2">Básico</th>
                      <th className="text-center p-2">Premium</th>
                      <th className="text-center p-2">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2">Pacientes</td>
                      <td className="text-center p-2">Até 100</td>
                      <td className="text-center p-2">Até 500</td>
                      <td className="text-center p-2">Ilimitados</td>
                    </tr>
                    <tr>
                      <td className="p-2">Dentistas</td>
                      <td className="text-center p-2">2</td>
                      <td className="text-center p-2">5</td>
                      <td className="text-center p-2">Ilimitados</td>
                    </tr>
                    <tr>
                      <td className="p-2">Lembretes Automáticos</td>
                      <td className="text-center p-2">-</td>
                      <td className="text-center p-2">✓</td>
                      <td className="text-center p-2">✓</td>
                    </tr>
                    <tr>
                      <td className="p-2">Múltiplas Clínicas</td>
                      <td className="text-center p-2">-</td>
                      <td className="text-center p-2">-</td>
                      <td className="text-center p-2">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Plans;