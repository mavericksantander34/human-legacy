import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QrDownload } from "@/components/qr-download";
import { SetupNotice } from "@/components/setup-notice";
import { SiteHeader } from "@/components/site-header";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CalendarDays, FileText } from "lucide-react";

type MemorialPageProps = {
  params: Promise<{ slug: string }>;
};

async function getMemorial(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memorials")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el memorial: ${error.message}`);
  if (!data) return null;

  const { data: media, error: mediaError } = await supabase
    .from("memorial_media")
    .select("*")
    .eq("memorial_id", data.id)
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  if (mediaError) throw new Error(`No se pudieron cargar los archivos: ${mediaError.message}`);
  return { memorial: data, media: media ?? [], supabase };
}

export async function generateMetadata({ params }: MemorialPageProps): Promise<Metadata> {
  if (!hasSupabaseConfig()) return { title: "Memorial" };
  const { slug } = await params;
  const result = await getMemorial(slug);
  if (!result) return { title: "Memorial no disponible" };
  const { memorial } = result;

  return {
    title: memorial.full_name,
    description: memorial.story?.slice(0, 150) ?? `Memorial de ${memorial.full_name}.`,
    robots: memorial.visibility === "public" ? undefined : { index: false, follow: false },
  };
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function MemorialPage({ params }: MemorialPageProps) {
  if (!hasSupabaseConfig()) return <SetupNotice />;
  const { slug } = await params;
  const result = await getMemorial(slug);
  if (!result) notFound();
  const { memorial, media, supabase } = result;

  const signedUrls = media.length
    ? await supabase.storage
        .from("memorial-media")
        .createSignedUrls(media.map((item) => item.storage_path), 900)
    : { data: [], error: null };
  if (signedUrls.error) {
    throw new Error(`No se pudieron abrir los archivos compartidos: ${signedUrls.error.message}`);
  }

  const mediaWithUrls = media.map((item) => ({
    ...item,
    url: signedUrls.data?.find((entry) => entry.path === item.storage_path)?.signedUrl,
  }));

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="memorial-page">
        <header className="memorial-cover">
          <p className="eyebrow">En recuerdo de</p>
          <h1 className="memorial-heading">{memorial.full_name}</h1>
          {(memorial.birth_date || memorial.death_date) && (
            <p className="memorial-dates">
              {formatDate(memorial.birth_date)}{memorial.birth_date && memorial.death_date ? " — " : ""}
              {formatDate(memorial.death_date)}
            </p>
          )}
        </header>
        <article className="memorial-body">
          {memorial.story ? (
            <section aria-label="Historia" className="memorial-story">{memorial.story}</section>
          ) : (
            <p className="field-hint">Esta historia todavía no ha sido escrita.</p>
          )}
          {mediaWithUrls.length > 0 && (
            <section aria-label="Recuerdos compartidos" className="media-grid">
              {mediaWithUrls.map((item) => (
                <div className="media-item" key={item.id}>
                  {item.url && item.mime_type.startsWith("image/") && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={item.file_name} loading="lazy" src={item.url} />
                  )}
                  {item.url && item.mime_type === "video/mp4" && (
                    <video controls preload="metadata" src={item.url}>
                      Tu navegador no puede reproducir este video.
                    </video>
                  )}
                  {item.url && item.mime_type === "application/pdf" && (
                    <a href={item.url} rel="noreferrer" target="_blank">
                      <FileText aria-hidden="true" size={17} /> {item.file_name}
                    </a>
                  )}
                </div>
              ))}
            </section>
          )}
          <div className="memorial-tools">
            {memorial.visibility === "private" ? (
              <p className="field-hint">
                Este memorial es privado y su QR no estará disponible para otras personas.
                {" "}<Link className="text-link" href={`/cuenta/${memorial.id}`}>Cambiar visibilidad</Link>
              </p>
            ) : (
              <QrDownload name={memorial.full_name} path={`/memorial/${memorial.slug}`} />
            )}
          </div>
        </article>
        <p className="trust-note" style={{ textAlign: "center" }}>
          <CalendarDays aria-hidden="true" size={13} style={{ verticalAlign: "middle" }} />{" "}
          La disponibilidad depende del servicio. Guarda también una copia local de tus archivos.
        </p>
      </main>
    </div>
  );
}
