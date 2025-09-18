import { useAuth } from '@/components/auth/AuthProvider';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  Calendar, 
  Users, 
  Shield, 
  BarChart3, 
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Crown,
  Building2,
  Zap,
  Star,
  Globe,
  Clock
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
      icon: Globe,
      title: 'Agendamento Online',
      description: 'Link para pacientes agendarem consultas online'
    }
  ];

  const plans = [
    {
      name: 'Básico',
      price: 'R$ 49',
      period: '/mês',
      description: 'Ideal para clínicas pequenas',
      icon: Building2,
      features: [
        'Até 100 pacientes',
        'Máximo 2 dentistas',
        'Máximo 2 salas/consultórios',
        'Agenda básica',
        'Relatórios simples',
        'Suporte por email'
      ],
      popular: false,
      color: 'border-primary/20'
    },
    {
      name: 'Premium',
      price: 'R$ 99',
      period: '/mês',
      description: 'Perfeito para clínicas em crescimento',
      icon: Crown,
      features: [
        'Até 500 pacientes',
        'Máximo 5 dentistas',
        'Máximo 3 salas/consultórios',
        '✨ Link de agendamento online',
        'Agenda avançada',
        'Relatórios completos',
        'Lembretes automáticos',
        'Integração WhatsApp',
        'Suporte por email'
      ],
      popular: true,
      color: 'border-primary ring-2 ring-primary/20'
    },
    {
      name: 'Enterprise',
      price: 'R$ 150',
      period: '/mês',
      description: 'Para clínicas grandes e redes',
      icon: Zap,
      features: [
        'Pacientes ilimitados',
        'Dentistas ilimitados',
        'Salas/consultórios ilimitados',
        '✨ Link de agendamento online',
        'Múltiplas clínicas',
        'Analytics avançados',
        'API personalizada',
        'Backup automático',
        'Suporte prioritário',
        'Requisição de funcionalidades'
      ],
      popular: false,
      color: 'border-accent/20'
    }
  ];

  const testimonials = [
    {
      name: "Dr. Ana Silva",
      role: "Ortodontista",
      clinic: "Clínica Sorriso Perfeito",
      content: "O SmileFlow transformou nossa rotina. Economizamos 3 horas por dia só na gestão de agenda.",
      rating: 5
    },
    {
      name: "Dr. Carlos Mendes",
      role: "Implantodontista", 
      clinic: "Dental Excellence",
      content: "Relatórios claros e precisos. Agora tenho total controle do faturamento da clínica.",
      rating: 5
    },
    {
      name: "Dra. Marina Costa",
      role: "Dentista Geral",
      clinic: "Consultório Vida Dental",
      content: "Interface muito intuitiva. Minha equipe aprendeu a usar em poucos dias.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative">
          <div className="container mx-auto px-6 py-24 lg:py-32">
            <div className="text-center">
              <div className="flex items-center justify-center mb-8 animate-float">
                <div className="p-6 bg-white/10 backdrop-blur-sm rounded-full shadow-elevated">
                  <Stethoscope className="h-20 w-20 text-white" />
                </div>
              </div>
              
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 animate-fade-in">
                SmileFlow
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto animate-fade-in-up">
                O sistema completo para gestão de clínicas odontológicas. 
                Simplifique sua rotina e foque no que realmente importa: seus pacientes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 shadow-elevated text-lg px-8 py-4 h-auto"
                  onClick={() => window.location.href = '/auth'}
                >
                  <Clock className="mr-2 h-5 w-5" />
                  Teste 30 Dias Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm text-lg px-8 py-4 h-auto"
                  onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Ver Planos
                </Button>
              </div>

              <div className="mt-12 flex items-center justify-center gap-8 text-white/70">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>Cancele quando quiser</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>Suporte em português</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 animate-fade-in-up">
            <Badge variant="outline" className="mb-4 text-lg px-4 py-2">
              Funcionalidades
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Funcionalidades pensadas especificamente para clínicas odontológicas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-2 animate-scale-in border-0 bg-gradient-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-4">
                  <div className="p-4 bg-primary/10 rounded-xl w-fit mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div id="plans" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 animate-fade-in-up">
            <Badge variant="outline" className="mb-4 text-lg px-4 py-2">
              Planos e Preços
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Escolha o plano ideal para sua clínica
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comece com 30 dias grátis e experimente todas as funcionalidades
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon;
              
              return (
                <Card 
                  key={index} 
                  className={`relative shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-2 ${plan.color} animate-scale-in`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-6">
                    <div className={`w-16 h-16 rounded-xl ${plan.popular ? 'bg-primary' : 'bg-primary/10'} flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`h-8 w-8 ${plan.popular ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-base mb-4">{plan.description}</CardDescription>
                    <div className="text-4xl font-bold">
                      {plan.price}
                      <span className="text-lg font-normal text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary-hover' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                      onClick={() => window.location.href = '/auth'}
                    >
                      Começar Teste Grátis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      30 dias grátis • Sem cartão de crédito
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20 animate-fade-in-up">
            <Badge variant="outline" className="mb-4 text-lg px-4 py-2">
              Depoimentos
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Clínicas que já transformaram sua gestão
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className="shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <CardDescription className="text-base leading-relaxed italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.clinic}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-primary">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pronto para transformar sua clínica?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Junte-se a centenas de clínicas que já otimizaram sua gestão com o SmileFlow
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-elevated text-lg px-8 py-4 h-auto"
                onClick={() => window.location.href = '/auth'}
              >
                <Clock className="mr-2 h-5 w-5" />
                Começar Teste Gratuito
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <p className="text-white/70 mt-6">
              30 dias grátis • Não é necessário cartão de crédito
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-16 bg-card border-t">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-primary mr-3" />
              <span className="text-2xl font-bold">SmileFlow</span>
            </div>
            
            <p className="text-muted-foreground max-w-2xl">
              Transformando a gestão de clínicas odontológicas com tecnologia moderna e intuitiva.
            </p>
            
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <span>© 2024 SmileFlow</span>
              <span>•</span>
              <span>Todos os direitos reservados</span>
              <span>•</span>
              <span>Feito com ❤️ no Brasil</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;