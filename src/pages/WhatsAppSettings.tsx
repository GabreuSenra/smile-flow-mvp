import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { Switch } from "@/components/ui/switch";
import { co } from "node_modules/@fullcalendar/core/internal-common";
import { globalFunctions } from "@/lib/globalFunctions";

interface WhatsappSettingsData {
  id: string;
  clinic_id: string;
  enabled: boolean;
  phone_number: string;
  welcome_message: string | null;
  confirmation_message: string | null;
  rejection_message: string | null;
}

const WhatsappSettings = () => {
  const { user } = useAuth();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [public_code, setPublicCode] = useState<string | null>(null);
  const [settings, setSettings] = useState<WhatsappSettingsData | null>(null);
  const [loading, setLoading] = useState(false);

  // Form local
  const [form, setForm] = useState({
    enabled: false,
    confirmation_message: "",
    rejection_message: "",
  });

  // Carrega clinic_id do perfil do usuário autenticado
  useEffect(() => {
    const loadClinicId = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("clinic_members")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error(error);
        toast.error("Não foi possível identificar a clínica do usuário.");
        return;
      }

      if (!data?.clinic_id) {
        toast.error("Seu perfil não está associado a uma clínica.");
        return;
      }

      setClinicId(data.clinic_id);
    };

    loadClinicId();
  }, [user]);

  // Busca configs do WhatsApp
  useEffect(() => {
    if (clinicId) {
      fetchWhatsappConfig();
      fetchClinicCode();
    }
  }, [clinicId]);

  const fetchWhatsappConfig = async () => {
    if (!clinicId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("whatsapp_settings")
      .select("*")
      .eq("clinic_id", clinicId)
      .maybeSingle();

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar configurações do WhatsApp: " + error.message);
      return;
    }

    if (data) {
      setSettings(data);
      setForm({
        enabled: data.enabled,
        confirmation_message: data.confirmation_message || "",
        rejection_message: data.rejection_message || "",
      });
    }
  };

  const fetchClinicCode = async () => {
    if (!clinicId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("clinics")
      .select("public_code")
      .eq("id", clinicId)
      .single();

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar código público da clínica: " + error.message);
      return;
    }

    if (data && data.public_code) {
      setPublicCode(data.public_code);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) {
      toast.error("Clínica não identificada. Recarregue a página.");
      return;
    }
    if (
      !form.confirmation_message ||
      !form.rejection_message
    ) {
      toast.error("Todos os campos são obrigatórios.");
      return;
    }

    let error;
    if (settings) {
      // 🔹 Update existente
      const { error: updateError } = await supabase
        .from("whatsapp_settings")
        .update({
          enabled: form.enabled,
          confirmation_message: form.confirmation_message,
          rejection_message: form.rejection_message,
        })
        .eq("clinic_id", clinicId);

      error = updateError;
    } else {
      // 🔹 Insert novo
      const { error: insertError } = await supabase.from("whatsapp_settings").insert([
        {
          clinic_id: clinicId,
          enabled: form.enabled,
          confirmation_message: form.confirmation_message,
          rejection_message: form.rejection_message,
        },
      ]);
      error = insertError;
    }

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar configurações: " + error.message);
    } else {
      toast.success("Configurações salvas com sucesso!");
      fetchWhatsappConfig(); //Recarregar para pegar os dados atualizados
    }
  };

  const handleClipboard = (text: string) => {
    globalFunctions.copyToClipboard(text);
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integração com WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          {!clinicId ? (
            <p className="text-muted-foreground">Carregando informações da clínica...</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch checked={form.enabled} onCheckedChange={(e) => setForm({ ...form, enabled: e })} />
                <Label>Ativar agendamento feito pelo próprio cliente?</Label>
              </div>

              {form.enabled && (
                <>
                  <div>
                    <Label>Link de Agendamento Online: </Label>
                    <Input
                      value={"https://smile-flow.vercel.app/agendar-consulta/" + public_code}
                      readOnly
                    />
                  </div>

                  <div><Button type="button" onClick={() => handleClipboard("https://smile-flow.vercel.app/agendar-consulta/" + public_code)}>Copiar Link</Button></div>

                  <div>
                    <Label>Mensagem de confirmação</Label>
                    <Input
                      value={form.confirmation_message}
                      onChange={(e) => setForm({ ...form, confirmation_message: e.target.value })}
                      placeholder="Mensagem enviada ao paciente caso a consulta seja confirmada"
                    />
                  </div>

                  <div>
                    <Label>Mensagem de rejeição</Label>
                    <Input
                      value={form.rejection_message}
                      onChange={(e) => setForm({ ...form, rejection_message: e.target.value })}
                      placeholder="Mensagem enviada ao paciente caso a consulta seja rejeitada"
                    />
                  </div>

                  <Button type="submit" disabled={loading || !clinicId}>
                    {settings ? "Salvar Alterações" : "Cadastrar Configurações"}
                  </Button>
                </>)}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsappSettings;
