"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { getTours, getCategories, getReviews, getBlog } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Photo } from '@/components/Photo';
import { Stars } from '@/components/Stars';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { TourCard } from '@/components/TourCard';
import { WhatsAppFab } from '@/components/WhatsAppFab';

export default function HomePage() {
  const { tweaks } = useTheme();
  const router = useRouter();

  const [tours, setTours] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [blog, setBlog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [toursData, categoriesData, reviewsData, blogData] = await Promise.all([
          getTours(),
          getCategories(),
          getReviews(),
          getBlog()
        ]);
        setTours(toursData);
        setCategories(categoriesData);
        setReviews(reviewsData);
        setBlog(blogData);
      } catch (e) {
        console.error("Error al cargar datos:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeTours = tours.filter(t => t.isActive !== false);
  const featured = activeTours.slice(0, 6);
  const popular = activeTours.slice(6, 12);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <LogoIcon size={48} />
          <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 16 }}>Bora cargando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Header />
      
      <Hero router={router} />
      <CategoriesStrip categories={categories} router={router} />
      <FeaturedTours tours={featured} shareEmphasis={tweaks.shareEmphasis} />
      <WhyBora />
      <PopularTours tours={popular} shareEmphasis={tweaks.shareEmphasis} />
      <ReviewsSection reviews={reviews} />
      <BlogSection blog={blog} />
      <ClosingCTA />
      
      <Footer />
      <WhatsAppFab />
    </div>
  );
}

// Logo helper inside the page
const LogoIcon = ({ size = 24 }) => (
  <svg width={size + 4} height={size + 4} viewBox="0 0 32 32" fill="none" style={{ display: 'inline-block' }}>
    <circle cx="16" cy="16" r="15" fill="var(--coral)"/>
    <path d="M4 20c3-3 6-3 9 0s6 3 9 0 6-3 9 0" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
    <circle cx="22" cy="11" r="2.6" fill="var(--sun)"/>
  </svg>
);

