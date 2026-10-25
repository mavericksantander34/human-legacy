import Link from "next/link";
import { Leaf } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link aria-label="Human Legacy, inicio" className="brand" href="/">
        <span className="brand-mark">
          <Leaf aria-hidden="true" size={17} strokeWidth={1.7} />
        </span>
        <span>HUMAN LEGACY</span>
      </Link>
      <nav aria-label="Navegación principal" className="nav-links">
        <Link href="/#como-funciona">Cómo funciona</Link>
        <Link href="/recuerdos">Recuerdos</Link>
        <Link className="button-link" href="/acceso">
          Mi espacio
        </Link>
      </nav>
    </header>
  );
}
