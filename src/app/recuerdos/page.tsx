import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Recuerdos compartidos",
  description: "Historias compartidas públicamente en Human Legacy.",
};

export default async function MemoriesPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memorials")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) throw new Error(`No se pudieron cargar los recuerdos: ${error.message}`);
  const memorials = data ?? [];

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="dashboard">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Historias compartidas</p>
            <h1>Recuerdos públicos</h1>
            <p>Estos memoriales fueron marcados como públicos por quien los creó.</p>
          </div>
        </div>
        {memorials.length === 0 ? (
          <section className="empty-state">
            <h2>Aún no hay historias públicas.</h2>
            <p>Los memoriales no aparecen aquí a menos que su creador elija hacerlos públicos.</p>
          </section>
        ) : (
          <div className="memorial-list">
            {memorials.map((memorial) => (
              <article className="memorial-row" key={memorial.id}>
                <div>
                  <h2>{memorial.full_name}</h2>
                  <p>{memorial.story?.slice(0, 160) || "Una historia compartida por su familia."}</p>
                </div>
                <Link className="text-link" href={`/memorial/${memorial.slug}`}>
                  Leer historia <ArrowRight aria-hidden="true" size={15} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