const Hero: React.FC<{ router: any }> = ({ router }) => {
  const [tab, setTab] = useState("experiencias");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchPax, setSearchPax] = useState("2");

  const handleSearchSubmit = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (searchDate) params.set("date", searchDate);
    if (searchPax) params.set("pax", searchPax);
    router.push(`/search?${params.toString()}`);
  };
  return (
    <section style={{ position: "relative", overflow: "hidden", paddingBottom: 40 }}>
      {/* background photo placeholder */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Photo
          variant="turq"
          label="foto aérea drone — praia da joaquina al atardecer"
          glyph=""
          rounded="none"
          style={{ height: "100%", aspectRatio: "auto" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(247,241,227,0.0) 0%, rgba(247,241,227,0.0) 50%, rgba(247,241,227,1) 100%)",
        }}/>
      </div>

      <div className="wrap-wide" style={{ position: "relative", zIndex: 1, paddingTop: "clamp(40px, 8vw, 100px)", paddingBottom: "clamp(40px, 8vw, 80px)" }}>
        <div style={{ maxWidth: 880 }}>
          <div className="eyebrow" style={{ background: "var(--ink)", color: "var(--cream)", display: "inline-flex", padding: "6px 12px", borderRadius: 999, marginBottom: 24 }}>
            <Icon name="wave" size={12}/> &nbsp;Floripa · Santa Catarina · Brasil
          </div>
          <h1 className="display" style={{
            fontSize: "clamp(48px, 9vw, 120px)",
            margin: 0,
            lineHeight: 0.92,
          }}>
            Bora vivir<br/>
            <span style={{ color: "var(--coral)" }}>Floripa</span> <span style={{ fontStyle: "italic", fontWeight: 500, color: "var(--ink-soft)" }}>de verdad</span>.
          </h1>
          <p style={{ marginTop: 24, fontSize: "clamp(16px, 1.6vw, 20px)", color: "var(--ink-soft)", maxWidth: 580, lineHeight: 1.5 }}>
            Tours, paseos y experiencias auténticas en la Ilha da Magia. Hechos por
            <span className="highlight-sun"> floripenses</span>, contados en español, reservables en
            <span className="highlight-coral"> 30 segundos</span>.
          </p>

          {/* search */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {[
                { id: "experiencias", label: "Experiencias", icon: "sparkle" },
                { id: "traslados", label: "Traslados", icon: "phone" },
                { id: "paquetes", label: "Paquetes", icon: "diamond" },
              ].map(t => (
                <button key={t.id} onClick={()=>setTab(t.id)} style={{
                  padding: "8px 14px",
                  borderRadius: "999px 999px 0 0",
                  background: tab === t.id ? "var(--paper)" : "rgba(255,255,255,0.6)",
                  fontWeight: 600,
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: tab === t.id ? "var(--ink)" : "var(--ink-soft)",
                }}>
                  <Icon name={t.icon} size={14}/> {t.label}
                </button>
              ))}
            </div>
            <div className="hero-search">
              <div className="field" style={{ cursor: "text" }}>
                <div className="field-label">Qué buscas</div>
                <input
                  type="text"
                  placeholder="Praia, surf, atardecer…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    width: "100%",
                    padding: 0,
                    margin: 0,
                    fontFamily: "var(--font-ui)",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                />
              </div>
              <div className="divider"/>
              <div className="field" style={{ cursor: "pointer" }}>
                <div className="field-label">Cuándo</div>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    width: "100%",
                    padding: 0,
                    margin: 0,
                    fontFamily: "var(--font-ui)",
                    fontSize: 15,
                    fontWeight: 500,
                    color: searchDate ? "var(--ink)" : "var(--muted)",
                    cursor: "pointer",
                  }}
                />
              </div>
              <div className="divider"/>
              <div className="field" style={{ cursor: "pointer" }}>
                <div className="field-label">Quiénes</div>
                <select
                  value={searchPax}
                  onChange={(e) => setSearchPax(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    width: "100%",
                    padding: 0,
                    margin: 0,
                    fontFamily: "var(--font-ui)",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--ink)",
                    cursor: "pointer",
                    appearance: "none",
                    WebkitAppearance: "none",
                  }}
                >
                  <option value="1">1 adulto</option>
                  <option value="2">2 adultos</option>
                  <option value="3">3 personas</option>
                  <option value="4">4 personas</option>
                  <option value="5+">5+ personas</option>
                </select>
              </div>
              <button 
                className="btn btn-coral btn-lg" 
                style={{ alignSelf: "stretch", margin: 0 }} 
                onClick={handleSearchSubmit}
              >
                <Icon name="search" size={18}/> Bora!
              </button>
            </div>
          </div>

          {/* quick chips */}
          <div className="hscroll" style={{ marginTop: 18, gap: 8 }}>
            {["🔥 Lagoinha do Leste", "⛵ Costa da Lagoa", "🏄 Surf Guarda", "🌅 Sunset Praia Mole", "👨‍👩‍👧 Bora con niños", "🦪 Ruta de ostras"].map(c => (
              <button key={c} className="chip" onClick={() => router.push('/search')} style={{ fontSize: 13 }}>{c}</button>
            ))}
          </div>
        </div>

        {/* trust strip */}
        <div className="trust-strip" style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, padding: 20, background: "var(--paper)", borderRadius: 20, boxShadow: "var(--shadow-sm)" }}>
          <Trust icon="star" label="4.9 / 5" sub="9,824 reseñas verificadas"/>
          <Trust icon="shield" label="Cancelación gratis" sub="Hasta 24 h antes"/>
          <Trust icon="whatsapp" label="Soporte 24/7" sub="Por WhatsApp, en español"/>
          <Trust icon="leaf" label="Guías locales" sub="100% floripenses"/>
        </div>
      </div>
    </section>
  );
};

const Trust: React.FC<{ icon: string; label: string; sub: string }> = ({ icon, label, sub }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ background: "var(--cream-soft)", padding: 10, borderRadius: 12, color: icon === "whatsapp" ? "#25D366" : "var(--coral)" }}>
      <Icon name={icon} size={20}/>
    </div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{sub}</div>
    </div>
  </div>
);

