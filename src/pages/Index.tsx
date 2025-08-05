import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Stethoscope, 
  Calendar, 
  Users, 
  Shield, 
  BarChart3, 
  MessageSquare,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  // If user is logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: Users,
      title: 'Gestão de Pacientes',
      description: 'Cadastro completo com histórico médico e documentos'
    },
    {
      icon: Calendar,
      title: 'Agenda Inteligente',
      description: 'Calendário visual com lembretes automáticos'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Dados protegidos com criptografia e backup automático'
    },
    {
      icon: BarChart3,
      title: 'Relatórios Detalhados',
      description: 'Análises financeiras e operacionais em tempo real'
    },
    {
      icon: MessageSquare,
      title: 'Comunicação',
      description: 'Notificações e lembretes para pacientes'
    },
    {
      icon: Stethoscope,
      title: 'Prontuário Digital',
      description: 'Registros médicos organizados e acessíveis'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="p-4 bg-white rounded-full shadow-elevated">
                <Stethoscope className="h-16 w-16 text-primary" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              SmileFlow
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              O sistema completo para gestão de clínicas odontológicas. 
              Simplifique sua rotina e foque no que realmente importa: seus pacientes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-elevated"
                onClick={() => window.location.href = '/auth'}
              >
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 hover:text-white"
              >
                Ver Demonstração
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Funcionalidades pensadas especificamente para clínicas odontológicas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card hover:shadow-elevated transition-all">
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-lg w-fit">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-secondary">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Por que escolher o SmileFlow?
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                {[
                  'Interface intuitiva e fácil de usar',
                  'Dados seguros na nuvem',
                  'Suporte técnico especializado',
                  'Atualizações automáticas',
                  'Relatórios personalizados',
                  'Integração com WhatsApp'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-accent flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>

              <Card className="shadow-elevated">
                <CardHeader>
                  <CardTitle className="text-2xl">Comece sua avaliação gratuita</CardTitle>
                  <CardDescription>
                    Teste todas as funcionalidades por 30 dias, sem compromisso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">30 dias</div>
                    <div className="text-muted-foreground">Completamente grátis</div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => window.location.href = '/auth'}
                  >
                    Criar Conta Gratuita
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    Não é necessário cartão de crédito
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-card border-t">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Stethoscope className="h-8 w-8 text-primary mr-2" />
            <span className="text-2xl font-bold">SmileFlow</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 SmileFlow. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
