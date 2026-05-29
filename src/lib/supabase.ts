import { createClient } from '@supabase/supabase-js';

// Static Mock Data from index.html
export const MOCK_TOURS = [
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

export const MOCK_CATEGORIES = [
  { id: "playas", name: "Playas", glyph: "🏖️", count: 28, variant: "turq" },
  { id: "aventura", name: "Aventura", glyph: "🏄", count: 19, variant: "coral" },
  { id: "familia", name: "Familia", glyph: "👨‍👩‍👧", count: 14, variant: "sun" },
  { id: "atardeceres", name: "Atardeceres", glyph: "🌅", count: 9, variant: "coral" },
  { id: "cultural", name: "Cultural", glyph: "🏛️", count: 11, variant: "moss" },
  { id: "gastronomico", name: "Gastronómico", glyph: "🦪", count: 7, variant: "sun" },
  { id: "barcos", name: "Barcos", glyph: "⛵", count: 12, variant: "sky" },
  { id: "traslados", name: "Traslados", glyph: "🚙", count: 6, variant: "ink" },
];

export const MOCK_REVIEWS = [
  { name: "Mariana C.", country: "🇦🇷 Buenos Aires", rating: 5, date: "Hace 3 días", text: "Costa da Lagoa fue mágico. El guía Tiago nos llevó a una cachoeira que no sale en ningún lado. Volvería mañana mismo.", tour: "Costa da Lagoa" },
  { name: "Diego F.", country: "🇨🇱 Santiago", rating: 5, date: "Hace 1 semana", text: "Reservé el city tour 2 horas antes y todo perfecto. Recogida puntual, guía que hablaba español y paramos justo donde queríamos.", tour: "City Tour Floripa" },
  { name: "Lucía M.", country: "🇪🇸 Madrid", rating: 5, date: "Hace 2 semanas", text: "Hicimos el sunset en Praia Mole y fue la mejor noche del viaje. Los drinks bien servidos, el DJ una pasada.", tour: "Sunset Praia Mole" },
  { name: "Joaquín R.", country: "🇺🇾 Montevideo", rating: 5, date: "Hace 1 mes", text: "Llevé a mis viejos a Pomerode y les encantó. El bus impecable, el almuerzo abundante. Atención top desde Whatsapp.", tour: "Pomerode + Blumenau" },
];

export const MOCK_BLOG = [
  { id: "lluvia", title: "Llueve en Floripa: 9 planes que igual valen la pena", excerpt: "Cuando el cielo se nubla, la isla muestra otra cara. Cachoeiras llenas, ostras frescas y los mejores cafés.", read: "6 min", photoVariant: "moss", photoLabel: "lluvia ribeirão da ilha" },
  { id: "secreto", title: "Las 5 playas secretas que ningún tour te muestra", excerpt: "Lagoinha do Leste, Saquinho, Solidão... a dónde van los floripenses cuando quieren paz.", read: "8 min", photoVariant: "turq", photoLabel: "praia escondida sur de la isla" },
  { id: "niños", title: "Bora con niños: itinerario de 4 días sin que se aburran", excerpt: "Probado con dos sobrinos de 6 y 9. Mezcla justa de playa, parque y heladerías clave.", read: "5 min", photoVariant: "sun", photoLabel: "niños jugando en jurerê" },
  { id: "comer", title: "Dónde comer ostras frescas (y dónde NO)", excerpt: "Ribeirão da Ilha tiene 30 restaurantes. Te decimos los 4 que valen y los 3 trampa-turista.", read: "7 min", photoVariant: "coral", photoLabel: "ostras frescas ribeirão" },
];

// Supabase Connection & Tolerant Client Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isMockEnabled =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseAnonKey.includes('REPLACE_THIS') ||
  supabaseUrl.includes('placeholder');

export const supabase = isMockEnabled
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);

if (isMockEnabled) {
  console.warn('⚠️ Supabase URL/Key no provistas o incompletas. Corriendo en modo MOCK con datos offline locales.');
}