const CategoriesStrip: React.FC<{ categories: any[]; router: any }> = ({ categories, router }) => (
  <section className="wrap-wide" style={{ paddingTop: 40, paddingBottom: 20 }}>
    <SectionTitle
      eyebrow="Categorías"
      title="Bora elegir tu estilo de viaje"
      sub="Filtramos por vibe. Tú decides si hoy toca aventura, descanso o caipirinha."
    />
    <div className="cats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
      {categories.map(c => (
        <button key={c.id} onClick={() => router.push(`/search?cat=${c.id}`)} className="card" style={{ padding: 0, textAlign: "left" }}>
          <div className={`ph ph-${c.variant}`} style={{ aspectRatio: "5/3", borderRadius: "var(--radius-md) var(--radius-md) 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
            <span style={{ position: "relative", zIndex: 1 }}>{c.glyph}</span>
          </div>
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 18 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.count} experiencias</div>
            </div>
            <Icon name="arrow-right" size={16}/>
          </div>
        </button>
      ))}
    </div>
  </section>
);

const FeaturedTours: React.FC<{ tours: any[]; shareEmphasis?: 'loud' | 'quiet' }> = ({ tours, shareEmphasis }) => (
  <section className="wrap-wide" style={{ paddingTop: 64, paddingBottom: 20 }}>
    <SectionTitle
      eyebrow="Más vendidos esta semana"
      title="Bora con los favoritos"
      sub="Los tours que viajeros como tú reservaron más en los últimos 7 días."
      action={<Link href="/search" className="btn btn-ghost">Ver todos los tours <Icon name="arrow-right" size={14}/></Link>}
    />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
      {tours.map(t => <TourCard key={t.id} tour={t} shareEmphasis={shareEmphasis} />)}
    </div>
  </section>
);

const PopularTours: React.FC<{ tours: any[]; shareEmphasis?: 'loud' | 'quiet' }> = ({ tours, shareEmphasis }) => (
  <section className="wrap-wide" style={{ paddingTop: 64, paddingBottom: 20 }}>
    <SectionTitle
      eyebrow="También para ti"
      title="Bora descubrir el otro lado de Floripa"
      sub="Trilhas, pueblitos pesqueros y la Floripa que no sale en Instagram."
    />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
      {tours.map(t => <TourCard key={t.id} tour={t} shareEmphasis={shareEmphasis} />)}
    </div>
  </section>
);

const WhyBora: React.FC = () => (
  <section style={{ background: "var(--ink)", color: "var(--cream)", padding: "80px 0", marginTop: 64 }}>
    <div className="wrap-wide">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }} className="why-grid">
        <div>
          <div className="eyebrow" style={{ color: "var(--sun)", marginBottom: 16 }}>Por qué Bora Floripa</div>
          <h2 className="display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: 0 }}>
            No somos una<br/>
            <span style={{ color: "var(--coral)" }}>agencia más</span>.<br/>
            Somos tus<br/>
            <span style={{ fontStyle: "italic", fontWeight: 500 }}>amigos en la isla</span>.
          </h2>
          <p style={{ marginTop: 24, color: "rgba(247,241,227,0.75)", fontSize: 18, maxWidth: 480, lineHeight: 1.55 }}>
            Nacimos en Florianópolis. Vivimos acá. Cada tour fue probado por nosotros — y por los amigos. Si llueve, te avisamos. Si la ola está fea, te llevamos a otra playa. Si tienes hambre a las 3am, también.
          </p>
          <div className="hero-btns" style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/about" className="btn btn-coral btn-lg">Bora conocernos <Icon name="arrow-right" size={14}/></Link>
            <a href="#" className="btn btn-ghost btn-lg" style={{ color: "var(--cream)", boxShadow: "inset 0 0 0 1px rgba(247,241,227,0.25)" }}>
              <Icon name="play" size={14}/> Ver video (1:24)
            </a>
          </div>
        </div>
        <div className="pillar-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Pillar n="01" title="Guías locales" desc="100% nacidos y criados en la isla. Hablan portugués, español, inglés." color="coral"/>
          <Pillar n="02" title="Reserva en 30s" desc="Sin formularios eternos. Reservas, pagas con Pix o tarjeta, listo." color="sun"/>
          <Pillar n="03" title="WhatsApp real" desc="Te responde una persona en menos de 5 min. 24/7. Siempre." color="turq"/>
          <Pillar n="04" title="Cancelación libre" desc="Hasta 24h antes, devolución 100%. Sin letra chica." color="moss"/>
        </div>
      </div>
    </div>
  </section>
);

const Pillar: React.FC<{ n: string; title: string; desc: string; color: string }> = ({ n, title, desc, color }) => (
  <div style={{
    background: "rgba(247,241,227,0.06)",
    borderRadius: 18,
    padding: 22,
    border: "1px solid rgba(247,241,227,0.1)",
  }}>
    <div style={{ fontFamily: "var(--font-mono)", color: `var(--${color})`, fontSize: 12, fontWeight: 600 }}>{n} —</div>
    <div className="display" style={{ fontSize: 22, marginTop: 8, marginBottom: 6, color: "var(--cream)" }}>{title}</div>
    <div style={{ fontSize: 13, color: "rgba(247,241,227,0.65)", lineHeight: 1.5 }}>{desc}</div>
  </div>
);

