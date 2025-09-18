import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { usePlanLimits } from '@/hooks/usePlanLimits';

interface RoomSettings {
  total_rooms: number;
  room_names: string[];
}

interface ClinicRoomSettingsProps {
  clinicId: string;
}

export function ClinicRoomSettings({ clinicId }: ClinicRoomSettingsProps) {
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({
    total_rooms: 2,
    room_names: ['Consultório 1', 'Consultório 2']
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { canAddRoom, planLimits, refreshCounts } = usePlanLimits();

  useEffect(() => {
    loadRoomSettings();
  }, [clinicId]);

  const loadRoomSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('clinic_id', clinicId)
        .eq('setting_key', 'rooms')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        setRoomSettings(data.setting_value as unknown as RoomSettings);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar configurações das salas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveRoomSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({
          clinic_id: clinicId,
          setting_key: 'rooms',
          setting_value: roomSettings as any
        }, {
          onConflict: 'clinic_id,setting_key'
        });

      if (error) throw error;

      toast.success('Configurações das salas salvas com sucesso!');
      refreshCounts(); // Update counts after successful save
    } catch (error: any) {
      toast.error('Erro ao salvar configurações das salas: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addRoom = () => {
    // Check plan limits before adding room
    if (!canAddRoom()) {
      return;
    }

    const newRoomNumber = roomSettings.room_names.length + 1;
    setRoomSettings({
      total_rooms: roomSettings.total_rooms + 1,
      room_names: [...roomSettings.room_names, `Consultório ${newRoomNumber}`]
    });
  };

  const removeRoom = (index: number) => {
    if (roomSettings.room_names.length <= 1) {
      toast.error('A clínica deve ter pelo menos uma sala');
      return;
    }

    const newRoomNames = roomSettings.room_names.filter((_, i) => i !== index);
    setRoomSettings({
      total_rooms: newRoomNames.length,
      room_names: newRoomNames
    });
  };

  const updateRoomName = (index: number, newName: string) => {
    const newRoomNames = [...roomSettings.room_names];
    newRoomNames[index] = newName;
    setRoomSettings({
      ...roomSettings,
      room_names: newRoomNames
    });
  };

  if (loading) {
    return <div>Carregando configurações das salas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Salas/Consultórios</CardTitle>
        <CardDescription>
          Gerencie o número de salas disponíveis para consultas simultâneas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">
            Total de Salas: {roomSettings.total_rooms}
          </Badge>
          <Badge variant="secondary">
            Limite do Plano: {planLimits.rooms === -1 ? 'Ilimitado' : planLimits.rooms}
          </Badge>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium">Salas Disponíveis</Label>
          
          {roomSettings.room_names.map((roomName, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={roomName}
                onChange={(e) => updateRoomName(index, e.target.value)}
                placeholder={`Nome da sala ${index + 1}`}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeRoom(index)}
                disabled={roomSettings.room_names.length <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addRoom}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Sala
          </Button>
        </div>

        <Button 
          onClick={saveRoomSettings} 
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
}