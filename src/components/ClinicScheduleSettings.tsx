import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';

interface ScheduleSettings {
  blockedDays: number[]; // 0=Sunday, 1=Monday, etc.
  blockedTimeRanges: { start: string; end: string }[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

export const ClinicScheduleSettings = () => {
  const [settings, setSettings] = useState<ScheduleSettings>({
    blockedDays: [0, 6], // Sunday and Saturday by default
    blockedTimeRanges: [
      { start: '00:00', end: '08:00' },
      { start: '18:00', end: '23:59' }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: clinicMember } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .single();

      if (!clinicMember) return;

      const { data, error } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('clinic_id', clinicMember.clinic_id)
        .eq('setting_key', 'schedule_blocks')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.setting_value) {
        const parsedSettings = data.setting_value as any;
        if (parsedSettings && typeof parsedSettings === 'object' && 
            Array.isArray(parsedSettings.blockedDays) && 
            Array.isArray(parsedSettings.blockedTimeRanges)) {
          setSettings(parsedSettings as ScheduleSettings);
        }
      }
    } catch (error: any) {
      toast.error('Erro ao carregar configurações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: clinicMember } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .single();

      if (!clinicMember) throw new Error('Clínica não encontrada');

      const { error } = await supabase
        .from('clinic_settings')
        .upsert({
          clinic_id: clinicMember.clinic_id,
          setting_key: 'schedule_blocks',
          setting_value: settings as any
        }, {
          onConflict: 'clinic_id,setting_key'
        });

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar configurações: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDayToggle = (dayValue: number) => {
    setSettings(prev => ({
      ...prev,
      blockedDays: prev.blockedDays.includes(dayValue)
        ? prev.blockedDays.filter(d => d !== dayValue)
        : [...prev.blockedDays, dayValue]
    }));
  };

  const handleTimeRangeChange = (index: number, field: 'start' | 'end', value: string) => {
    setSettings(prev => ({
      ...prev,
      blockedTimeRanges: prev.blockedTimeRanges.map((range, i) =>
        i === index ? { ...range, [field]: value } : range
      )
    }));
  };

  const addTimeRange = () => {
    setSettings(prev => ({
      ...prev,
      blockedTimeRanges: [...prev.blockedTimeRanges, { start: '12:00', end: '13:00' }]
    }));
  };

  const removeTimeRange = (index: number) => {
    setSettings(prev => ({
      ...prev,
      blockedTimeRanges: prev.blockedTimeRanges.filter((_, i) => i !== index)
    }));
  };

  if (loading) return <div className="text-center">Carregando configurações...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Configurações de Horário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dias bloqueados */}
        <div>
          <Label className="text-base font-medium mb-3 block">Dias Bloqueados</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Selecione os dias da semana em que não haverá atendimento
          </p>
          <div className="grid grid-cols-2 gap-3">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={settings.blockedDays.includes(day.value)}
                  onCheckedChange={() => handleDayToggle(day.value)}
                />
                <Label htmlFor={`day-${day.value}`} className="text-sm">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Horários bloqueados */}
        <div>
          <Label className="text-base font-medium mb-3 block">Horários Bloqueados</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Configure faixas de horário em que não haverá atendimento
          </p>
          <div className="space-y-3">
            {settings.blockedTimeRanges.map((range, index) => (
              <div key={index} className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={range.start}
                  onChange={(e) => handleTimeRangeChange(index, 'start', e.target.value)}
                  className="w-24"
                />
                <span className="text-muted-foreground">até</span>
                <Input
                  type="time"
                  value={range.end}
                  onChange={(e) => handleTimeRangeChange(index, 'end', e.target.value)}
                  className="w-24"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeTimeRange(index)}
                  disabled={settings.blockedTimeRanges.length === 1}
                >
                  Remover
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addTimeRange}
            >
              Adicionar Horário
            </Button>
          </div>
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
};