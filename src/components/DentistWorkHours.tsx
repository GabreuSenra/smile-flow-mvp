import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkHours {
  start: string;
  end: string;
  enabled: boolean;
}

interface WorkSchedule {
  monday: WorkHours;
  tuesday: WorkHours;
  wednesday: WorkHours;
  thursday: WorkHours;
  friday: WorkHours;
  saturday: WorkHours;
  sunday: WorkHours;
}

const defaultWorkHours: WorkHours = {
  start: '08:00',
  end: '18:00',
  enabled: true
};

const defaultSchedule: WorkSchedule = {
  monday: { ...defaultWorkHours },
  tuesday: { ...defaultWorkHours },
  wednesday: { ...defaultWorkHours },
  thursday: { ...defaultWorkHours },
  friday: { ...defaultWorkHours },
  saturday: { start: '08:00', end: '12:00', enabled: false },
  sunday: { start: '08:00', end: '12:00', enabled: false }
};

const dayNames = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

interface DentistWorkHoursProps {
  dentistId: string;
  currentWorkHours?: any;
  onSaved?: () => void;
}

export function DentistWorkHours({ dentistId, currentWorkHours, onSaved }: DentistWorkHoursProps) {
  const [schedule, setSchedule] = useState<WorkSchedule>(defaultSchedule);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentWorkHours) {
      // Convert current work hours to our format
      const convertedSchedule: WorkSchedule = { ...defaultSchedule };
      
      Object.keys(defaultSchedule).forEach(day => {
        if (currentWorkHours[day]) {
          convertedSchedule[day as keyof WorkSchedule] = {
            start: currentWorkHours[day].start || '08:00',
            end: currentWorkHours[day].end || '18:00',
            enabled: currentWorkHours[day].enabled !== false
          };
        }
      });
      
      setSchedule(convertedSchedule);
    }
  }, [currentWorkHours]);

  const handleDayChange = (day: keyof WorkSchedule, field: keyof WorkHours, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert to the format expected by the database
      const workHoursData: any = {};
      
      Object.entries(schedule).forEach(([day, hours]) => {
        if (hours.enabled) {
          workHoursData[day] = {
            start: hours.start,
            end: hours.end
          };
        }
      });

      const { error } = await supabase
        .from('dentists')
        .update({ work_hours: workHoursData })
        .eq('id', dentistId);

      if (error) throw error;

      toast.success('Horários de trabalho atualizados com sucesso!');
      onSaved?.();
    } catch (error: any) {
      toast.error('Erro ao salvar horários: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horários de Trabalho</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(schedule).map(([day, hours]) => (
          <div key={day} className="flex items-center space-x-4 p-3 border rounded-lg">
            <div className="flex-1">
              <Label className="font-medium">{dayNames[day as keyof typeof dayNames]}</Label>
            </div>
            
            <Switch
              checked={hours.enabled}
              onCheckedChange={(checked) => handleDayChange(day as keyof WorkSchedule, 'enabled', checked)}
            />
            
            {hours.enabled && (
              <>
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Início:</Label>
                  <Input
                    type="time"
                    value={hours.start}
                    onChange={(e) => handleDayChange(day as keyof WorkSchedule, 'start', e.target.value)}
                    className="w-24"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Fim:</Label>
                  <Input
                    type="time"
                    value={hours.end}
                    onChange={(e) => handleDayChange(day as keyof WorkSchedule, 'end', e.target.value)}
                    className="w-24"
                  />
                </div>
              </>
            )}
          </div>
        ))}
        
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Horários'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}