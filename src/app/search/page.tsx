"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { getTours, getCategories } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Stars } from '@/components/Stars';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { TourCard } from '@/components/TourCard';
import { WhatsAppFab } from '@/components/WhatsAppFab';

function SearchPageContent() {
  const { tweaks } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCat = searchParams.get('cat') || '';
  const initialQuery = searchParams.get('q') || '';
  const initialDate = searchParams.get('date') || '';
  const initialPax = searchParams.get('pax') || '2';

  const [tours, setTours] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [priceMax, setPriceMax] = useState(400);
  const [duration, setDuration] = useState<string[]>([]);
  const [category, setCategory] = useState<string[]>(initialCat ? [initialCat] : []);
  const [sort, setSort] = useState("Recomendados");
  const [mobileFilters, setMobileFilters] = useState(false);

  // Search input states
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchDate, setSearchDate] = useState(initialDate);
  const [searchPax, setSearchPax] = useState(initialPax);

  // Update local search states if URL parameters change
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSearchDate(searchParams.get('date') || '');
    setSearchPax(searchParams.get('pax') || '2');
  }, [searchParams]);

  const handleSearchSubmit = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (searchDate) params.set("date", searchDate);
    if (searchPax) params.set("pax", searchPax);
    if (category.length === 1) params.set("cat", category[0]);
    router.push(`/search?${params.toString()}`);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [toursData, categoriesData] = await Promise.all([
          getTours(),
          getCategories()
        ]);
        setTours(toursData);
        setCategories(categoriesData);
      } catch (e) {
        console.error("Error al cargar datos en búsqueda:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update initial categories if URL search parameter changes
  useEffect(() => {
    if (initialCat) {
      setCategory([initialCat]);
    }
  }, [initialCat]);

  // Filtering Logic
  const filtered = tours.filter(t => {
    if (t.isActive === false) return false;
    if (t.priceFrom > priceMax) return false;
    if (duration.length && !duration.some((d: string) => t.tags.includes(d))) return false;
    if (category.length && !category.some((c: string) => {
      const catMatch = t.cat.toLowerCase().includes(c);
      const catObj = categories.find(x => x.id === c);
      const nameMatch = catObj ? catObj.name.toLowerCase() === t.cat.toLowerCase() : false;
      return catMatch || nameMatch;
    })) return false;

    // Filter by searchQuery
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = t.title.toLowerCase().includes(q);
      const subtitleMatch = t.subtitle.toLowerCase().includes(q);
      const locationMatch = t.location.toLowerCase().includes(q);
      const catMatch = t.cat.toLowerCase().includes(q);
      const tagMatch = t.tags.some((tag: string) => tag.toLowerCase().includes(q));
      if (!titleMatch && !subtitleMatch && !locationMatch && !catMatch && !tagMatch) {
        return false;
      }
    }
    return true;
  });

  // Sorting Logic
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "Mejor valoración") {
      return b.rating - a.rating;
    } else if (sort === "Precio: menor") {
      return a.priceFrom - b.priceFrom;
    } else if (sort === "Precio: mayor") {
      return b.priceFrom - a.priceFrom;
    } else if (sort === "Más vendidos") {
      return b.reviews - a.reviews;
    }
    return 0; // Default "Recomendados" stays in seed order
  });

  const toggleFilter = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, v: string) => {
    setArr(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  };

  const handleClearAll = () => {
    setPriceMax(500);
    setDuration([]);
    setCategory([]);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Bora cargando tours...</h2>
      </div>
    );
  }

  return (
    <>
      {/* Top bar — breadcrumb + title */}
      <section style={{ background: "var(--cream-soft)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap-wide" style={{ paddingTop: 28, paddingBottom: 32 }}>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            <Link href="/">Inicio</Link>
            <span style={{ margin: "0 8px" }}>/</span>
            <span>Todos los tours en Florianópolis</span>
          </div>
          <h1 className="display" style={{ fontSize: "clamp(32px, 5vw, 56px)", margin: 0, lineHeight: 1 }}>
            Todos los tours en <span style={{ color: "var(--coral)" }}>Floripa</span>
          </h1>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: 16 }}>
            <strong>{filtered.length}</strong> experiencias encontradas · ordenadas por <strong>{sort.toLowerCase()}</strong>
          </p>

          {/* Inline search bar */}
          <div className="hero-search" style={{ marginTop: 20, maxWidth: 920, boxShadow: "var(--shadow-md)" }}>
            <div className="field" style={{ cursor: "text" }}>
              <div className="field-label">Qué buscas</div>
              <input
                type="text"
                placeholder="Todas las experiencias…"
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
            <button className="btn btn-coral btn-lg" onClick={handleSearchSubmit}>
              <Icon name="search" size={18}/> Buscar
            </button>
          </div>
        </div>
      </section>

      {/* Results layout */}
      <section className="wrap-wide" style={{ paddingTop: 32, paddingBottom: 40 }}>
        <div className="search-grid" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 40, alignItems: "start" }}>
          {/* Sidebar filters */}
          <aside className="filters-aside" style={{ position: "sticky", top: 88 }}>
            <FiltersPanel
              priceMax={priceMax} setPriceMax={setPriceMax}
              duration={duration} setDuration={setDuration}
              category={category} setCategory={setCategory}
              categories={categories} tours={tours}
              toggleFilter={toggleFilter} clearAll={handleClearAll}
            />
          </aside>

          {/* Main results */}
          <div>
            {/* Sort row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Recomendados", "Más vendidos", "Mejor valoración", "Precio: menor", "Precio: mayor"].map(s => (
                  <button key={s} onClick={()=>setSort(s)} className="chip" style={{
                    fontSize: 13, fontWeight: 500,
                    background: sort === s ? "var(--ink)" : "var(--paper)",
                    color: sort === s ? "var(--cream)" : "var(--ink)",
                    boxShadow: sort === s ? "none" : "inset 0 0 0 1px var(--line)",
                  }}>{s}</button>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm mobile-filter-btn" onClick={()=>setMobileFilters(true)} style={{ display: "none" }}>
                <Icon name="filter" size={14}/> Filtros
              </button>
            </div>

            {/* Quick filters horizontal */}
            <div className="hscroll" style={{ marginBottom: 24 }}>
              {["🔥 Más populares", "🆓 Cancelación gratis", "🧑‍🤝‍🧑 Bora con niños", "🌧️ Sin sol", "💸 Bajo R$ 200", "⏱️ Medio día", "🌅 Atardecer"].map(c => (
                <button key={c} className="chip">{c}</button>
              ))}
            </div>

            {/* Inline promo banner */}
            <div style={{
              background: "var(--ink)", color: "var(--cream)",
              borderRadius: 20,
              padding: "22px 26px",
              display: "flex", alignItems: "center", gap: 20,
              marginBottom: 28,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", right: -20, top: -20, fontSize: 140, opacity: 0.08 }}>🌊</div>
              <div style={{ background: "var(--sun)", color: "var(--ink)", padding: "6px 12px", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>BORA10</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>10% off en tu primer Bora</div>
                <div style={{ fontSize: 13, color: "rgba(247,241,227,0.7)" }}>Aplica el código al pagar. Válido para reservas hasta R$ 500.</div>
              </div>
              <a href="#" onClick={e=>e.preventDefault()} className="btn btn-coral btn-sm" style={{ flexShrink: 0 }}>Copiar código</a>
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {sorted.map(t => <TourCard key={t.id} tour={t} shareEmphasis={tweaks.shareEmphasis}/>)}
            </div>

            {sorted.length === 0 && (
              <div style={{ background: "var(--paper)", borderRadius: 20, padding: 48, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤔</div>
                <h3 className="display" style={{ fontSize: 24, margin: 0 }}>Nada por acá</h3>
                <p style={{ color: "var(--muted)", marginTop: 8 }}>Probá aflojar los filtros, o escribinos por WhatsApp — armamos algo a medida.</p>
                <button className="btn btn-coral" style={{ marginTop: 20 }} onClick={handleClearAll}>
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Pagination */}
            <div style={{ marginTop: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
              <button className="btn btn-ghost btn-sm"><Icon name="chevron-left" size={14}/></button>
              {[1,2,3,4].map(n => (
                <button key={n} className="chip" style={{
                  width: 38, height: 38, justifyContent: "center", padding: 0,
                  background: n === 1 ? "var(--ink)" : "var(--paper)",
                  color: n === 1 ? "var(--cream)" : "var(--ink)",
                  boxShadow: n === 1 ? "none" : "inset 0 0 0 1px var(--line)",
                  fontWeight: 600,
                }}>{n}</button>
              ))}
              <span style={{ color: "var(--muted)", padding: "0 8px" }}>…</span>
              <button className="chip" style={{ width: 38, height: 38, justifyContent: "center", padding: 0 }}>12</button>
              <button className="btn btn-ghost btn-sm"><Icon name="chevron-right" size={14}/></button>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile filters drawer */}
      {mobileFilters && (
        <div onClick={()=>setMobileFilters(false)} style={{ position: "fixed", inset: 0, background: "rgba(14,27,44,0.5)", zIndex: 60 }}>
          <div onClick={(e)=>e.stopPropagation()} style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--cream)", borderRadius: "24px 24px 0 0", padding: 20, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 className="display" style={{ fontSize: 22, margin: 0 }}>Filtros</h3>
              <button onClick={()=>setMobileFilters(false)} style={{ padding: 6 }}><Icon name="close" size={20}/></button>
            </div>
            <FiltersPanel
              priceMax={priceMax} setPriceMax={setPriceMax}
              duration={duration} setDuration={setDuration}
              category={category} setCategory={setCategory}
              categories={categories} tours={tours}
              toggleFilter={toggleFilter} clearAll={handleClearAll}
            />
            <button className="btn btn-coral btn-lg" style={{ width: "100%", marginTop: 16 }} onClick={()=>setMobileFilters(false)}>Aplicar ({sorted.length})</button>
          </div>
        </div>
      )}
    </>
  );
}

// Sub-Filters panel component
interface FiltersPanelProps {
  priceMax: number;
  setPriceMax: (v: number) => void;
  duration: string[];
  setDuration: React.Dispatch<React.SetStateAction<string[]>>;
  category: string[];
  setCategory: React.Dispatch<React.SetStateAction<string[]>>;
  categories: any[];
  tours: any[];
  toggleFilter: (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, v: string) => void;
  clearAll: () => void;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  priceMax, setPriceMax,
  duration, setDuration,
  category, setCategory,
  categories, tours,
  toggleFilter, clearAll
}) => {
  return (
    <div style={{ background: "var(--paper)", borderRadius: 18, padding: 24, boxShadow: "var(--shadow-sm)" }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="filter" size={16}/> Filtros
      </h3>

      <div className="filter-section">
        <div className="filter-title">Precio máximo</div>
        <input type="range" min="50" max="500" step="10" value={priceMax} onChange={e=>setPriceMax(+e.target.value)} style={{ width: "100%", accentColor: "var(--coral)" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          <span>R$ 50</span>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>Hasta R$ {priceMax}</span>
          <span>R$ 500+</span>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-title">Duración</div>
        {["Medio día", "Día completo", "Atardecer", "Privado"].map(d => (
          <label key={d} className="checkbox-row">
            <input type="checkbox" checked={duration.includes(d)} onChange={()=>toggleFilter(duration, setDuration, d)}/>
            {d}
            <span className="count">{tours.filter(t=>t.tags.includes(d)).length}</span>
          </label>
        ))}
      </div>

      <div className="filter-section">
        <div className="filter-title">Categoría</div>
        {categories.map(c => (
          <label key={c.id} className="checkbox-row">
            <input type="checkbox" checked={category.includes(c.id)} onChange={()=>toggleFilter(category, setCategory, c.id)}/>
            <span style={{ marginRight: 4 }}>{c.glyph}</span>{c.name}
            <span className="count">{c.count}</span>
          </label>
        ))}
      </div>

      <div className="filter-section">
        <div className="filter-title">Vibe</div>
        {[
          { id: "familia", label: "Bora con niños", icon: "👨‍👩‍👧" },
          { id: "romantico", label: "Romántico", icon: "💞" },
          { id: "adrenalina", label: "Adrenalina", icon: "⚡" },
          { id: "sinsol", label: "Sin sol", icon: "🌧️" },
          { id: "gastro", label: "Gastronómico", icon: "🦪" },
        ].map(v => (
          <label key={v.id} className="checkbox-row">
            <input type="checkbox"/>
            <span>{v.icon}</span> {v.label}
          </label>
        ))}
      </div>

      <div className="filter-section">
        <div className="filter-title">Valoración mínima</div>
        {[4.8, 4.5, 4.0].map(r => (
          <label key={r} className="checkbox-row">
            <input type="radio" name="rating" style={{ accentColor: "var(--coral)" }}/>
            <Stars rating={r} size={13}/>
            <span style={{ marginLeft: 6, color: "var(--muted)", fontSize: 12 }}>y más</span>
          </label>
        ))}
      </div>

      <button style={{ marginTop: 16, fontSize: 13, color: "var(--coral)", fontWeight: 600 }} onClick={clearAll}>Limpiar todos los filtros</button>
    </div>
  );
};

export default function SearchPage() {
  return (
    <div className="page" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Header />
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <h2>Cargando búsqueda...</h2>
        </div>
      }>
        <SearchPageContent />
      </Suspense>
      <Footer />
      <WhatsAppFab />
    </div>
  );
}