export const DEFAULT_DESCRIPTION = "Una jornada pensada para quienes quieren conocer la Florianópolis de verdad: la que ven los locales, no la del folleto. Te recogemos en tu hotel, te llevamos por los rincones que ningún tour grupal pisa, y te devolvemos con la cámara llena y unos kilos más por las pastéis.\n\nVas con guía bilingüe nacido en la isla, vehículo con aire, agua de cortesía y la flexibilidad de parar donde quieras. Si llueve cambiamos el plan sobre la marcha — siempre hay un plan B.";

export const DEFAULT_ITINERARY = [
  { time: "08:30", duration: "Recogida en hotel", title: "Te buscamos donde estés", desc: "Combi con aire, agua de cortesía y guía bilingüe esperándote en la puerta del hotel. Avisamos por WhatsApp 15 min antes." },
  { time: "09:15", duration: "1 h 30", title: "Centro histórico + Mercado Público", desc: "Caminata por el casco viejo de Florianópolis. Probamos pastel de camarón en el mercado y un café en el Box 32." },
  { time: "11:00", duration: "2 h", title: "Lagoa da Conceição y Mirador", desc: "Subida al Morro da Lagoa. La vista que sale en las postales — pero sin la cola del bus turístico." },
  { time: "13:30", duration: "Almuerzo opcional", title: "Pausa para comer (a tu ritmo)", desc: "Te dejamos en Costa da Lagoa o en Ribeirão da Ilha según el clima. Te sugerimos lugares, vos elegís." },
  { time: "16:00", duration: "1 h 30", title: "Playa de Joaquina", desc: "Tabla de sandboard incluida si te animás. Si no, te recostás y mirás cómo los locales bajan las dunas." },
  { time: "18:00", duration: "Atardecer", title: "Bonus: sunset y vuelta al hotel", desc: "Cerramos con un mirador para ver el sol bajar atrás del continente. Te dejamos de vuelta en tu hotel ~19:30." },
];

export const DEFAULT_INCLUDES = [
  "Recogida y regreso al hotel en zonas centro / Lagoa / Norte",
  "Guía local bilingüe (ES · PT · EN)",
  "Vehículo con aire acondicionado",
  "Agua y snack tropical",
  "Sandboard en Joaquina (opcional)",
  "Seguro de viajero incluido",
];

export const DEFAULT_EXCLUDES = [
  "Almuerzo (sugerimos R$ 60–120 por persona)",
  "Bebidas alcohólicas",
  "Propinas (a discreción)",
  "Lo que te quieras llevar de souvenir",
];

export const DEFAULT_IMPORTANT_INFO = [
  "Recogida desde tu hotel en zona Centro / Lagoa / Norte de la isla. Otras zonas, R$ 40 extra.",
  "Llevá traje de baño, toalla, protector solar y zapatillas cómodas.",
  "Si llueve fuerte, cambiamos a un plan B equivalente o reembolsamos 100%.",
  "Apto desde 6 años. Embarazadas, escribinos antes.",
];

