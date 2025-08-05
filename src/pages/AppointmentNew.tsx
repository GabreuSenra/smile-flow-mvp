import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Patient {
  id: string;
  profiles: {
    full_name: string;
  };
}

interface Dentist {
  id: string;
  profiles: {
    full_name: string;
  };
}

const AppointmentNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get('patient');
  
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [formData, setFormData] = useState({
    patient_id: preselectedPatient || '',
    dentist_id: '',
    title: '',
    description: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 60,
    treatment_type: '',
    price: '',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchPatientsAndDentists();
  }, []);

  const fetchPatientsAndDentists = async () => {
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select(`
          id,
          profiles:profile_id (
            full_name
          )
        `)
        .order('profiles(full_name)');

      if (patientsError) throw patientsError;
      setPatients(patientsData || []);

      // Fetch dentists
      const { data: dentistsData, error: dentistsError } = await supabase
        .from('dentists')
        .select(`
          id,
          profiles:profile_id (
            full_name
          )
        `)
        .order('profiles(full_name)');

      if (dentistsError) throw dentistsError;
      setDentists(dentistsData || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}:00`).toISOString();

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: formData.patient_id,
          dentist_id: formData.dentist_id,
          title: formData.title,
          description: formData.description || null,
          appointment_date: appointmentDateTime,
          duration_minutes: formData.duration_minutes,
          treatment_type: formData.treatment_type || null,
          price: formData.price ? parseFloat(formData.price) : null,
          status: formData.status
        });

      if (error) throw error;

      toast.success('Consulta agendada com sucesso!');
      navigate('/appointments');
    } catch (error: any) {
      toast.error('Erro ao agendar consulta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/appointments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nova Consulta</h1>
            <p className="text-muted-foreground">
              Agende uma nova consulta para um paciente
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Dados da Consulta</CardTitle>
            <CardDescription>
              Preencha as informações da consulta para agendamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient and Dentist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_id">Paciente *</Label>
                  <Select value={formData.patient_id} onValueChange={(value) => handleSelectChange('patient_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.profiles.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dentist_id">Dentista *</Label>
                  <Select value={formData.dentist_id} onValueChange={(value) => handleSelectChange('dentist_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dentista" />
                    </SelectTrigger>
                    <SelectContent>
                      {dentists.map((dentist) => (
                        <SelectItem key={dentist.id} value={dentist.id}>
                          Dr. {dentist.profiles.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title and Treatment Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Consulta *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ex: Consulta de rotina"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="treatment_type">Tipo de Tratamento</Label>
                  <Select value={formData.treatment_type} onValueChange={(value) => handleSelectChange('treatment_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulta">Consulta</SelectItem>
                      <SelectItem value="limpeza">Limpeza</SelectItem>
                      <SelectItem value="restauracao">Restauração</SelectItem>
                      <SelectItem value="extracao">Extração</SelectItem>
                      <SelectItem value="canal">Canal</SelectItem>
                      <SelectItem value="protese">Prótese</SelectItem>
                      <SelectItem value="ortodontia">Ortodontia</SelectItem>
                      <SelectItem value="implante">Implante</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointment_date">Data *</Label>
                  <Input
                    id="appointment_date"
                    name="appointment_date"
                    type="date"
                    value={formData.appointment_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment_time">Horário *</Label>
                  <Input
                    id="appointment_time"
                    name="appointment_time"
                    type="time"
                    value={formData.appointment_time}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duração (min)</Label>
                  <Select value={formData.duration_minutes.toString()} onValueChange={(value) => handleSelectChange('duration_minutes', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Duração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h 30min</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Valor (R$)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Agendada</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Observações</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Observações sobre a consulta..."
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/appointments')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Agendando...' : 'Agendar Consulta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentNew;