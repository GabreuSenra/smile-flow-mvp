import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";

interface Treatment {
  id: string;
  name: string;
  description: string | null;
  price: number;
  clinic_id?: string;
}

const TreatmentTypes = () => {
  const { user } = useAuth();
  const [clinicId, setClinicId] = useState<string | null>(null);

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "" });
  const [editing, setEditing] = useState<string | null>(null);

  // Carrega clinic_id do perfil do usuário autenticado
  useEffect(() => {
    const loadClinicId = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!user?.id) return;
      const { data, error } = await supabase
        .from('clinic_members')
        .select('clinic_id')
        .eq('user_id', session.user.id)
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

  useEffect(() => {
    if (clinicId) fetchTreatments();
  }, [clinicId]);

  const fetchTreatments = async () => {
    if (!clinicId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("treatment_types")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("name", { ascending: true });

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar tipos de consulta");
    } else {
      setTreatments(data || []);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) {
      toast.error("Clínica não identificada. Recarregue a página.");
      return;
    }
    if (!form.name || !form.price) {
      toast.error("Nome e preço são obrigatórios");
      return;
    }

    const priceNumber = Number(form.price);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      toast.error("Informe um preço válido");
      return;
    }

    if (editing) {
      // Update
      const { error } = await supabase
        .from("treatment_types")
        .update({
          name: form.name,
          description: form.description || null,
          price: priceNumber,
        })
        .eq("id", editing)
        .eq("clinic_id", clinicId); // segurança extra p/ RLS

      if (error) {
        console.error(error);
        toast.error("Erro ao atualizar");
      } else {
        toast.success("Consulta atualizada");
        setEditing(null);
        setForm({ name: "", description: "", price: "" });
        fetchTreatments();
      }
    } else {
      // Insert (agora com clinic_id)
      const { error } = await supabase.from("treatment_types").insert([
        {
          clinic_id: clinicId,
          name: form.name,
          description: form.description || null,
          price: priceNumber,
        },
      ]);

      if (error) {
        console.error(error);
        toast.error("Erro ao cadastrar: " + error.message);
      } else {
        toast.success("Consulta cadastrada");
        setForm({ name: "", description: "", price: "" });
        fetchTreatments();
      }
    }
  };

  const handleEdit = (t: Treatment) => {
    setEditing(t.id);
    setForm({
      name: t.name,
      description: t.description || "",
      price: String(t.price),
    });
  };

  const handleDelete = async (id: string) => {
    if (!clinicId) return;
    if (!confirm("Deseja realmente excluir este tipo de consulta?")) return;

    const { error } = await supabase
      .from("treatment_types")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinicId);

    if (error) {
      console.error(error);
      toast.error("Erro ao excluir");
    } else {
      toast.success("Excluído com sucesso");
      fetchTreatments();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Consulta</CardTitle>
        </CardHeader>
        <CardContent>
          {!clinicId ? (
            <p className="text-muted-foreground">
              Carregando informações da clínica...
            </p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Preço</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={!clinicId}>
                {editing ? "Salvar Alterações" : "Adicionar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Lista de tratamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Consultas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : treatments.length === 0 ? (
            <p>Nenhum tipo de consulta cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {treatments.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.description || "—"}
                    </p>
                    <p className="text-sm">
                      R$ {Number(t.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={() => handleEdit(t)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(t.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TreatmentTypes;