const ReviewsSection: React.FC<{ reviews: any[] }> = ({ reviews }) => (
  <section className="wrap-wide" style={{ paddingTop: 80, paddingBottom: 20 }}>
    <SectionTitle
      eyebrow="Lo que dicen viajeros como tú"
      title="9,824 reseñas reales"
      sub="Verificadas, sin filtros, copiadas tal cual."
      action={<Stars rating={4.9} reviews={9824} />}
    />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
      {reviews.map((r, i) => (
        <div key={i} className="card" style={{ padding: 22, cursor: "default", display: "flex", flexDirection: "column", gap: 12 }}>
          <Stars rating={r.rating} size={14}/>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, fontFamily: "var(--font-display)", fontWeight: 500 }}>"{r.text}"</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 12, borderTop: "1px dashed var(--line)", fontSize: 13 }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--cream-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
              {r.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>{r.country} · {r.date}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
            sobre · {r.tour}
          </div>
        </div>
      ))}
    </div>
  </section>
);

const BlogSection: React.FC<{ blog: any[] }> = ({ blog }) => (
  <section className="wrap-wide" style={{ paddingTop: 80, paddingBottom: 20 }}>
    <SectionTitle
      eyebrow="Diario de la isla"
      title="Bora inspirarse"
      sub="Lo que solo te diría un amigo local."
      action={<a href="#" className="btn btn-ghost" onClick={e => e.preventDefault()}>Todos los artículos <Icon name="arrow-right" size={14}/></a>}
    />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
      {blog.map(b => (
        <a key={b.id} href="#" className="card" style={{ display: "flex", flexDirection: "column" }} onClick={(e)=>e.preventDefault()}>
          <Photo variant={b.photoVariant} label={b.photoLabel} ratio="4/3" rounded="none" glyph=""/>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>BLOG · {b.read}</div>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
              {b.title}
            </h3>
            <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5 }}>{b.excerpt}</p>
            <span style={{ marginTop: "auto", color: "var(--coral)", fontWeight: 600, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4, paddingTop: 8 }}>
              Leer <Icon name="arrow-right" size={12}/>
            </span>
          </div>
        </a>
      ))}
    </div>
  </section>
);

const ClosingCTA: React.FC = () => (
  <section style={{ paddingTop: 80 }}>
    <div className="wrap-wide">
      <div style={{
        position: "relative",
        background: "var(--coral)",
        borderRadius: 32,
        overflow: "hidden",
        padding: "clamp(40px, 6vw, 80px)",
        color: "#fff",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 90% 10%, rgba(255,196,47,0.45), transparent 50%)", pointerEvents: "none" }}/>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720 }}>
          <div className="eyebrow" style={{ color: "rgba(255,255,255,0.85)" }}>Listos? Bora!</div>
          <h2 className="display" style={{ fontSize: "clamp(40px, 6vw, 72px)", margin: "16px 0 24px", lineHeight: 0.95 }}>
            Tu próximo<br/>
            <span className="cta-tag" style={{ background: "var(--ink)", color: "var(--cream)", padding: "0 14px", borderRadius: 12, display: "inline-block", transform: "rotate(-1.5deg)" }}>BORA</span> empieza acá.
          </h2>
          <p style={{ fontSize: 18, marginBottom: 28, maxWidth: 480, lineHeight: 1.5, color: "rgba(255,255,255,0.9)" }}>
            Reserva ahora, paga con Pix o tarjeta. Cancelación gratis hasta 24h antes. Soporte real por WhatsApp.
          </p>
          <div className="cta-btns" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/search" className="btn btn-xl" style={{ background: "var(--ink)", color: "var(--cream)" }}>Bora ver todos los tours <Icon name="arrow-right" size={16}/></Link>
            <a href="https://wa.me/5548999991234" target="_blank" rel="noopener noreferrer" className="btn btn-xl" style={{ background: "#fff", color: "var(--ink)" }}><Icon name="whatsapp" size={16}/> Chatear primero</a>
          </div>
        </div>
      </div>
    </div>
  </section>
);

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ eyebrow, title, sub, action }) => (
  <div className="section-title-row" style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
    <div>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
      <h2 className="display" style={{ margin: 0, fontSize: "clamp(28px, 4vw, 44px)" }}>{title}</h2>
      {sub && <p style={{ margin: "10px 0 0", color: "var(--ink-soft)", maxWidth: 580 }}>{sub}</p>}
    </div>
    {action}
  </div>
);
