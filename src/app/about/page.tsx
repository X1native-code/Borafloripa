"use client";

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Photo } from '@/components/Photo';
import { WhatsAppFab } from '@/components/WhatsAppFab';

export default function AboutPage() {
  return (
    <div className="page" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Header />
      
      <section className="wrap-wide" style={{ paddingTop: 60, paddingBottom: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Bora nosotros</div>
        <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 96px)", margin: 0, lineHeight: 0.95, maxWidth: 900 }}>
          Nacimos en la isla.<br/>
          <span style={{ color: "var(--coral)" }}>Vivimos en la isla.</span><br/>
          <span style={{ fontStyle: "italic", fontWeight: 500, color: "var(--ink-soft)" }}>Te la mostramos como amigos.</span>
        </h1>
        <p style={{ marginTop: 24, fontSize: 19, lineHeight: 1.55, color: "var(--ink-soft)", maxWidth: 720 }}>
          Bora Floripa empezó en 2023, cuando Tiago — guía con 12 años en la isla — se cansó de ver a turistas hispanohablantes confundidos en agencias que no hablan su idioma ni les explican bien qué tour es para ellos.
        </p>
      </section>

      <section className="wrap-wide" style={{ paddingBottom: 40 }}>
        <Photo variant="turq" label="foto del equipo en praia da galheta — 8 personas riendo" glyph="" ratio="21/9" rounded="lg"/>
      </section>

      <section className="wrap-wide" style={{ paddingBottom: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }} className="about-grid">
          <div>
            <h2 className="display" style={{ fontSize: 36, margin: 0 }}>Lo que nos hace distintos</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              { n: "01", title: "Todos somos locales", desc: "Nacidos y criados acá. Conocemos las playas que cambian con la marea, los restaurantes que cierran los lunes, y al señor que vende las mejores tapioca." },
              { n: "02", title: "Solo Floripa, en serio", desc: "Ninguna otra ciudad. Especialistas, no de todo. Si querés Iguazú, te recomendamos a alguien — no fingimos que sabemos." },
              { n: "03", title: "Tu idioma, sin choque", desc: "El equipo es 100% español-bilingüe. Sabemos las diferencias entre 'remera' y 'polera', y por qué eso importa." },
              { n: "04", title: "Tecnología bien hecha", desc: "Reservás en 30 segundos, pagás con Pix, recibís todo por WhatsApp. Sin formularios eternos, sin emails que se pierden." },
            ].map(x => (
              <div key={x.n} style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 16 }}>
                <div style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--coral)",
                  fontSize: 16,
                  fontWeight: 700,
                  paddingTop: 4
                }}>
                  {x.n} —
                </div>
                <div>
                  <h3 className="display" style={{ fontSize: 22, margin: "0 0 6px" }}>{x.title}</h3>
                  <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.5 }}>{x.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFab />
    </div>
  );
}
