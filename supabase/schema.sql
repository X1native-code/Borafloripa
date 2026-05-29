-- ── BORA FLORIPA DATABASE SCHEMA & INITIAL SEED ──
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase para inicializar las tablas y poblar los datos.

-- 1. Crear Tabla de Categorías
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    glyph TEXT,
    count INTEGER DEFAULT 0,
    variant TEXT NOT NULL DEFAULT 'turq'
);

-- 2. Crear Tabla de Tours
CREATE TABLE IF NOT EXISTS tours (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    cat TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    duration TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews INTEGER DEFAULT 0,
    price_from NUMERIC(10, 2) NOT NULL,
    badge TEXT,
    photo_variant TEXT NOT NULL DEFAULT 'turq',
    glyph TEXT DEFAULT '🌊',
    photo_label TEXT,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear Tabla de Reseñas
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id TEXT REFERENCES tours(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    country TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    tour TEXT NOT NULL, -- Nombre textual descriptivo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Crear Tabla de Blog
CREATE TABLE IF NOT EXISTS blog (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    read_time TEXT NOT NULL,
    photo_variant TEXT NOT NULL DEFAULT 'moss',
    photo_label TEXT,
    content TEXT, -- Markdown o HTML para el detalle del artículo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Crear Tabla de Reservas (Bookings)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id TEXT REFERENCES tours(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    slot TEXT NOT NULL,
    adults INTEGER NOT NULL CHECK (adults >= 1),
    kids INTEGER DEFAULT 0 CHECK (kids >= 0),
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    fee NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    name TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    country TEXT NOT NULL,
    hotel_address TEXT,
    hotel_phone TEXT,
    hotel_room TEXT,
    notes TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'card', 'wpp')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── SEED INITIAL DATA ──

-- Insertar Categorías
INSERT INTO categories (id, name, glyph, count, variant) VALUES
('playas', 'Playas', '🏖️', 28, 'turq'),
('aventura', 'Aventura', '🏄', 19, 'coral'),
('familia', 'Familia', '👨‍👩‍👧', 14, 'sun'),
('atardeceres', 'Atardeceres', '🌅', 9, 'coral'),
('cultural', 'Cultural', '🏛️', 11, 'moss'),
('gastronomico', 'Gastronómico', '🦪', 7, 'sun'),
('barcos', 'Barcos', '⛵', 12, 'sky'),
('traslados', 'Traslados', '🚙', 6, 'ink')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, glyph = EXCLUDED.glyph, count = EXCLUDED.count, variant = EXCLUDED.variant;

-- Insertar Tours
INSERT INTO tours (id, title, subtitle, cat, tags, duration, rating, reviews, price_from, badge, photo_variant, glyph, photo_label, location) VALUES
('city-tour-floripa', 'City Tour Floripa: 7 paradas imperdibles', 'Centro histórico, Lagoa, Mirador da Lagoa y atardecer en Joaquina', 'Clásicos', '{"Día completo", "Familia", "Recogida en hotel"}', '8 h', 4.90, 1287, 180.00, 'Más vendido', 'turq', '🌊', 'vista aérea ponte hercílio luz', 'Florianópolis (isla)'),
('costa-da-lagoa', 'Costa da Lagoa en barco + caminata', 'Pueblito pesquero sin acceso por tierra. Almuerzo de mariscos opcional.', 'Aventura', '{"Medio día", "Barco", "Bora con niños"}', '5 h', 4.95, 842, 145.00, 'Recomendado', 'moss', '🚤', 'costa da lagoa atardecer', 'Lagoa da Conceição'),
('balneario-cambo-telef', 'Balneário Camboriú + Teleférico Unipraias', 'Skyline tropical de Brasil, parque de la mata atlántica y tirolesa.', 'Día completo', '{"Día completo", "Bus", "Adrenalina"}', '10 h', 4.70, 614, 220.00, 'Cancelación gratis', 'sky', '🚡', 'teleférico unipraias', 'Balneário Camboriú'),
('guarda-do-embau', 'Surf en Guarda do Embaú', 'Una de las 25 mejores olas del mundo. Clase + tabla incluidas.', 'Aventura', '{"Medio día", "Surf", "Principiantes"}', '6 h', 4.85, 397, 260.00, 'Adrenalina', 'turq', '🏄', 'surf praia da guarda', 'Palhoça (40 min)'),
('beto-carrero', 'Beto Carrero World con traslado ida y vuelta', 'El parque temático más grande de América Latina. Día completo + bus.', 'Familia', '{"Día completo", "Familia", "Bora con niños"}', '12 h', 4.80, 1932, 340.00, 'Más vendido', 'coral', '🎢', 'beto carrero parque temático', 'Penha (2h en bus)'),
('lagoinha-leste', 'Trilha Lagoinha do Leste', 'Caminata 7 km hasta la playa virgen más linda de la isla.', 'Aventura', '{"Día completo", "Trekking", "Sin sol no recomendado"}', '7 h', 4.92, 286, 160.00, 'Recomendado', 'moss', '🥾', 'lagoinha do leste mirante', 'Pântano do Sul'),
('ilha-do-campeche', 'Ilha do Campeche — el Caribe de Floripa', 'Travesía en lancha, agua turquesa y petroglifos prehistóricos.', 'Playas', '{"Medio día", "Barco", "Familia"}', '5 h', 4.88, 1104, 195.00, 'Más vendido', 'turq', '🏝️', 'ilha do campeche agua turquesa', 'Sur de la isla'),
('pomerode-blumenau', 'Pomerode + Blumenau: la Alemania brasileña', 'Arquitectura enxaimel, cervecería artesanal y almuerzo típico.', 'Cultural', '{"Día completo", "Bus", "Cultural"}', '11 h', 4.65, 412, 270.00, 'Cultural', 'sun', '🍺', 'pomerode casas enxaimel', 'Vale Europeu (2h)'),
('boat-trip-norte', 'Boat Trip norte de la isla: Daniela, Forte y Brava', 'Catamarán privado, parada para snorkel y caipirinha a bordo.', 'Playas', '{"Día completo", "Barco", "Romántico"}', '8 h', 4.93, 521, 310.00, 'Romántico', 'sky', '⛵', 'catamarán norte de floripa', 'Marina Itaguaçu'),
('sunset-mole', 'Sunset en Praia Mole con DJ', 'Atardecer dorado, drinks tropicales y sesión de DJ frente al mar.', 'Atardeceres', '{"Atardecer", "Romántico", "Bebidas"}', '4 h', 4.90, 312, 130.00, 'Nuevo', 'coral', '🌅', 'atardecer praia mole', 'Praia Mole'),
('traslado-aeropuerto', 'Traslado privado aeropuerto ↔ hotel', 'Conductor bilingüe, monitor de vuelo y agua de cortesía.', 'Traslados', '{"24h", "Privado", "Bilingüe"}', '30 min', 4.97, 2841, 95.00, '24h', 'ink', '🚙', 'traslado privado SUV', 'FLN aeropuerto'),
('gastronomico-ostras', 'Ruta de ostras y vino en Ribeirão', 'Visita a fazenda marina, degustación de 6 ostras + 3 vinos.', 'Cultural', '{"Medio día", "Gastronómico", "+18"}', '4 h', 4.86, 198, 240.00, 'Gastronómico', 'sun', '🦪', 'fazenda de ostras ribeirão', 'Ribeirão da Ilha')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, cat = EXCLUDED.cat, tags = EXCLUDED.tags, duration = EXCLUDED.duration, rating = EXCLUDED.rating, reviews = EXCLUDED.reviews, price_from = EXCLUDED.price_from, badge = EXCLUDED.badge, photo_variant = EXCLUDED.photo_variant, glyph = EXCLUDED.glyph, photo_label = EXCLUDED.photo_label, location = EXCLUDED.location;

-- Insertar Reseñas
INSERT INTO reviews (tour_id, name, country, rating, date, text, tour) VALUES
('costa-da-lagoa', 'Mariana C.', '🇦🇷 Buenos Aires', 5, 'Hace 3 días', 'Costa da Lagoa fue mágico. El guía Tiago nos llevó a una cachoeira que no sale en ningún lado. Volvería mañana mismo.', 'Costa da Lagoa'),
('city-tour-floripa', 'Diego F.', '🇨🇱 Santiago', 5, 'Hace 1 semana', 'Reservé el city tour 2 horas antes y todo perfecto. Recogida puntual, guía que hablaba español y paramos justo donde queríamos.', 'City Tour Floripa'),
('sunset-mole', 'Lucía M.', '🇪🇸 Madrid', 5, 'Hace 2 semanas', 'Hicimos el sunset en Praia Mole y fue la mejor noche del viaje. Los drinks bien servidos, el DJ una pasada.', 'Sunset Praia Mole'),
('pomerode-blumenau', 'Joaquín R.', '🇺🇾 Montevideo', 5, 'Hace 1 mes', 'Llevé a mis viejos a Pomerode y les encantó. El bus impecable, el almuerzo abundante. Atención top desde Whatsapp.', 'Pomerode + Blumenau');

-- Insertar Blog
INSERT INTO blog (id, title, excerpt, read_time, photo_variant, photo_label, content) VALUES
('lluvia', 'Llueve en Floripa: 9 planes que igual valen la pena', 'Cuando el cielo se nubla, la isla muestra otra cara. Cachoeiras llenas, ostras frescas y los mejores cafés.', '6 min', 'moss', 'lluvia ribeirão da ilha', 'Contenido completo para leer cuando llueve en la isla mágica...'),
('secreto', 'Las 5 playas secretas que ningún tour te muestra', 'Lagoinha do Leste, Saquinho, Solidão... a dónde van los floripenses cuando quieren paz.', '8 min', 'turq', 'praia escondida sur de la isla', 'Contenido completo sobre las playas más recluidas del sur de Florianópolis...'),
('niños', 'Bora con niños: itinerario de 4 días sin que se aburran', 'Probado con dos sobrinos de 6 y 9. Mezcla justa de playa, parque y heladerías clave.', '5 min', 'sun', 'niños jugando en jurerê', 'Plan de viaje ideal paso a paso para hacer con niños en Florianópolis...'),
('comer', 'Dónde comer ostras frescas (y dónde NO)', 'Ribeirão da Ilha tiene 30 restaurantes. Te decimos los 4 que valen y los 3 trampa-turista.', '7 min', 'coral', 'ostras frescas ribeirão', 'Guía gourmet detallada sobre cómo catar y disfrutar de las mejores ostras de cultivo en Ribeirão da Ilha...')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, read_time = EXCLUDED.read_time, photo_variant = EXCLUDED.photo_variant, photo_label = EXCLUDED.photo_label, content = EXCLUDED.content;
