"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { getTours } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Stars } from '@/components/Stars';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { Photo } from '@/components/Photo';
import { ShareRow } from '@/components/ShareRow';
import { TourCard } from '@/components/TourCard';
import { WhatsAppFab } from '@/components/WhatsAppFab';

const ITINERARY = [
  { time: "08:30", duration: "Recogida en hotel", title: "Te buscamos donde estés", desc: "Combi con aire, agua de cortesía y guía bilingüe esperándote en la puerta del hotel. Avisamos por WhatsApp 15 min antes." },
  { time: "09:15", duration: "1 h 30", title: "Centro histórico + Mercado Público", desc: "Caminata por el casco viejo de Florianópolis. Probamos pastel de camarón en el mercado y un café en el Box 32." },
  { time: "11:00", duration: "2 h", title: "Lagoa da Conceição y Mirador", desc: "Subida al Morro da Lagoa. La vista que sale en las postales — pero sin la cola del bus turístico." },
  { time: "13:30", duration: "Almuerzo opcional", title: "Pausa para comer (a tu ritmo)", desc: "Te dejamos en Costa da Lagoa o en Ribeirão da Ilha según el clima. Te sugerimos lugares, vos elegís." },
  { time: "16:00", duration: "1 h 30", title: "Playa de Joaquina", desc: "Tabla de sandboard incluida si te animás. Si no, te recostás y mirás cómo los locales bajan las dunas." },
  { time: "18:00", duration: "Atardecer", title: "Bonus: sunset y vuelta al hotel", desc: "Cerramos con un mirador para ver el sol bajar atrás del continente. Te dejamos de vuelta en tu hotel ~19:30." },
];

const INCLUDES = [
  "Recogida y regreso al hotel en zonas centro / Lagoa / Norte",
  "Guía local bilingüe (ES · PT · EN)",
  "Vehículo con aire acondicionado",
  "Agua y snack tropical",
  "Sandboard en Joaquina (opcional)",
  "Seguro de viajero incluido",
];

const NOT_INCLUDES = [
  "Almuerzo (sugerimos R$ 60–120 por persona)",
  "Bebidas alcohólicas",
  "Propinas (a discreción)",
  "Lo que te quieras llevar de souvenir",
];

