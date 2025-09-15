import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WhatsappSettings from "@/pages/WhatsAppSettings";
import TreatmentTypes from "@/pages/TreatmentTypes";
import { ClinicScheduleSettings } from "@/components/ClinicScheduleSettings";
import { ClinicRoomSettings } from "@/components/ClinicRoomSettings";
import { useRequireClinic } from "@/hooks/useRequireClinic";

export default function Settings() {
  const [tab, setTab] = useState("whatsapp");
  const clinicId = useRequireClinic();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="p-6 space-y-6">
        {/* Título */}
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações da clínica</p>
        </div>

        <Card>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList>
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                <TabsTrigger value="treatments">Tipos de Consulta</TabsTrigger>
                <TabsTrigger value="schedule">Horários</TabsTrigger>
                <TabsTrigger value="rooms">Salas</TabsTrigger>
              </TabsList>

              <TabsContent value="whatsapp">
                <WhatsappSettings />
              </TabsContent>

              <TabsContent value="treatments">
                <TreatmentTypes />
              </TabsContent>

              <TabsContent value="schedule">
                <ClinicScheduleSettings />
              </TabsContent>

              <TabsContent value="rooms">
                {clinicId && <ClinicRoomSettings clinicId={clinicId} />}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
