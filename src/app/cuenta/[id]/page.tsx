import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MemorialForm } from "@/components/memorial-form";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ManagePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
};

export default async function ManageMemorialPage({
  params,
  searchParams,
}: ManagePageProps) {
  if (!hasSupabaseConfig()) return <SetupNotice />;

  const { id } = await params;
  const { guardado } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/acceso?next=/cuenta/${id}`);

  const { data, error } = await supabase
    .from("memorials")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el memorial: ${error.message}`);
  if (!data) notFound();

  const { data: mediaData, error: mediaError } = await supabase
    .from("memorial_media")
    .select("*")
    .eq("memorial_id", data.id)
    .order("created_at", { ascending: true });
  if (mediaError) throw new Error(`No se pudieron cargar los archivos: ${mediaError.message}`);

  const memorial = data;
  const media = mediaData ?? [];

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="form-page">
        <section className="form-card">
          <p className="eyebrow">Administrar memorial</p>
          <h1>{memorial.full_name}</h1>
          <p>
            Cambia la historia y la visibilidad, agrega archivos o vuelve a compartir el enlace.
          </p>
          {guardado && <p className="form-success" role="status">Los cambios se guardaron.</p>}
          <p><Link className="text-link" href={`/memorial/${memorial.slug}`}>Abrir el memorial</Link></p>
          <MemorialForm initial={memorial} existingMedia={media} />
        </section>
      </main>
    </div>
  );
}
