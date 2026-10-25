import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { AccessForm } from "@/components/access-form";
import { SetupNotice } from "@/components/setup-notice";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { safeInternalPath } from "@/lib/safe-internal-path";

type AccessPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function AccessPage({ searchParams }: AccessPageProps) {
  if (!hasSupabaseConfig()) return <SetupNotice />;

  const params = await searchParams;
  const nextPath = safeInternalPath(params.next);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="form-page">
        <section className="form-card">
          <p className="eyebrow">Tu espacio</p>
          <h1>Entra a Human Legacy</h1>
          <p>
            Usa tu correo para recibir un enlace seguro. Desde tu cuenta podrás
            crear y administrar memoriales.
          </p>
          {params.error && (
            <p className="form-error" role="alert">
              El enlace venció o no es válido. Solicita uno nuevo.
            </p>
          )}
          <AccessForm nextPath={nextPath} />
          <p className="field-hint" style={{ marginTop: 22 }}>
            Usaremos tu correo para enviarte el enlace de acceso. <Link className="text-link" href="/">Conoce el proyecto</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
