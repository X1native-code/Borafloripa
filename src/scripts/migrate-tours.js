const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Cargar variables de entorno de .env.local de forma manual y robusta
const envPath = path.join(__dirname, '../../.env.local');
console.log('🔍 Cargando variables de entorno desde:', envPath);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex !== -1) {
      const key = trimmed.substring(0, separatorIndex).trim();
      let value = trimmed.substring(separatorIndex + 1).trim();
      // Remover comillas si existen
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Limpiar la clave si contiene marcadores de posición del usuario
if (supabaseAnonKey && supabaseAnonKey.includes('REPLACE_THIS_WITH_YOUR_COMPLETE_ANON_KEY')) {
  // Reemplazar la frase genérica para que use la clave reducida o vacía
  supabaseAnonKey = supabaseAnonKey.replace('_REPLACE_THIS_WITH_YOUR_COMPLETE_ANON_KEY', '');
}

console.log('🌐 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Anon Key (parcial):', supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'No provista');

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas correctamente en .env.local.');
  process.exit(1);
}

// 2. Inicializar cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 3. Dataset de Tours a Migrar (MOCK_TOURS originales del frontend)
const TOURS_TO_MIGRATE = [
  {
    id: "city-tour-floripa",
    title: "City Tour Floripa: 7 paradas imperdibles",
    subtitle: "Centro histórico, Lagoa, Mirador da Lagoa y atardecer en Joaquina",
    cat: "Clásicos",
    tags: ["Día completo", "Familia", "Recogida en hotel"],
    duration: "8 h",
    rating: 4.9,
    reviews: 1287,
    priceFrom: 180,
    badge: "Más vendido",
    photoVariant: "turq",
    glyph: "🌊",
    photoLabel: "vista aérea ponte hercílio luz",
    location: "Florianópolis (isla)",
  },
  {
    id: "costa-da-lagoa",
    title: "Costa da Lagoa en barco + caminata",
    subtitle: "Pueblito pesquero sin acceso por tierra. Almuerzo de mariscos opcional.",
    cat: "Aventura",
    tags: ["Medio día", "Barco", "Bora con niños"],
    duration: "5 h",
    rating: 4.95,
    reviews: 842,
    priceFrom: 145,
    badge: "Recomendado",
    photoVariant: "moss",
    glyph: "🚤",
    photoLabel: "costa da lagoa atardecer",
    location: "Lagoa da Conceição",
  },
  {
    id: "balneario-cambo-telef",
    title: "Balneário Camboriú + Teleférico Unipraias",
    subtitle: "Skyline tropical de Brasil, parque de la mata atlántica y tirolesa.",
    cat: "Día completo",
    tags: ["Día completo", "Bus", "Adrenalina"],
    duration: "10 h",
    rating: 4.7,
    reviews: 614,
    priceFrom: 220,
    badge: "Cancelación gratis",
    photoVariant: "sky",
    glyph: "🚡",
    photoLabel: "teleférico unipraias",
    location: "Balneário Camboriú",
  },
  {
    id: "guarda-do-embau",
    title: "Surf en Guarda do Embaú",
    subtitle: "Una de las 25 mejores olas del mundo. Clase + tabla incluidas.",
    cat: "Aventura",
    tags: ["Medio día", "Surf", "Principiantes"],
    duration: "6 h",
    rating: 4.85,
    reviews: 397,
    priceFrom: 260,
    badge: "Adrenalina",
    photoVariant: "turq",
    glyph: "🏄",
    photoLabel: "surf praia da guarda",
    location: "Palhoça (40 min)",
  },
  {
    id: "beto-carrero",
    title: "Beto Carrero World con traslado ida y vuelta",
    subtitle: "El parque temático más grande de América Latina. Día completo + bus.",
    cat: "Familia",
    tags: ["Día completo", "Familia", "Bora con niños"],
    duration: "12 h",
    rating: 4.8,
    reviews: 1932,
    priceFrom: 340,
    badge: "Más vendido",
    photoVariant: "coral",
    glyph: "🎢",
    photoLabel: "beto carrero parque temático",
    location: "Penha (2h en bus)",
  },
  {
    id: "lagoinha-leste",
    title: "Trilha Lagoinha do Leste",
    subtitle: "Caminata 7 km hasta la playa virgen más linda de la isla.",
    cat: "Aventura",
    tags: ["Día completo", "Trekking", "Sin sol no recomendado"],
    duration: "7 h",
    rating: 4.92,
    reviews: 286,
    priceFrom: 160,
    badge: "Recomendado",
    photoVariant: "moss",
    glyph: "🥾",
    photoLabel: "lagoinha do leste mirante",
    location: "Pântano do Sul",
  },
  {
    id: "ilha-do-campeche",
    title: "Ilha do Campeche — el Caribe de Floripa",
    subtitle: "Travesía en lancha, agua turquesa y petroglifos prehistóricos.",
    cat: "Playas",
    tags: ["Medio día", "Barco", "Familia"],
    duration: "5 h",
    rating: 4.88,
    reviews: 1104,
    priceFrom: 195,
    badge: "Más vendido",
    photoVariant: "turq",
    glyph: "🏝️",
    photoLabel: "ilha do campeche agua turquesa",
    location: "Sur de la isla",
  },
  {
    id: "pomerode-blumenau",
    title: "Pomerode + Blumenau: la Alemania brasileña",
    subtitle: "Arquitectura enxaimel, cervecería artesanal y almuerzo típico.",
    cat: "Cultural",
    tags: ["Día completo", "Bus", "Cultural"],
    duration: "11 h",
    rating: 4.65,
    reviews: 412,
    priceFrom: 270,
    badge: "Cultural",
    photoVariant: "sun",
    glyph: "🍺",
    photoLabel: "pomerode casas enxaimel",
    location: "Vale Europeu (2h)",
  },
  {
    id: "boat-trip-norte",
    title: "Boat Trip norte de la isla: Daniela, Forte y Brava",
    subtitle: "Catamarán privado, parada para snorkel y caipirinha a bordo.",
    cat: "Playas",
    tags: ["Día completo", "Barco", "Romántico"],
    duration: "8 h",
    rating: 4.93,
    reviews: 521,
    priceFrom: 310,
    badge: "Romántico",
    photoVariant: "sky",
    glyph: "⛵",
    photoLabel: "catamarán norte de floripa",
    location: "Marina Itaguaçu",
  },
  {
    id: "sunset-mole",
    title: "Sunset en Praia Mole con DJ",
    subtitle: "Atardecer dorado, drinks tropicales y sesión de DJ frente al mar.",
    cat: "Atardeceres",
    tags: ["Atardecer", "Romántico", "Bebidas"],
    duration: "4 h",
    rating: 4.9,
    reviews: 312,
    priceFrom: 130,
    badge: "Nuevo",
    photoVariant: "coral",
    glyph: "🌅",
    photoLabel: "atardecer praia mole",
    location: "Praia Mole",
  },
  {
    id: "traslado-aeropuerto",
    title: "Traslado privado aeropuerto ↔ hotel",
    subtitle: "Conductor bilingüe, monitor de vuelo y agua de cortesía.",
    cat: "Traslados",
    tags: ["24h", "Privado", "Bilingüe"],
    duration: "30 min",
    rating: 4.97,
    reviews: 2841,
    priceFrom: 95,
    badge: "24h",
    photoVariant: "ink",
    glyph: "🚙",
    photoLabel: "traslado privado SUV",
    location: "FLN aeropuerto",
  },
  {
    id: "gastronomico-ostras",
    title: "Ruta de ostras y vino en Ribeirão",
    subtitle: "Visita a fazenda marina, degustación de 6 ostras + 3 vinos.",
    cat: "Cultural",
    tags: ["Medio día", "Gastronómico", "+18"],
    duration: "4 h",
    rating: 4.86,
    reviews: 198,
    priceFrom: 240,
    badge: "Gastronómico",
    photoVariant: "sun",
    glyph: "🦪",
    photoLabel: "fazenda de ostras ribeirão",
    location: "Ribeirão da Ilha",
  },
];