// Unified APIs for Components (Server Components & Client Components friendly)
export async function getTours() {
  // Cargar overrides locales de mock en caliente (si existen)
  let overrides = {};
  if (typeof window !== 'undefined') {
    try {
      overrides = JSON.parse(localStorage.getItem('mock_tours_overrides') || '{}');
    } catch (e) {
      console.error(e);
    }
  }

  if (isMockEnabled || !supabase) {
    return MOCK_TOURS.map(t => {
      const tourOverride = overrides[t.id] || {};
      return {
        ...t,
        title: tourOverride.title || t.title,
        subtitle: tourOverride.subtitle || t.subtitle,
        priceFrom: Number(tourOverride.priceFrom !== undefined ? tourOverride.priceFrom : t.priceFrom),
        photoLabel: tourOverride.photoLabel !== undefined ? tourOverride.photoLabel : t.photoLabel,
        isActive: tourOverride.isActive !== undefined ? tourOverride.isActive : true,
        description: tourOverride.description || DEFAULT_DESCRIPTION,
        itinerary: tourOverride.itinerary || DEFAULT_ITINERARY,
        includes: tourOverride.includes || DEFAULT_INCLUDES,
        excludes: tourOverride.excludes || DEFAULT_EXCLUDES,
        importantInfo: tourOverride.importantInfo || DEFAULT_IMPORTANT_INFO
      };
    });
  }

  try {
    const { data, error } = await supabase.from('tours').select('*').order('reviews', { ascending: false });
    if (error) throw error;
    return data.map(item => {
      const tourOverride = overrides[item.id] || {};
      return {
        id: item.id,
        title: tourOverride.title || item.title,
        subtitle: tourOverride.subtitle || item.subtitle,
        cat: item.cat || item.category,
        tags: item.tags || [],
        duration: item.duration,
        rating: Number(item.rating || 5),
        reviews: Number(item.reviews || 0),
        priceFrom: Number(tourOverride.priceFrom !== undefined ? tourOverride.priceFrom : (item.price_from || item.priceFrom)),
        badge: item.badge,
        photoVariant: item.photo_variant || item.photoVariant || 'turq',
        glyph: item.glyph || '🌊',
        photoLabel: tourOverride.photoLabel !== undefined ? tourOverride.photoLabel : (item.photo_label || item.photoLabel),
        location: item.location,
        isActive: tourOverride.isActive !== undefined ? tourOverride.isActive : (item.is_active !== false),
        description: tourOverride.description || item.description || DEFAULT_DESCRIPTION,
        itinerary: tourOverride.itinerary || item.itinerary || DEFAULT_ITINERARY,
        includes: tourOverride.includes || item.includes || DEFAULT_INCLUDES,
        excludes: tourOverride.excludes || item.excludes || DEFAULT_EXCLUDES,
        importantInfo: tourOverride.importantInfo || item.important_info || DEFAULT_IMPORTANT_INFO
      };
    });
  } catch (err) {
    console.error('Error al fetchear tours de Supabase:', err);
    return MOCK_TOURS.map(t => {
      const tourOverride = overrides[t.id] || {};
      return {
        ...t,
        title: tourOverride.title || t.title,
        subtitle: tourOverride.subtitle || t.subtitle,
        priceFrom: Number(tourOverride.priceFrom !== undefined ? tourOverride.priceFrom : t.priceFrom),
        photoLabel: tourOverride.photoLabel !== undefined ? tourOverride.photoLabel : t.photoLabel,
        isActive: tourOverride.isActive !== undefined ? tourOverride.isActive : true,
        description: tourOverride.description || DEFAULT_DESCRIPTION,
        itinerary: tourOverride.itinerary || DEFAULT_ITINERARY,
        includes: tourOverride.includes || DEFAULT_INCLUDES,
        excludes: tourOverride.excludes || DEFAULT_EXCLUDES,
        importantInfo: tourOverride.importantInfo || DEFAULT_IMPORTANT_INFO
      };
    });
  }
}


export async function getCategories() {
  if (isMockEnabled || !supabase) {
    return MOCK_CATEGORIES;
  }
  try {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al fetchear categorías de Supabase:', err);
    return MOCK_CATEGORIES;
  }
}

export async function getReviews() {
  if (isMockEnabled || !supabase) {
    return MOCK_REVIEWS;
  }
  try {
    const { data, error } = await supabase.from('reviews').select('*').limit(10);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al fetchear reseñas de Supabase:', err);
    return MOCK_REVIEWS;
  }
}

export async function getBlog() {
  if (isMockEnabled || !supabase) {
    return MOCK_BLOG;
  }
  try {
    const { data, error } = await supabase.from('blog').select('*');
    if (error) throw error;
    return data.map(item => ({
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      read: item.read_time || item.read,
      photoVariant: item.photo_variant || item.photoVariant || 'moss',
      photoLabel: item.photo_label || item.photoLabel,
      content: item.content
    }));
  } catch (err) {
    console.error('Error al fetchear blog de Supabase:', err);
    return MOCK_BLOG;
  }
}

