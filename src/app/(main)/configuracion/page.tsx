import LogoutButton from "@/components/LogoutButton";
import PageHeader from "@/components/PageHeader";
import SettingsToggles from "./_components/SettingsToggles";

export default function ConfiguracionPage() {
  return (
    <div className="fz-page space-y-6">
      <PageHeader title="Configuración" />
      <div className="fz-card p-1 overflow-hidden">
        <SettingsToggles />
      </div>
      <div className="text-center pt-2">
        <LogoutButton variant="block" />
      </div>
    </div>
  );
}