async function migrate() {
  console.log('🚀 Iniciando migración de', TOURS_TO_MIGRATE.length, 'tours a Supabase...');
  
  for (const tour of TOURS_TO_MIGRATE) {
    const dbRecord = {
      id: tour.id,
      title: tour.title,
      subtitle: tour.subtitle,
      cat: tour.cat,
      tags: tour.tags,
      duration: tour.duration,
      rating: tour.rating,
      reviews: tour.reviews,
      price_from: tour.priceFrom,
      badge: tour.badge,
      photo_variant: tour.photoVariant,
      glyph: tour.glyph,
      photo_label: tour.photoLabel,
      location: tour.location,
      is_active: true // Columna de estado activo
    };

    console.log(`⏳ Sincronizando tour: "${tour.title}" (${tour.id})...`);
    
    try {
      const { data, error } = await supabase
        .from('tours')
        .upsert([dbRecord], { onConflict: 'id' })
        .select();

      if (error) {
        console.error(`❌ Error al insertar "${tour.id}":`, error.message);
      } else {
        console.log(`✅ ¡Éxito! Tour "${tour.id}" insertado/actualizado.`);
      }
    } catch (err) {
      console.error(`❌ Error en llamada de upsert para "${tour.id}":`, err);
    }
  }

  console.log('🎉 Proceso de migración finalizado.');
}

migrate();