export async function createBooking(bookingData: any) {
  if (isMockEnabled || !supabase) {
    // Simulated storage in local state / log
    console.log('🔒 [MOCK] Guardando reserva simulada:', bookingData);
    const mockPayload = {
      ...bookingData,
      guideNetCost: Number(bookingData.guideNetCost || 0),
      providerPaymentStatus: bookingData.providerPaymentStatus || 'PENDING',
      providerPaymentDate: bookingData.providerPaymentDate || ''
    };
    if (typeof window !== 'undefined') {
      const mockBookings = JSON.parse(localStorage.getItem('mock_bookings') || '[]');
      mockBookings.push(mockPayload);
      localStorage.setItem('mock_bookings', JSON.stringify(mockBookings));
    }
    return { data: { id: `BF-${Math.random().toString(36).substr(2, 9).toUpperCase()}` }, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          tour_id: bookingData.tourId,
          date: bookingData.date,
          slot: bookingData.slot,
          adults: Number(bookingData.adults),
          kids: Number(bookingData.kids),
          subtotal: Number(bookingData.subtotal),
          discount: Number(bookingData.discount),
          fee: Number(bookingData.fee),
          total: Number(bookingData.total),
          name: bookingData.name,
          lastname: bookingData.lastname,
          email: bookingData.email,
          whatsapp: bookingData.whatsapp,
          country: bookingData.country,
          hotel_address: bookingData.hotelAddress,
          hotel_phone: bookingData.hotelPhone,
          hotel_room: bookingData.hotelRoom,
          notes: bookingData.notes,
          payment_method: bookingData.paymentMethod,
          payment_status: bookingData.paymentStatus || 'PENDING',
          guide_net_cost: Number(bookingData.guideNetCost || 0),
          provider_payment_status: bookingData.providerPaymentStatus || 'PENDING',
          provider_payment_date: bookingData.providerPaymentDate || ''
        }
      ])
      .select();
    if (error) throw error;
    return { data: data[0], error: null };
  } catch (err: any) {
    console.error('Error al crear reserva en Supabase:', err);
    return { data: null, error: err };
  }
}

export async function updateTourActiveStatus(tourId: string, isActive: boolean) {
  if (isMockEnabled || !supabase) {
    console.log(`[MOCK] Cambiando is_active del tour ${tourId} a: ${isActive}`);
    if (typeof window !== 'undefined') {
      try {
        const mockToursOverrides = JSON.parse(localStorage.getItem('mock_tours_overrides') || '{}');
        mockToursOverrides[tourId] = {
          ...(mockToursOverrides[tourId] || {}),
          isActive
        };
        localStorage.setItem('mock_tours_overrides', JSON.stringify(mockToursOverrides));
      } catch (e) {
        console.error(e);
      }
    }
    return { error: null };
  }
  try {
    const { error } = await supabase
      .from('tours')
      .update({ is_active: isActive })
      .eq('id', tourId);
    return { error };
  } catch (err: any) {
    console.error(`Error al cambiar estado activo para el tour ${tourId}:`, err);
    return { error: err };
  }
}

export async function updateTourDetails(tourId: string, details: { title: string; subtitle: string; priceFrom: number; photoLabel: string; description: string; itinerary: any[]; includes: string[]; excludes: string[]; importantInfo: string[] }) {
  if (isMockEnabled || !supabase) {
    console.log(`[MOCK] Editando tour ${tourId}:`, details);
    if (typeof window !== 'undefined') {
      try {
        const mockToursOverrides = JSON.parse(localStorage.getItem('mock_tours_overrides') || '{}');
        mockToursOverrides[tourId] = {
          ...(mockToursOverrides[tourId] || {}),
          title: details.title,
          subtitle: details.subtitle,
          priceFrom: Number(details.priceFrom),
          photoLabel: details.photoLabel,
          description: details.description,
          itinerary: details.itinerary,
          includes: details.includes,
          excludes: details.excludes,
          importantInfo: details.importantInfo
        };
        localStorage.setItem('mock_tours_overrides', JSON.stringify(mockToursOverrides));
      } catch (e) {
        console.error(e);
      }
    }
    return { error: null };
  }
  try {
    const { error } = await supabase
      .from('tours')
      .update({
        title: details.title,
        subtitle: details.subtitle,
        price_from: Number(details.priceFrom),
        photo_label: details.photoLabel,
        description: details.description,
        itinerary: details.itinerary,
        includes: details.includes,
        excludes: details.excludes,
        important_info: details.importantInfo
      })
      .eq('id', tourId);
    return { error };
  } catch (err: any) {
    console.error(`Error al editar tour ${tourId}:`, err);
    return { error: err };
  }
}

