import Link from "next/link";
import { ArrowDown, ArrowRight, BookHeart, MapPin, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

const features = [
  {
    icon: BookHeart,
    title: "Una historia, a su manera",
    copy: "Guarda palabras, fotografías, videos y documentos que ayuden a contar quién fue.",
  },
  {
    icon: MapPin,
    title: "En los lugares que importan",
    copy: "Comparte el memorial con un QR en una tumba, un hogar o cualquier lugar significativo.",
  },
  {
    icon: ShieldCheck,
    title: "Tú decides quién lo ve",
    copy: "Elige si el memorial es privado, se comparte con un enlace o queda abierto al público.",
  },
];

export default function Home() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section aria-labelledby="hero-title" className="hero">
          <div>
            <p className="eyebrow">Historias que nos unen</p>
            <h1 id="hero-title">Una vida no cabe en una <em>fecha.</em></h1>
            <p className="hero-copy">
              Crea un espacio para recordar a alguien como era: con sus historias,
              sus fotografías y los lugares que siguen hablando de esa persona.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/acceso?next=/crear">
                Crear un memorial <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <a className="text-link" href="#como-funciona">
                Conocer más <ArrowDown aria-hidden="true" size={15} />
              </a>
            </div>
            <p className="trust-note">No prometemos almacenamiento eterno: primero definiremos límites, respaldos y opciones de conservación.</p>
          </div>
          <div aria-hidden="true" className="hero-art">
            <div className="art-orbit">
              <div className="art-sun" />
              <div className="art-arch" />
              <div className="art-note">
                <span>Human Legacy</span>
                <strong>Una vida compartida, muchas formas de recordarla.</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="intro-section" id="como-funciona">
          <p className="eyebrow">Un lugar para volver</p>
          <h2 className="section-heading">El recuerdo también vive en los lugares.</h2>
          <p className="intro-copy">
            Un código QR puede acercar una historia a quienes visitan una tumba
            o vuelven a un sitio importante. El memorial se abre desde el teléfono,
            sin instalar una aplicación.
          </p>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, copy }) => (
              <article className="feature-card" key={title}>
                <div className="feature-icon"><Icon aria-hidden="true" size={18} /></div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="steps-section">
          <p className="eyebrow">Cómo funciona</p>
          <h2 className="section-heading">De una historia personal a un recuerdo compartido.</h2>
          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">1</span>
              <h3>Crea el espacio</h3>
              <p>Escribe una historia y agrega fechas o recuerdos cuando quieras.</p>
            </article>
            <article className="step-card">
              <span className="step-number">2</span>
              <h3>Elige qué compartir</h3>
              <p>Define la visibilidad del memorial y de cada archivo que agregues.</p>
            </article>
            <article className="step-card">
              <span className="step-number">3</span>
              <h3>Comparte el QR</h3>
              <p>Descárgalo para ponerlo en un lugar importante o enviarlo a la familia.</p>
            </article>
          </div>
        </section>

        <section className="privacy-band" id="cuidado">
          <div>
            <h2>La confianza también es parte del recuerdo.</h2>
            <p>
              Los archivos empiezan privados. Tú decides qué se muestra. No
              prometemos almacenamiento eterno. Antes de ofrecer planes de
              conservación, definiremos límites, respaldos y opciones de exportación.
            </p>
          </div>
          <Link className="text-link" href="/acceso?next=/crear">
            Comenzar <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </section>
      </main>
      <footer className="site-footer">
        <Link className="brand" href="/">
          <span className="brand-mark"><BookHeart aria-hidden="true" size={16} /></span>
          <span>HUMAN LEGACY</span>
        </Link>
        <span>Un proyecto para cuidar y compartir historias humanas.</span>
      </footer>
    </div>
  );
}
