import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export function SetupNotice() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="form-page">
        <section className="form-card">
          <p className="eyebrow">Configuración inicial</p>
          <h1>Conecta tu espacio</h1>
          <p>
            Esta función usa una base de datos real. Para continuar, configura
            Supabase siguiendo los pasos del README y vuelve a cargar la página.
          </p>
          <Link className="button" href="/">Volver al inicio</Link>
        </section>
      </main>
    </div>
  );
}