export async function getBookings() {
  if (isMockEnabled || !supabase) {
    // Si corre en modo mock, leemos de localStorage o simulamos datos estáticos
    if (typeof window !== 'undefined') {
      const mockBookings = JSON.parse(localStorage.getItem('mock_bookings') || '[]');
      if (mockBookings.length > 0) return mockBookings;
    }
    // Datos mock por defecto
    const defaultBookings = [
      {
        id: "BF-MARIANA123",
        tourId: "city-tour-floripa",
        tourTitle: "City Tour Floripa: 7 paradas imperdibles",
        date: "27 Mayo",
        slot: "08:30",
        adults: 2,
        kids: 0,
        subtotal: 360,
        discount: 36,
        fee: 10,
        total: 334,
        name: "Mariana",
        lastname: "Castillo",
        email: "mariana@gmail.com",
        whatsapp: "+54 11 5555-1234",
        country: "🇦🇷 Argentina",
        hotelAddress: "Hotel Vila do Farol — Praia Mole",
        hotelPhone: "",
        hotelRoom: "312",
        notes: "Vamos por mi cumpleaños 🎂",
        paymentMethod: "pix",
        paymentStatus: "PAID",
        createdAt: new Date().toISOString(),
        assignedGuide: "",
        pickupTime: "08:30",
        operatorNotes: "",
        voucherSent: false,
        guideNetCost: 0,
        providerPaymentStatus: "PENDING",
        providerPaymentDate: ""
      }
    ];
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_bookings', JSON.stringify(defaultBookings));
    }
    return defaultBookings;
  }
  
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, tours(title)')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data.map(item => ({
      id: item.id,
      tourId: item.tour_id,
      tourTitle: item.tours?.title || 'Tour Eliminado',
      date: item.date,
      slot: item.slot,
      adults: item.adults,
      kids: item.kids,
      subtotal: item.subtotal,
      discount: item.discount,
      fee: item.fee,
      total: item.total,
      name: item.name,
      lastname: item.lastname,
      email: item.email,
      whatsapp: item.whatsapp,
      country: item.country,
      hotelAddress: item.hotel_address,
      hotelPhone: item.hotel_phone,
      hotelRoom: item.hotel_room,
      notes: item.notes,
      paymentMethod: item.payment_method,
      paymentStatus: item.payment_status,
      createdAt: item.created_at,
      
      // Nuevos campos operativos
      assignedGuide: item.assigned_guide || '',
      pickupTime: item.pickup_time || '',
      operatorNotes: item.operator_notes || '',
      voucherSent: !!item.voucher_sent,
      guideNetCost: Number(item.guide_net_cost || 0),
      providerPaymentStatus: item.provider_payment_status || 'PENDING',
      providerPaymentDate: item.provider_payment_date || ''
    }));
  } catch (err) {
    console.error('Error al fetchear bookings de Supabase:', err);
    return [];
  }
}

