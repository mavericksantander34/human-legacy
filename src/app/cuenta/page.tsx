import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { SetupNotice } from "@/components/setup-notice";
import { SignOutButton } from "@/components/sign-out-button";
import { SiteHeader } from "@/components/site-header";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const visibilityLabel = {
  public: "Público",
  unlisted: "Con enlace o QR",
  private: "Privado",
};

export default async function AccountPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/acceso?next=/cuenta");

  const { data, error } = await supabase
    .from("memorials")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudieron cargar tus memoriales: ${error.message}`);
  const memorials = data ?? [];

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="dashboard">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Tu espacio</p>
            <h1>Hola, {user.email?.split("@")[0] ?? "bienvenida/o"}.</h1>
            <p>Administra tus memoriales y decide cómo compartirlos.</p>
          </div>
          <Link className="button" href="/crear">
            <Plus aria-hidden="true" size={16} /> Crear memorial
          </Link>
        </div>

        {memorials.length === 0 ? (
          <section className="empty-state">
            <h2>Tus historias empiezan aquí.</h2>
            <p>Cuando crees un memorial, podrás volver a editarlo desde este espacio.</p>
            <Link className="button" href="/crear">Crear mi primer memorial</Link>
          </section>
        ) : (
          <div className="memorial-list">
            {memorials.map((memorial) => (
              <article className="memorial-row" key={memorial.id}>
                <div>
                  <h2>{memorial.full_name}</h2>
                  <p>
                    {memorial.birth_date || "Fecha no indicada"}
                    {memorial.death_date ? ` — ${memorial.death_date}` : ""}
                  </p>
                </div>
                <div className="row-actions">
                  <span className="visibility-badge">{visibilityLabel[memorial.visibility]}</span>
                  <Link aria-label={`Administrar memorial de ${memorial.full_name}`} className="text-link" href={`/cuenta/${memorial.id}`}>
                    Administrar <ArrowRight aria-hidden="true" size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
        <div style={{ marginTop: 28 }}><SignOutButton /></div>
      </main>
    </div>
  );
}
