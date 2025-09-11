import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UserPlus, Search, Eye, Edit, Stethoscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Dentist {
  id: string;
  cro_number: string;
  specialization: string | null;
  work_hours: any;
  clinic_id: string;
  profile_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

const Dentists = () => {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);

  useEffect(() => {
    fetchDentists();
  }, []);

  const fetchDentists = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('Sessão inválida, faça login novamente.');
        return;
      }

      const { data: membership, error: memberError } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .eq('user_id', session.user.id)
        .single();

      if (memberError || !membership) {
        toast.error('Não foi possível encontrar a clínica associada a este usuário.');
        return;
      }

      const { data, error } = await supabase
        .from('dentists')
        .select(`
          *,
          profiles:profile_id (
            full_name,
            email,
            phone
          )
        `)
        .eq('clinic_id', membership.clinic_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDentists(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dentistas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDentists = dentists.filter(dentist =>
    dentist.profiles?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    dentist.cro_number.toLowerCase().includes(search.toLowerCase()) ||
    (dentist.specialization && dentist.specialization.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-secondary rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dentistas</h1>
            <p className="text-muted-foreground">
              Gerencie o cadastro de dentistas da clínica
            </p>
          </div>
          <Link to="/dentists/new">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Dentista
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CRO ou especialização..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Dentists List */}
        <div className="space-y-4">
          {filteredDentists.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  {search ? 'Nenhum dentista encontrado.' : 'Nenhum dentista cadastrado ainda.'}
                </p>
                {!search && (
                  <Link to="/dentists/new">
                    <Button className="mt-4">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar Primeiro Dentista
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredDentists.map((dentist) => (
              <Card key={dentist.id} className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{dentist.profiles?.full_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {dentist.profiles?.email && (
                            <div className="flex items-center">
                              {dentist.profiles.email}
                            </div>
                          )}
                          {dentist.profiles?.phone && (
                            <div className="flex items-center">
                              {dentist.profiles.phone}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            CRO: {dentist.cro_number}
                          </Badge>
                          {dentist.specialization && (
                            <Badge variant="outline">
                              {dentist.specialization}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDentist(dentist);
                          setDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Link to={`/dentists/${dentist.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Dialog de detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedDentist && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do dentista</DialogTitle>
                <DialogDescription>
                  Informações completas sobre {selectedDentist.profiles?.full_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                {/* Nome */}
                <h2 className="text-lg font-semibold">{selectedDentist.profiles?.full_name}</h2>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    CRO: {selectedDentist.cro_number}
                  </Badge>
                  {selectedDentist.specialization && (
                    <Badge variant="outline">
                      {selectedDentist.specialization}
                    </Badge>
                  )}
                </div>

                {/* Email */}
                {selectedDentist.profiles?.email && (
                  <div className="text-sm">
                    <span className="font-medium">Email:</span> {selectedDentist.profiles.email}
                  </div>
                )}

                {/* Telefone */}
                {selectedDentist.profiles?.phone && (
                  <div className="text-sm">
                    <span className="font-medium">Telefone:</span> {selectedDentist.profiles.phone}
                  </div>
                )}

                {/* Horários de trabalho */}
                {selectedDentist.work_hours && (
                  <div className="text-sm">
                    <span className="font-medium">Horários de trabalho:</span>
                    <div className="mt-1 text-xs">
                      {Object.entries(selectedDentist.work_hours).map(([day, hours]: [string, any]) => (
                        <div key={day}>
                          {day}: {hours.start} - {hours.end}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dentists;