export async function updateBookingDetails(bookingId: string, updates: any) {
  if (isMockEnabled || !supabase) {
    console.log(`[MOCK] Actualizando booking ${bookingId}:`, updates);
    if (typeof window !== 'undefined') {
      try {
        const mockBookings = JSON.parse(localStorage.getItem('mock_bookings') || '[]');
        let bookingsToUse = mockBookings;
        if (bookingsToUse.length === 0) {
          bookingsToUse = [
            {
              id: "BF-MARIANA123",
              tourId: "city-tour-floripa",
              tourTitle: "City Tour Floripa: 7 paradas imperdibles",
              date: "27 Mayo",
              slot: "08:30",
              adults: 2,
              kids: 0,
              subtotal: 360,
              discount: 36,
              fee: 10,
              total: 334,
              name: "Mariana",
              lastname: "Castillo",
              email: "mariana@gmail.com",
              whatsapp: "+54 11 5555-1234",
              country: "🇦🇷 Argentina",
              hotelAddress: "Hotel Vila do Farol — Praia Mole",
              hotelPhone: "",
              hotelRoom: "312",
              notes: "Vamos por mi cumpleaños 🎂",
              paymentMethod: "pix",
              paymentStatus: "PAID",
              createdAt: new Date().toISOString(),
              assignedGuide: "",
              pickupTime: "08:30",
              operatorNotes: "",
              voucherSent: false,
              guideNetCost: 0,
              providerPaymentStatus: "PENDING",
              providerPaymentDate: ""
            }
          ];
        }
        const updatedBookings = bookingsToUse.map((b: any) => {
          if (b.id === bookingId) {
            return {
              ...b,
              ...updates,
              name: updates.name !== undefined ? updates.name : b.name,
              lastname: updates.lastname !== undefined ? updates.lastname : b.lastname,
              email: updates.email !== undefined ? updates.email : b.email,
              whatsapp: updates.whatsapp !== undefined ? updates.whatsapp : b.whatsapp,
              country: updates.country !== undefined ? updates.country : b.country,
              hotelAddress: updates.hotelAddress !== undefined ? updates.hotelAddress : b.hotelAddress,
              hotelRoom: updates.hotelRoom !== undefined ? updates.hotelRoom : b.hotelRoom,
              hotelPhone: updates.hotelPhone !== undefined ? updates.hotelPhone : b.hotelPhone,
              date: updates.date !== undefined ? updates.date : b.date,
              slot: updates.slot !== undefined ? updates.slot : b.slot,
              adults: updates.adults !== undefined ? Number(updates.adults) : b.adults,
              kids: updates.kids !== undefined ? Number(updates.kids) : b.kids,
              total: updates.total !== undefined ? Number(updates.total) : b.total,
              tourId: updates.tourId !== undefined ? updates.tourId : b.tourId,
              tourTitle: updates.tourTitle !== undefined ? updates.tourTitle : b.tourTitle,
              paymentStatus: updates.paymentStatus !== undefined ? updates.paymentStatus : b.paymentStatus,
              paymentMethod: updates.paymentMethod !== undefined ? updates.paymentMethod : b.paymentMethod,
              assignedGuide: updates.assignedGuide !== undefined ? updates.assignedGuide : b.assignedGuide,
              pickupTime: updates.pickupTime !== undefined ? updates.pickupTime : b.pickupTime,
              operatorNotes: updates.operatorNotes !== undefined ? updates.operatorNotes : b.operatorNotes,
              voucherSent: updates.voucherSent !== undefined ? updates.voucherSent : b.voucherSent,
              guideNetCost: updates.guideNetCost !== undefined ? Number(updates.guideNetCost) : b.guideNetCost,
              providerPaymentStatus: updates.providerPaymentStatus !== undefined ? updates.providerPaymentStatus : b.providerPaymentStatus,
              providerPaymentDate: updates.providerPaymentDate !== undefined ? updates.providerPaymentDate : b.providerPaymentDate
            };
          }
          return b;
        });
        localStorage.setItem('mock_bookings', JSON.stringify(updatedBookings));
      } catch (e) {
        console.error(e);
      }
    }
    return { error: null };
  }
  
  try {
    const mappedUpdates: any = {};
    if (updates.name !== undefined) mappedUpdates.name = updates.name;
    if (updates.lastname !== undefined) mappedUpdates.lastname = updates.lastname;
    if (updates.email !== undefined) mappedUpdates.email = updates.email;
    if (updates.whatsapp !== undefined) mappedUpdates.whatsapp = updates.whatsapp;
    if (updates.country !== undefined) mappedUpdates.country = updates.country;
    if (updates.hotelAddress !== undefined) mappedUpdates.hotel_address = updates.hotelAddress;
    if (updates.hotelRoom !== undefined) mappedUpdates.hotel_room = updates.hotelRoom;
    if (updates.hotelPhone !== undefined) mappedUpdates.hotel_phone = updates.hotelPhone;
    if (updates.date !== undefined) mappedUpdates.date = updates.date;
    if (updates.slot !== undefined) mappedUpdates.slot = updates.slot;
    if (updates.adults !== undefined) mappedUpdates.adults = Number(updates.adults);
    if (updates.kids !== undefined) mappedUpdates.kids = Number(updates.kids);
    if (updates.total !== undefined) mappedUpdates.total = Number(updates.total);
    if (updates.tourId !== undefined) mappedUpdates.tour_id = updates.tourId;
    if (updates.paymentStatus !== undefined) mappedUpdates.payment_status = updates.paymentStatus;
    if (updates.paymentMethod !== undefined) mappedUpdates.payment_method = updates.paymentMethod;
    if (updates.assignedGuide !== undefined) mappedUpdates.assigned_guide = updates.assignedGuide;
    if (updates.pickupTime !== undefined) mappedUpdates.pickup_time = updates.pickupTime;
    if (updates.operatorNotes !== undefined) mappedUpdates.operator_notes = updates.operatorNotes;
    if (updates.voucherSent !== undefined) mappedUpdates.voucher_sent = updates.voucherSent;
    if (updates.guideNetCost !== undefined) mappedUpdates.guide_net_cost = Number(updates.guideNetCost);
    if (updates.providerPaymentStatus !== undefined) mappedUpdates.provider_payment_status = updates.providerPaymentStatus;
    if (updates.providerPaymentDate !== undefined) mappedUpdates.provider_payment_date = updates.providerPaymentDate;

    const { error } = await supabase
      .from('bookings')
      .update(mappedUpdates)
      .eq('id', bookingId);
    return { error };
  } catch (err: any) {
    console.error(`Error al actualizar reserva ${bookingId}:`, err);
    return { error: err };
  }
}

