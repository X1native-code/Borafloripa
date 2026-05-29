-- ── BORA FLORIPA DATABASE MIGRATION: FINANCES & LOGISTICS ──
-- Ejecuta este script en el SQL Editor de Supabase para habilitar abonos multimoneda,
-- bitácoras operativas y campos logísticos avanzados en las reservas.

-- 1. Agregar Campos Operativos a la tabla 'bookings' (si no existen ya)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS assigned_guide TEXT,
ADD COLUMN IF NOT EXISTS pickup_time TEXT,
ADD COLUMN IF NOT EXISTS operator_notes TEXT,
ADD COLUMN IF NOT EXISTS voucher_sent BOOLEAN DEFAULT FALSE;

-- 2. Crear Tabla de Abonos Multimoneda (booking_payments)
CREATE TABLE IF NOT EXISTS booking_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BRL',
    exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 1.0000,
    amount_brl NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'card', 'wpp', 'cash', 'transfer')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear Tabla de Bitácora Operativa (booking_logs)
CREATE TABLE IF NOT EXISTS booking_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    comment TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Crear índices para optimizar búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_payments_booking ON booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_logs_booking ON booking_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON booking_payments(created_at);