export default function TourDetailPage() {
  const { tweaks } = useTheme();
  const router = useRouter();
  const { id } = useParams();

  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const toursData = await getTours();
        setTours(toursData);
      } catch (e) {
        console.error("Error al cargar tours:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const tour = tours.find(t => t.id === id);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: 'var(--cream)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Bora cargando detalles...</h2>
      </div>
    );
  }

  // Fallback to first tour if not found
  const activeTour = tour || tours[0];

  if (!activeTour) {
    return (
      <div style={{ padding: 48, textAlign: 'center', background: 'var(--cream)', minHeight: '100vh' }}>
        <h2>Tour no encontrado</h2>
        <Link href="/search" className="btn btn-coral" style={{ marginTop: 16 }}>Volver a todos los tours</Link>
      </div>
    );
  }

  const related = tours.filter(t => t.id !== activeTour.id && t.cat === activeTour.cat).slice(0, 4);
  const fallbackList = tours.filter(t => t.id !== activeTour.id).slice(0, 4);
  const moreLike = related.length >= 3 ? related : fallbackList;

  return (
    <div className="page" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Header />

      {/* Breadcrumb */}
      <div className="wrap-wide" style={{ paddingTop: 20, paddingBottom: 8, fontSize: 13, color: "var(--muted)" }}>
        <Link href="/">Inicio</Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <Link href="/search">Tours</Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <span>{activeTour.title}</span>
      </div>

      {/* Title block */}
      <header className="wrap-wide" style={{ paddingTop: 12, paddingBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {activeTour.badge && <Badge tone={activeTour.badge === "Más vendido" ? "coral" : "ink"}>{activeTour.badge}</Badge>}
          <Badge tone="soft">{activeTour.cat}</Badge>
          {activeTour.tags.slice(0,2).map((tg: string) => <Badge key={tg} tone="soft">{tg}</Badge>)}
        </div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 5.5vw, 64px)", margin: 0, lineHeight: 1 }}>{activeTour.title}</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 18, marginTop: 14, marginBottom: 18, maxWidth: 760 }}>{activeTour.subtitle}</p>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center", color: "var(--ink-soft)", fontSize: 14 }}>
          <Stars rating={activeTour.rating} reviews={activeTour.reviews}/>
          <span>·</span>
          <span><Icon name="pin" size={14}/> {activeTour.location}</span>
          <span>·</span>
          <span><Icon name="clock" size={14}/> {activeTour.duration}</span>
          <span style={{ marginLeft: "auto" }}>
            <ShareRow size="sm" emphasis="loud" title=""/>
          </span>
        </div>
      </header>

      {/* Gallery mosaic */}
      <section className="wrap-wide">
        <div className="gallery-grid" style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gridTemplateRows: "240px 240px",
          gap: 8,
          borderRadius: 24,
          overflow: "hidden",
        }}>
          <Photo variant={activeTour.photoVariant} glyph={activeTour.glyph} label={activeTour.photoLabel} rounded="none" style={{ gridRow: "1 / 3", aspectRatio: "auto", height: "100%" }}/>
          <Photo variant="coral" label="foto 2 — detalle" rounded="none" style={{ aspectRatio: "auto", height: "100%" }} glyph="📸"/>
          <Photo variant="sun" label="foto 3 — grupo" rounded="none" style={{ aspectRatio: "auto", height: "100%", position: "relative" }} glyph="👫">
            <button style={{ position: "absolute", top: 10, right: 10, padding: "8px 12px", borderRadius: 999, background: "rgba(14,27,44,0.85)", color: "#fff", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, zIndex: 3 }}>
              <Icon name="play" size={12}/> Ver video
            </button>
          </Photo>
          <Photo variant="moss" label="foto 4 — paisaje" rounded="none" style={{ aspectRatio: "auto", height: "100%" }} glyph="🏞️"/>
          <Photo variant="sky" label="foto 5 — almuerzo" rounded="none" style={{ aspectRatio: "auto", height: "100%", position: "relative" }} glyph="🍤">
            <button style={{ position: "absolute", bottom: 10, right: 10, padding: "8px 12px", borderRadius: 999, background: "rgba(255,255,255,0.95)", fontSize: 12, fontWeight: 600 }}>
              + 18 fotos
            </button>
          </Photo>
        </div>
      </section>

      {/* Main content + sticky booking */}
      <section className="wrap-wide" style={{ paddingTop: 40 }}>
        <div className="tour-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 48, alignItems: "start" }}>
          <div>
            {/* Quick facts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 32, padding: 18, background: "var(--paper)", borderRadius: 18, boxShadow: "var(--shadow-sm)" }}>
              <Fact icon="clock" label="Duración" value={activeTour.duration}/>
              <Fact icon="globe" label="Idiomas" value="ES · PT · EN"/>
              <Fact icon="users" label="Grupo" value="Hasta 14"/>
              <Fact icon="shield" label="Cancelación" value="Gratis 24h"/>
            </div>

            {/* About */}
            <SectionH eyebrow="La experiencia">Bora vivirlo</SectionH>
            <div style={{ fontSize: 17, lineHeight: 1.65, color: "var(--ink-soft)", whiteSpace: "pre-line", marginBottom: 28 }}>
              {activeTour.description || "Una jornada pensada para quienes quieren conocer la Florianópolis de verdad..."}
            </div>

            {/* Itinerary */}
            <SectionH eyebrow="Itinerario">Tu día, paso a paso</SectionH>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 32 }}>
              {(activeTour.itinerary || ITINERARY).map((step: any, i: number) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 16, paddingBottom: 20 }}>
                  <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 999,
                      background: i === 0 ? "var(--coral)" : "var(--paper)",
                      color: i === 0 ? "#fff" : "var(--ink)",
                      boxShadow: i === 0 ? "none" : "inset 0 0 0 1px var(--line)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13,
                      flexShrink: 0,
                    }}>{i+1}</div>
                    {i < (activeTour.itinerary || ITINERARY).length - 1 && <div style={{ width: 2, flex: 1, background: "var(--line)", marginTop: 6 }}/>}
                  </div>
                  <div style={{ paddingTop: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--coral)", fontWeight: 600 }}>{step.time}</span>
                      {step.duration && <span style={{ fontSize: 12, color: "var(--muted)" }}>· {step.duration}</span>}
                    </div>
                    <h4 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700 }}>{step.title}</h4>
                    <p style={{ margin: "6px 0 0", color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.5 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Include / not include */}
            <SectionH eyebrow="Qué incluye">Lo que va y lo que no</SectionH>
            <div className="include-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "var(--moss)", color: "#fff", width: 22, height: 22, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={12} stroke={3}/></span>
                  Incluye
                </div>
                {(activeTour.includes || INCLUDES).map((x: string) => (
                  <div key={x} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px dashed var(--line)", fontSize: 14 }}>
                    <Icon name="check" size={14} style={{ color: "var(--moss)", marginTop: 4 }} stroke={2.5}/>
                    {x}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "var(--ink)", color: "#fff", width: 22, height: 22, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={12} stroke={3}/></span>
                  No incluye
                </div>
                {(activeTour.excludes || NOT_INCLUDES).map((x: string) => (
                  <div key={x} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px dashed var(--line)", fontSize: 14, color: "var(--ink-soft)" }}>
                    <Icon name="close" size={14} style={{ color: "var(--muted)", marginTop: 4 }} stroke={2.5}/>
                    {x}
                  </div>
                ))}
              </div>
            </div>

            {/* Important info */}
            <SectionH eyebrow="Importante">Antes de que digas Bora</SectionH>
            <div style={{ background: "var(--cream-soft)", border: "1px solid var(--line)", borderRadius: 16, padding: 22, marginBottom: 32 }}>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, color: "var(--ink-soft)", fontSize: 15 }}>
                {(activeTour.importantInfo || [
                  "Recogida desde tu hotel en zona Centro / Lagoa / Norte de la isla. Otras zonas, R$ 40 extra.",
                  "Llevá traje de baño, toalla, protector solar y zapatillas cómodas.",
                  "Si llueve fuerte, cambiamos a un plan B equivalente o reembolsamos 100%.",
                  "Apto desde 6 años. Embarazadas, escribinos antes."
                ]).map((info: string, i: number) => (
                  <li key={i}>{info}</li>
                ))}
              </ul>
            </div>

            {/* Reviews */}
            <SectionH eyebrow={`${activeTour.reviews.toLocaleString("es")} reseñas`}>Lo que dicen quienes ya fueron</SectionH>
            <div style={{ display: "flex", gap: 32, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 64, lineHeight: 1, fontWeight: 700 }}>{activeTour.rating.toFixed(2)}</div>
                <Stars rating={activeTour.rating} size={16}/>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{activeTour.reviews.toLocaleString("es")} reseñas verificadas</div>
              </div>
              <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 4 }}>
                {[5,4,3,2,1].map(s => {
                  const pct = s===5?92 : s===4?6 : s===3?1 : s===2?0.5 : 0.5;
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      <span style={{ width: 16 }}>{s}★</span>
                      <div style={{ flex: 1, height: 6, background: "var(--line-soft)", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--coral)" }}/>
                      </div>
                      <span style={{ width: 32, color: "var(--muted)", textAlign: "right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="reviews-grid">
              {[
                { name: "Mariana C.", country: "🇦🇷 Buenos Aires", rating: 5, date: "Hace 3 días", text: "El viaje fue mágico. El guía nos llevó a rincones que no figuran en ningún folleto. Volvería mañana mismo." },
                { name: "Diego F.", country: "🇨🇱 Santiago", rating: 5, date: "Hace 1 semana", text: "Reservé 2 horas antes y la atención fue insuperable. Guías muy atentos y vehículo sumamente impecable." }
              ].map((r, i) => (
                <div key={i} className="card" style={{ padding: 20, cursor: "default" }}>
                  <Stars rating={r.rating} size={13}/>
                  <p style={{ margin: "10px 0 12px", fontSize: 14, lineHeight: 1.55 }}>"{r.text}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--muted)" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--cream-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--ink)" }}>{r.name[0]}</div>
                    <div><strong style={{ color: "var(--ink)" }}>{r.name}</strong> · {r.country} · {r.date}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-lg" style={{ marginTop: 16 }}>Ver las {activeTour.reviews.toLocaleString("es")} reseñas <Icon name="arrow-right" size={14}/></button>

            {/* Share block */}
            <div style={{ marginTop: 48, padding: 24, background: "var(--paper)", borderRadius: 20, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <h3 className="display" style={{ fontSize: 24, margin: 0 }}>Bora con la banda?</h3>
                  <p style={{ margin: "6px 0 0", color: "var(--ink-soft)", fontSize: 14 }}>Mandá el tour por WhatsApp y reservalo de a varios. Cada 4 personas, 5% off automático.</p>
                </div>
                <ShareRow emphasis="loud" title="" size="md"/>
              </div>
            </div>
          </div>

          {/* Sticky booking card */}
          <aside className="tour-sticky tour-booking-aside">
            <BookingCard tour={activeTour} router={router} />
          </aside>
        </div>
      </section>

      {/* Related */}
      <section className="wrap-wide" style={{ paddingTop: 80 }}>
        <SectionTitle eyebrow="Bora más" title="También te puede gustar" sub="Otros tours en la misma vibe."/>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {moreLike.map(t => <TourCard key={t.id} tour={t} shareEmphasis={tweaks.shareEmphasis}/>)}
        </div>
      </section>

      {/* Mobile sticky booking bar */}
      <MobileBookBar tour={activeTour} router={router} />
      
      <Footer />
      <WhatsAppFab />
    </div>
  );
}

const Fact: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 6px" }}>
    <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", gap: 6 }}>
      <Icon name={icon} size={12}/> {label}
    </div>
    <div style={{ fontWeight: 700, fontSize: 15 }}>{value}</div>
  </div>
);

const SectionH: React.FC<{ eyebrow?: string; children: React.ReactNode }> = ({ eyebrow, children }) => (
  <div style={{ marginBottom: 16, marginTop: 28 }}>
    {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
    <h2 className="display" style={{ fontSize: "clamp(24px, 3vw, 36px)", margin: 0 }}>{children}</h2>
  </div>
);

const SectionTitle: React.FC<{ eyebrow?: string; title: string; sub?: string }> = ({ eyebrow, title, sub }) => (
  <div className="section-title-row" style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
    <div>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
      <h2 className="display" style={{ margin: 0, fontSize: "clamp(28px, 4vw, 44px)" }}>{title}</h2>
      {sub && <p style={{ margin: "10px 0 0", color: "var(--ink-soft)", maxWidth: 580 }}>{sub}</p>}
    </div>
  </div>
);

const BookingCard: React.FC<{ tour: any; router: any }> = ({ tour, router }) => {
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [date, setDate] = useState("Mié 27 mayo");
  const [slot, setSlot] = useState("08:30");
  
  const subtotal = tour.priceFrom * adults + Math.round(tour.priceFrom * 0.5) * kids;

  const handleBook = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/checkout?id=${tour.id}&adults=${adults}&kids=${kids}&date=${encodeURIComponent(date)}&slot=${slot}`);
  };

  return (
    <div style={{ background: "var(--paper)", borderRadius: 24, padding: 24, boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>desde</span>
          <div className="display" style={{ fontSize: 36, lineHeight: 1, fontWeight: 700 }}>
            R$ {tour.priceFrom}<span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500 }}> / persona</span>
          </div>
        </div>
        <Badge tone="sun">Cancelación gratis</Badge>
      </div>

      <div style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
        <button style={{ width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--line)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Icon name="calendar" size={16} style={{ color: "var(--coral)" }}/> <span style={{ textAlign: "left" }}><span style={{ display: "block", fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>FECHA</span><strong>{date}</strong></span></span>
          <Icon name="chevron-down" size={14}/>
        </button>

        <div style={{ padding: 14, borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, marginBottom: 8 }}>HORARIO</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["07:30","08:30","13:00"].map(s => (
              <button key={s} onClick={()=>setSlot(s)} className="chip" style={{
                background: slot === s ? "var(--ink)" : "var(--paper)",
                color: slot === s ? "var(--cream)" : "var(--ink)",
                boxShadow: slot === s ? "none" : "inset 0 0 0 1px var(--line)",
                fontWeight: 600, fontSize: 13,
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Adultos</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>13+ años</div>
            </div>
            <Counter value={adults} setValue={setAdults} min={1}/>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Niños</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>4–12 años (50% off)</div>
            </div>
            <Counter value={kids} setValue={setKids} min={0}/>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifycontent: "space-between", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px" }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>Subtotal</span>
        <span className="display" style={{ fontSize: 22, fontWeight: 700 }}>R$ {subtotal.toLocaleString("es")}</span>
      </div>

      <button onClick={handleBook} className="btn btn-coral btn-xl" style={{ width: "100%" }}>
        Bora reservar <Icon name="arrow-right" size={16}/>
      </button>

      <div style={{ display: "flex", gap: 6 }}>
        <a className="share-btn wpp" href="https://wa.me/5548999991234" target="_blank" rel="noopener noreferrer" style={{ flex: 1, justifyContent: "center" }}><Icon name="whatsapp" size={14}/> Preguntar por WhatsApp</a>
      </div>

      <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "var(--ink-soft)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="shield" size={14} style={{ color: "var(--moss)" }}/> Cancelación 100% gratis hasta 24 h antes</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="credit" size={14} style={{ color: "var(--coral)" }}/> Pix, tarjeta de crédito o débito</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="lock" size={14} style={{ color: "var(--muted)" }}/> Pago seguro · datos cifrados</span>
      </div>
    </div>
  );
};

const Counter: React.FC<{ value: number; setValue: (v: number) => void; min?: number }> = ({ value, setValue, min = 0 }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
    <button onClick={()=>setValue(Math.max(min, value-1))} style={{ width: 32, height: 32, borderRadius: 999, boxShadow: "inset 0 0 0 1px var(--line)", fontSize: 18, fontWeight: 600, color: value <= min ? "var(--muted)" : "var(--ink)" }} disabled={value <= min}>−</button>
    <span style={{ minWidth: 26, textAlign: "center", fontWeight: 700 }}>{value}</span>
    <button onClick={()=>setValue(value+1)} style={{ width: 32, height: 32, borderRadius: 999, boxShadow: "inset 0 0 0 1px var(--line)", fontSize: 18, fontWeight: 600 }}>+</button>
  </div>
);

const MobileBookBar: React.FC<{ tour: any; router: any }> = ({ tour, router }) => {
  const handleBook = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/checkout?id=${tour.id}`);
  };

  return (
    <div className="mobile-book-bar">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>desde</div>
        <div className="display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>R$ {tour.priceFrom}</div>
      </div>
      <button onClick={handleBook} className="btn btn-coral btn-lg" style={{ flexShrink: 0 }}>Bora reservar</button>
    </div>
  );
};