export async function getBookingPayments(bookingId?: string) {
  let mockPayments = [];
  if (typeof window !== 'undefined') {
    try {
      mockPayments = JSON.parse(localStorage.getItem('mock_booking_payments') || '[]');
    } catch (e) {
      console.error(e);
    }
  }

  if (isMockEnabled || !supabase) {
    if (bookingId) {
      return mockPayments.filter((p: any) => p.bookingId === bookingId);
    }
    return mockPayments;
  }

  try {
    let query = supabase.from('booking_payments').select('*');
    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }
    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;
    return data.map(item => ({
      id: item.id,
      bookingId: item.booking_id,
      amount: Number(item.amount),
      currency: item.currency,
      exchangeRate: Number(item.exchange_rate),
      amountBrl: Number(item.amount_brl),
      paymentMethod: item.payment_method,
      notes: item.notes || '',
      createdAt: item.created_at
    }));
  } catch (err) {
    console.error('Error al fetchear abonos de Supabase:', err);
    if (bookingId) {
      return mockPayments.filter((p: any) => p.bookingId === bookingId);
    }
    return mockPayments;
  }
}

export async function addBookingPayment(payment: { bookingId: string; amount: number; currency: string; exchangeRate: number; amountBrl: number; paymentMethod: string; notes?: string }) {
  const id = `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const newPaymentObj = {
    id,
    bookingId: payment.bookingId,
    amount: Number(payment.amount),
    currency: payment.currency,
    exchangeRate: Number(payment.exchangeRate),
    amountBrl: Number(payment.amountBrl),
    paymentMethod: payment.paymentMethod,
    notes: payment.notes || '',
    createdAt
  };

  if (typeof window !== 'undefined') {
    try {
      const mockPayments = JSON.parse(localStorage.getItem('mock_booking_payments') || '[]');
      mockPayments.push(newPaymentObj);
      localStorage.setItem('mock_booking_payments', JSON.stringify(mockPayments));
    } catch (e) {
      console.error(e);
    }
  }

  if (isMockEnabled || !supabase) {
    console.log('🔒 [MOCK] Guardando abono simulado:', newPaymentObj);
    return { data: newPaymentObj, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('booking_payments')
      .insert([
        {
          booking_id: payment.bookingId,
          amount: Number(payment.amount),
          currency: payment.currency,
          exchange_rate: Number(payment.exchangeRate),
          amount_brl: Number(payment.amountBrl),
          payment_method: payment.paymentMethod,
          notes: payment.notes || ''
        }
      ])
      .select();
    if (error) throw error;
    
    // Map to camelCase
    const formattedData = {
      id: data[0].id,
      bookingId: data[0].booking_id,
      amount: Number(data[0].amount),
      currency: data[0].currency,
      exchangeRate: Number(data[0].exchange_rate),
      amountBrl: Number(data[0].amount_brl),
      paymentMethod: data[0].payment_method,
      notes: data[0].notes || '',
      createdAt: data[0].created_at
    };
    return { data: formattedData, error: null };
  } catch (err: any) {
    console.error('Error al registrar abono en Supabase:', err);
    return { data: null, error: err };
  }
}

export async function deleteBookingPayment(paymentId: string) {
  if (typeof window !== 'undefined') {
    try {
      const mockPayments = JSON.parse(localStorage.getItem('mock_booking_payments') || '[]');
      const updatedPayments = mockPayments.filter((p: any) => p.id !== paymentId);
      localStorage.setItem('mock_booking_payments', JSON.stringify(updatedPayments));
    } catch (e) {
      console.error(e);
    }
  }

  if (isMockEnabled || !supabase) {
    console.log('🔒 [MOCK] Eliminando abono:', paymentId);
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('booking_payments')
      .delete()
      .eq('id', paymentId);
    return { error };
  } catch (err: any) {
    console.error('Error al eliminar abono en Supabase:', err);
    return { error: err };
  }
}

export async function getBookingLogs(bookingId: string) {
  let mockLogs = [];
  if (typeof window !== 'undefined') {
    try {
      mockLogs = JSON.parse(localStorage.getItem('mock_booking_logs') || '[]');
    } catch (e) {
      console.error(e);
    }
  }

  if (isMockEnabled || !supabase) {
    return mockLogs.filter((l: any) => l.bookingId === bookingId);
  }

  try {
    const { data, error } = await supabase
      .from('booking_logs')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data.map(item => ({
      id: item.id,
      bookingId: item.booking_id,
      comment: item.comment,
      author: item.author,
      createdAt: item.created_at
    }));
  } catch (err) {
    console.error('Error al fetchear logs de Supabase:', err);
    return mockLogs.filter((l: any) => l.bookingId === bookingId);
  }
}

export async function addBookingLog(log: { bookingId: string; comment: string; author?: string }) {
  const id = `LOG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const newLogObj = {
    id,
    bookingId: log.bookingId,
    comment: log.comment,
    author: log.author || 'Admin',
    createdAt
  };

  if (typeof window !== 'undefined') {
    try {
      const mockLogs = JSON.parse(localStorage.getItem('mock_booking_logs') || '[]');
      mockLogs.push(newLogObj);
      localStorage.setItem('mock_booking_logs', JSON.stringify(mockLogs));
    } catch (e) {
      console.error(e);
    }
  }

  if (isMockEnabled || !supabase) {
    console.log('🔒 [MOCK] Guardando log simulado:', newLogObj);
    return { data: newLogObj, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('booking_logs')
      .insert([
        {
          booking_id: log.bookingId,
          comment: log.comment,
          author: log.author || 'Admin'
        }
      ])
      .select();
    if (error) throw error;
    
    // Map to camelCase
    const formattedData = {
      id: data[0].id,
      bookingId: data[0].booking_id,
      comment: data[0].comment,
      author: data[0].author,
      createdAt: data[0].created_at
    };
    return { data: formattedData, error: null };
  } catch (err: any) {
    console.error('Error al registrar log en Supabase:', err);
    return { data: null, error: err };
  }
}

