import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, Eye, Calendar, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Patient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  address: string | null;
  emergency_contact: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  clinic_id: string;
  created_at: string;
}

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
  try {
    // 🔹 1. Obter sessão do usuário
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      toast.error('Sessão inválida, faça login novamente.');
      return;
    }

    // 🔹 2. Obter clinic_id do usuário
    const { data: membership, error: memberError } = await supabase
      .from('clinic_members')
      .select('clinic_id')
      .eq('user_id', session.user.id)
      .single();

    if (memberError || !membership) {
      toast.error('Não foi possível encontrar a clínica associada a este usuário.');
      return;
    }

    // 🔹 3. Buscar apenas pacientes dessa clínica
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', membership.clinic_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setPatients(data || []);
  } catch (error: any) {
    toast.error('Erro ao carregar pacientes: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (patient.email && patient.email.toLowerCase().includes(search.toLowerCase())) ||
    (patient.cpf && patient.cpf.includes(search))
  );

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

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
            <h1 className="text-3xl font-bold">Pacientes</h1>
            <p className="text-muted-foreground">
              Gerencie o cadastro de pacientes da clínica
            </p>
          </div>
          <Link to="/patients/new">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Paciente
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {filteredPatients.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  {search ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado ainda.'}
                </p>
                {!search && (
                  <Link to="/patients/new">
                    <Button className="mt-4">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastrar Primeiro Paciente
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.id} className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium text-lg">
                          {patient.full_name.charAt(0)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{patient.full_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {patient.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {patient.email}
                            </div>
                          )}
                          {patient.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {patient.phone}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {patient.birth_date && (
                            <Badge variant="secondary">
                              {calculateAge(patient.birth_date)} anos
                            </Badge>
                          )}
                          {patient.cpf && (
                            <Badge variant="outline">
                              CPF: {patient.cpf}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link to={`/appointments/new?patient=${patient.id}`}>
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar
                        </Button>
                      </Link>
                      <Link to={`/patients/${patient.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
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
    </div>
  );
};

export default Patients;
