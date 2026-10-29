import Link from "next/link";
import AssetForm from "./_components/AssetForm";

export default function BienesNuevoPage() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/bienes" className="text-fz-text-tertiary hover:text-fz-text text-lg">
          ←
        </Link>
        <h1 className="text-xl font-semibold text-fz-text">Nuevo bien</h1>
      </div>
      <AssetForm />
    </div>
  );
}
