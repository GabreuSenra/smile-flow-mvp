import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TimeSlot {
  time: string;
  available: boolean;
  dentistId?: string;
}

interface DentistAvailability {
  dentistId: string;
  dentistName: string;
  availableSlots: TimeSlot[];
}

interface UseDentistAvailabilityProps {
  date: string;
  clinicId: string;
  selectedDentistId?: string;
  duration?: number;
}

export function useDentistAvailability({ 
  date, 
  clinicId, 
  selectedDentistId, 
  duration = 60 
}: UseDentistAvailabilityProps) {
  const [availability, setAvailability] = useState<DentistAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (date && clinicId) {
      checkAvailability();
    }
  }, [date, clinicId, selectedDentistId, duration]);

  const checkAvailability = async () => {
    setLoading(true);
    try {
      // Get dentists and their work hours
      const { data: dentists, error: dentistsError } = await supabase
        .from('dentists')
        .select(`
          id,
          work_hours,
          dentist_profiles!inner(full_name)
        `)
        .eq('clinic_id', clinicId)
        .eq(selectedDentistId ? 'id' : 'clinic_id', selectedDentistId || clinicId);

      if (dentistsError) throw dentistsError;

      // Get existing appointments for the date
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('dentist_id, date, time, duration')
        .eq('clinic_id', clinicId)
        .eq('date', date)
        .not('dentist_id', 'is', null);

      if (appointmentsError) throw appointmentsError;

      // Get clinic schedule settings
      const { data: clinicSettings, error: settingsError } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('clinic_id', clinicId)
        .eq('setting_key', 'schedule')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.warn('Erro ao carregar configurações da clínica:', settingsError);
      }

      const clinicSchedule = clinicSettings?.setting_value || {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '08:00', end: '12:00' },
        sunday: { start: '08:00', end: '12:00' }
      };

      // Generate availability for each dentist
      const dayOfWeek = getDayOfWeek(date);
      const availabilityData: DentistAvailability[] = [];

      for (const dentist of dentists || []) {
        const dentistWorkHours = dentist.work_hours || {};
        const daySchedule = dentistWorkHours[dayOfWeek];
        const clinicDaySchedule = clinicSchedule[dayOfWeek];

        if (!daySchedule || !clinicDaySchedule) {
          // Dentist or clinic doesn't work on this day
          availabilityData.push({
            dentistId: dentist.id,
            dentistName: dentist.dentist_profiles?.full_name || 'Dentista',
            availableSlots: []
          });
          continue;
        }

        // Use the most restrictive schedule (latest start, earliest end)
        const startTime = getLatestTime(daySchedule.start, clinicDaySchedule.start);
        const endTime = getEarliestTime(daySchedule.end, clinicDaySchedule.end);

        if (startTime >= endTime) {
          // No valid working hours
          availabilityData.push({
            dentistId: dentist.id,
            dentistName: dentist.dentist_profiles?.full_name || 'Dentista',
            availableSlots: []
          });
          continue;
        }

        // Generate time slots
        const slots = generateTimeSlots(startTime, endTime, 30); // 30-minute intervals
        const dentistAppointments = appointments?.filter(apt => apt.dentist_id === dentist.id) || [];

        const availableSlots = slots.map(slot => {
          const slotStart = timeToMinutes(slot);
          const slotEnd = slotStart + duration;

          // Check if this slot conflicts with any existing appointment
          const hasConflict = dentistAppointments.some(appointment => {
            const appointmentStart = timeToMinutes(appointment.time);
            const appointmentEnd = appointmentStart + (appointment.duration || 60);

            // Check for overlap
            return (slotStart < appointmentEnd && slotEnd > appointmentStart);
          });

          return {
            time: slot,
            available: !hasConflict,
            dentistId: dentist.id
          };
        });

        availabilityData.push({
          dentistId: dentist.id,
          dentistName: dentist.dentist_profiles?.full_name || 'Dentista',
          availableSlots
        });
      }

      setAvailability(availabilityData);
    } catch (error: any) {
      toast.error('Erro ao verificar disponibilidade: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return { availability, loading, refetch: checkAvailability };
}

// Helper functions
function getDayOfWeek(date: string): string {
  const dayIndex = new Date(date).getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayIndex];
}

function getLatestTime(time1: string, time2: string): string {
  return timeToMinutes(time1) > timeToMinutes(time2) ? time1 : time2;
}

function getEarliestTime(time1: string, time2: string): string {
  return timeToMinutes(time1) < timeToMinutes(time2) ? time1 : time2;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number): string[] {
  const slots: string[] = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current < end) {
    slots.push(minutesToTime(current));
    current += intervalMinutes;
  }

  return slots;
}