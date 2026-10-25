import { redirect } from "next/navigation";
import { MemorialForm } from "@/components/memorial-form";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function CreateMemorialPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso?next=/crear");

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="form-page">
        <section className="form-card">
          <p className="eyebrow">Un recuerdo que continúa</p>
          <h1>Crear un memorial</h1>
          <p>
            Empieza con lo que quieras compartir. Podrás editar el memorial,
            controlar su visibilidad y descargar su QR.
          </p>
          <MemorialForm />
        </section>
      </main>
    </div>
  );
}
