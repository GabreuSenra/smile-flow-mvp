import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SetupClinic() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
  });

  // Gerar código único para novas clínicas
  async function generateUniquePublicCode() {
    let code;
    let exists = true;

    while (exists) {
      code = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
      const { data } = await supabase
        .from("clinics")
        .select("id")
        .eq("public_code", code)
        .maybeSingle();

      exists = !!data;
    }

    return code;
  }

  // 🔹 Buscar clínica existente ao carregar
  useEffect(() => {
    const fetchClinic = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Sessão inválida. Faça login novamente.");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("clinics")
        .select("id, name, phone, address, email")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar clínica:", error);
        return;
      }

      if (data) {
        setEditing(true);
        setClinicId(data.id);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
          email: data.email || "",
        });
      }
    };

    fetchClinic();
  }, [navigate]);

  // 🔹 Handle change nos inputs
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // 🔹 Criar clínica nova
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Sessão inválida. Faça login novamente.");
        navigate("/auth");
        return;
      }

      const public_code = await generateUniquePublicCode();

      const { data: clinic, error: clinicError } = await supabase
        .from("clinics")
        .insert([
          {
            owner_id: session.user.id,
            ...formData,
            public_code,
          },
        ])
        .select()
        .single();

      if (clinicError) throw clinicError;

      // vincular usuário como membro
      await supabase.from("clinic_members").insert([
        {
          clinic_id: clinic.id,
          user_id: session.user.id,
          role: "owner",
        },
      ]);

      toast.success("Clínica criada com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro ao criar clínica:", error);
      toast.error(error.message || "Erro ao criar clínica");
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Editar clínica existente
  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const public_code = await generateUniquePublicCode();

    try {
      if (!clinicId) return;

      const { error } = await supabase
        .from("clinics")
        .update(formData)
        .eq("id", clinicId);

      if (error) throw error;

      toast.success("Clínica atualizada com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro ao atualizar clínica:", error);
      toast.error(error.message || "Erro ao atualizar clínica");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            {editing ? "Editar Clínica" : "Configurar Clínica"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={editing ? handleEdit : handleCreate}
            className="space-y-4"
          >
            <div>
              <Label>Nome da clínica</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? "Salvando..."
                : editing
                ? "Atualizar"
                : "Salvar e continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
