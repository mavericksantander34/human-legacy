# Human Legacy

Producto inicial para crear memoriales digitales con un enlace y un QR
compartible. La aplicación usa TypeScript, Next.js App Router y Supabase (Auth,
Postgres y Storage).

## Requisitos

- Node.js 20.9 o posterior
- Un proyecto Supabase

## Configuración local

1. Completa `src/lib/supabase/credentials.js` con el Project URL y la Publishable
   key desde Supabase. Como alternativa, copia `.env.example` a `.env.local` y
   configura esas mismas variables. También se acepta
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` para proyectos que aún usan la clave `anon`
   heredada; las variables de entorno tienen prioridad.
2. Ejecuta, en orden, `supabase/migrations/202610250001_initial_schema.sql` y
   `supabase/migrations/202610250002_family_lineage.sql` en el SQL Editor de
   Supabase. Si ya ejecutaste la primera, ejecuta solo la segunda. No vuelvas a
   ejecutar una migración que ya se aplicó.
3. En Supabase Auth, configura el proveedor de correo y permite la URL local
   `http://localhost:3000/auth/callback` como URL de redirección.
4. Instala dependencias con `npm install` e inicia con `npm run dev`.

La Publishable key está diseñada para ser pública y no sustituye los permisos de
la base de datos. Nunca incluyas la clave secreta `service_role` en el archivo JS,
en variables `NEXT_PUBLIC_*` ni en el navegador. La lectura y escritura están
protegidas por RLS; el bucket de archivos es privado y cada archivo requiere
autorización explícita para mostrarse en un memorial compartido.

## Arquitectura

- Next.js App Router sirve la web pública, los memoriales y el espacio privado.
- TypeScript modela los tipos del dominio y el cliente tipado de Supabase.
- Supabase Auth usa enlaces de acceso por correo; quienes visitan un QR no necesitan
  una cuenta.
- Postgres guarda memoriales y metadatos de archivos. `owner_id` y las políticas
  RLS aíslan la gestión de cada cuenta; solo memoriales `public` o `unlisted` se
  pueden leer sin ser su propietario.
- Las familias, las personas del árbol y las cuentas son entidades separadas.
  Los perfiles genealógicos no necesitan una cuenta de acceso; el árbol y sus
  relaciones solo son visibles para integrantes de esa familia.
- El propietario de una familia puede incorporar cuentas existentes como
  administradoras, colaboradoras o lectoras. Las invitaciones por correo y la
  interfaz de gestión todavía deben implementarse.
- La propiedad familiar se puede transferir manualmente a una persona que ya
  sea integrante; cada transferencia queda registrada. No hay transferencia
  automática por inactividad.
- Un memorial puede vincularse opcionalmente a una persona del árbol. La migración
  conserva intactos los memoriales existentes y no los incorpora a una familia
  automáticamente.
- Supabase Storage mantiene los archivos en un bucket privado. Solo los archivos
  marcados explícitamente como compartidos se sirven con URLs firmadas temporales.
- Se genera un QR por memorial. Ese mismo código se puede imprimir en la tumba o
  en distintos lugares relevantes; el MVP no rastrea ubicaciones.

## Reglas iniciales de privacidad

- `public`: el memorial se puede abrir y descubrir públicamente.
- `unlisted`: se puede abrir con su URL/QR, pero no aparece en la galería pública.
- `private`: solo lo puede consultar la cuenta propietaria.
- Los árboles familiares permanecen privados para sus integrantes, incluso si
  alguno de sus memoriales tiene un enlace QR compartible. El QR nunca concede
  acceso al árbol.
- Los archivos son privados al subirlos. La persona creadora debe marcar por
  separado los archivos que quiere mostrar a quienes visiten el memorial.

La retención depende de la configuración y operación de Supabase. El producto no
promete almacenamiento eterno; antes de ofrecerlo se deben definir respaldos,
costos, exportación y una política de conservación y borrado.

## Antes de un lanzamiento público

Configura el proveedor de correo y sus límites de envío, verifica URLs de
redirección para cada entorno, define términos y política de privacidad, y prueba
con dos cuentas que RLS impida leer o modificar memoriales ajenos. También hace
falta acordar el consentimiento para publicar datos de personas fallecidas,
respaldos, recuperación de cuentas, cuotas de archivos y el proceso de borrado.
