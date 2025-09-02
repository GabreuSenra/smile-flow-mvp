import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setStatus('error');
        setMessage('Sessão de pagamento não encontrada');
        return;
      }

      // Chama a edge function para verificar o pagamento
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });

      if (error) throw error;

      if (data.success) {
        setStatus('success');
        setMessage(`Pagamento confirmado! Plano ${data.planName} ativado com sucesso.`);
        toast.success('Assinatura ativada com sucesso!');
      } else {
        setStatus('error');
        setMessage('Não foi possível confirmar o pagamento');
      }
    } catch (error: any) {
      console.error('Erro ao verificar pagamento:', error);
      setStatus('error');
      setMessage('Erro ao verificar o pagamento');
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="p-6 flex items-center justify-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {status === 'loading' && (
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-16 w-16 text-green-500" />
              )}
              {status === 'error' && (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Verificando Pagamento...'}
              {status === 'success' && 'Pagamento Confirmado!'}
              {status === 'error' && 'Erro no Pagamento'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{message}</p>
            
            {status !== 'loading' && (
              <Button onClick={handleContinue} className="w-full">
                {status === 'success' ? 'Ir para Dashboard' : 'Voltar'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;