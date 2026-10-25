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
          <p className="eyebrow">Acceso a tu espacio</p>
          <h1>Inicia sesión o crea tu cuenta</h1>
          <p>
            Ingresa tu correo y te enviaremos un enlace seguro para entrar.
            Si es tu primera vez, el enlace también te permitirá crear tu cuenta.
          </p>
          {params.error && (
            <p className="form-error" role="alert">
              El enlace venció o no es válido. Solicita uno nuevo.
            </p>
          )}
          <AccessForm nextPath={nextPath} />
          <p className="field-hint" style={{ marginTop: 22 }}>
            No necesitas una contraseña. <Link className="text-link" href="/">Conoce el proyecto</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
