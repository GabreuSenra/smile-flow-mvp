import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  Edit, 
  Mail, 
  Phone, 
  MapPin,
  User,
  AlertCircle,
  Stethoscope
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Patient {
  id: string;
  profile_id: string;
  cpf: string | null;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

interface Appointment {
  id: string;
  appointment_date: string;
  title: string;
  status: string;
  treatment_type: string | null;
  price: number | null;
  dentists: {
    profiles: {
      full_name: string;
    };
  };
}

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    try {
      // Fetch patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select(`
          *,
          profiles:profile_id (
            full_name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (patientError) throw patientError;
      setPatient({
        ...patientData,
        profile_id: patientData.id, // Map id to profile_id
        date_of_birth: patientData.birth_date, // Map birth_date to date_of_birth
        emergency_phone: patientData.emergency_contact || '', // Map emergency_contact to emergency_phone
        profiles: {
          full_name: patientData.full_name,
          email: patientData.email || '',
          phone: patientData.phone || ''
        }
      });

      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          treatment_type,
          price,
          notes,
          duration
        `)
        .eq('patient_id', id)
        .order('date', { ascending: false });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData?.map(appointment => ({
        ...appointment,
        appointment_date: appointment.date, // Map date to appointment_date
        title: appointment.treatment_type || 'Consulta', // Map treatment_type to title
        dentists: {
          profiles: {
            full_name: 'N/A' // Default dentist name
          }
        }
      })) || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados do paciente: ' + error.message);
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendada';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-secondary rounded w-1/3"></div>
            <div className="h-64 bg-secondary rounded"></div>
            <div className="h-48 bg-secondary rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-6 text-center">
          <p>Paciente não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/patients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{patient.profiles.full_name}</h1>
              <p className="text-muted-foreground">Detalhes do paciente</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link to={`/appointments/new?patient=${patient.id}`}>
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Nova Consulta
              </Button>
            </Link>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-medium text-xl">
                      {patient.profiles.full_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{patient.profiles.full_name}</h3>
                    {patient.date_of_birth && (
                      <Badge variant="secondary">
                        {calculateAge(patient.date_of_birth)} anos
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  {patient.profiles.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {patient.profiles.email}
                    </div>
                  )}
                  {patient.profiles.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {patient.profiles.phone}
                    </div>
                  )}
                  {patient.cpf && (
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      CPF: {patient.cpf}
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                      <span>{patient.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {(patient.emergency_contact || patient.emergency_phone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Contato de Emergência
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {patient.emergency_contact && (
                    <p className="text-sm">{patient.emergency_contact}</p>
                  )}
                  {patient.emergency_phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {patient.emergency_phone}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Medical Info */}
            {(patient.allergies || patient.medical_conditions) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2" />
                    Informações Médicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {patient.allergies && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Alergias</h4>
                      <p className="text-sm text-muted-foreground">{patient.allergies}</p>
                    </div>
                  )}
                  {patient.medical_conditions && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Condições Médicas</h4>
                      <p className="text-sm text-muted-foreground">{patient.medical_conditions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Appointments History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Consultas</CardTitle>
                <CardDescription>
                  Consultas realizadas e agendadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Nenhuma consulta encontrada.</p>
                    <Link to={`/appointments/new?patient=${patient.id}`}>
                      <Button className="mt-4">
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar Primeira Consulta
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(appointment.status)}`}></div>
                          <div>
                            <h4 className="font-medium">{appointment.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(appointment.appointment_date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {appointment.treatment_type && (
                              <p className="text-sm text-muted-foreground">
                                {appointment.treatment_type}
                              </p>
                            )}
                            {appointment.dentists?.profiles && (
                              <p className="text-sm text-muted-foreground">
                                Dr. {appointment.dentists.profiles.full_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {getStatusText(appointment.status)}
                          </Badge>
                          {appointment.price && (
                            <p className="text-sm font-medium mt-1">
                              R$ {appointment.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;