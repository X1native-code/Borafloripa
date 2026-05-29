"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { getTours, createBooking } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Stars } from '@/components/Stars';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { Photo } from '@/components/Photo';
import { ShareRow } from '@/components/ShareRow';

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tourId = searchParams.get('id') || '';
  const adults = Number(searchParams.get('adults')) || 2;
  const kids = Number(searchParams.get('kids')) || 0;
  const date = searchParams.get('date') || "Mié 27 mayo";
  const slot = searchParams.get('slot') || "08:30";

  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState("pix");
  
  // Form states
  const [formData, setFormData] = useState({
    name: "Mariana",
    lastname: "Castillo",
    email: "mariana@gmail.com",
    whatsapp: "+54 11 5555-1234",
    country: "🇦🇷 Argentina",
    hotelAddress: "Hotel Vila do Farol — Praia Mole",
    hotelPhone: "",
    hotelRoom: "312",
    notes: "Vamos por mi cumpleaños 🎂"
  });

  const [bookingId, setBookingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const toursData = await getTours();
        setTours(toursData);
      } catch (e) {
        console.error("Error al cargar tours en checkout:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const tour = tours.find(t => t.id === tourId) || tours[0];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Cargando checkout...</h2>
      </div>
    );
  }

  if (!tour) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h2>Tour no seleccionado</h2>
        <Link href="/search" className="btn btn-coral">Ir a todos los tours</Link>
      </div>
    );
  }

  const subtotal = tour.priceFrom * adults + Math.round(tour.priceFrom * 0.5) * kids;
  const discount = Math.round(subtotal * 0.10);
  const fee = Math.round(subtotal * 0.03);
  const total = subtotal - discount + fee;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    try {
      const order = {
        tourId: tour.id,
        date,
        slot,
        adults,
        kids,
        subtotal,
        discount,
        fee,
        total,
        ...formData,
        paymentMethod: payment,
        paymentStatus: payment === 'pix' || payment === 'card' ? 'PAID' : 'PENDING'
      };

      const { data, error } = await createBooking(order);
      if (error) {
        alert('Hubo un error al procesar tu reserva. Inténtalo de nuevo.');
      } else if (data) {
        setBookingId(data.id);
        setStep(3);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 3) {
    return <CheckoutSuccess tour={tour} adults={adults} kids={kids} date={date} slot={slot} bookingId={bookingId} hotelAddress={formData.hotelAddress} />;
  }

  return (
    <div className="wrap-wide" style={{ paddingTop: 28, paddingBottom: 40 }}>
      {/* Steps indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--muted)" }}>
          <Icon name="chevron-left" size={14}/> Volver
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--muted)" }}>
          <Icon name="lock" size={14}/> Pago 100% seguro · TLS encriptado
        </div>
      </div>

      <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", margin: 0, marginBottom: 8 }}>
        Bora confirmar tu reserva
      </h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 28 }}>Estás a 2 minutos de tener todo listo.</p>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        <StepIndicator n={1} label="Detalles" active={step >= 1}/>
        <Connector active={step >= 2}/>
        <StepIndicator n={2} label="Pago" active={step >= 2}/>
        <Connector active={step >= 3}/>
        <StepIndicator n={3} label="Confirmación" active={step >= 3}/>
      </div>

      <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 32, alignItems: "start" }}>
        <div>
          {step === 1 && (
            <DetailsForm
              formData={formData}
              onChange={handleInputChange}
              next={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <PaymentForm
              payment={payment}
              setPayment={setPayment}
              next={handleConfirmOrder}
              back={() => setStep(1)}
              total={total}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        <aside className="tour-sticky">
          <OrderSummary tour={tour} adults={adults} kids={kids} date={date} slot={slot} subtotal={subtotal} discount={discount} fee={fee} total={total}/>
        </aside>
      </div>
    </div>
  );
}

// Inline Sub-Components
const StepIndicator: React.FC<{ n: number; label: string; active: boolean }> = ({ n, label, active }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
    <div style={{
      width: 28, height: 28, borderRadius: 999,
      background: active ? "var(--coral)" : "var(--paper)",
      color: active ? "#fff" : "var(--muted)",
      boxShadow: active ? "none" : "inset 0 0 0 1px var(--line)",
      display: "inline-flex", alignItems: "center", justifycontent: "center", justifyContent: "center",
      fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13,
    }}>{n}</div>
    <span style={{ fontWeight: 600, color: active ? "var(--ink)" : "var(--muted)", fontSize: 14 }}>{label}</span>
  </div>
);

const Connector: React.FC<{ active: boolean }> = ({ active }) => (
  <div style={{ width: 40, height: 2, background: active ? "var(--coral)" : "var(--line)", borderRadius: 2 }}/>
);

interface DetailsFormProps {
  formData: any;
  onChange: (field: string, val: string) => void;
  next: () => void;
}

const DetailsForm: React.FC<DetailsFormProps> = ({ formData, onChange, next }) => {
  const [terms, setTerms] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terms) {
      alert("Debes aceptar los términos y condiciones para reservar.");
      return;
    }
    next();
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--paper)", borderRadius: 20, padding: 28, boxShadow: "var(--shadow-sm)" }}>
      <h2 className="display" style={{ fontSize: 24, margin: "0 0 6px" }}>Tus datos</h2>
      <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: 14 }}>Solo lo esencial. Nada de spam.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="form-grid">
        <Field label="Nombre" value={formData.name} onChange={v => onChange("name", v)} />
        <Field label="Apellido" value={formData.lastname} onChange={v => onChange("lastname", v)} />
        <Field label="Email" value={formData.email} onChange={v => onChange("email", v)} type="email" wide/>
        <Field label="WhatsApp" value={formData.whatsapp} onChange={v => onChange("whatsapp", v)} type="tel"/>
        <Field label="País" value={formData.country} onChange={v => onChange("country", v)}/>
      </div>

      <h3 style={{ margin: "24px 0 10px", fontSize: 16, fontWeight: 700 }}>Recogida en hotel</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="form-grid">
        <Field label="Hotel o dirección" value={formData.hotelAddress} onChange={v => onChange("hotelAddress", v)} wide/>
        <Field label="Teléfono del hotel (opcional)" value={formData.hotelPhone} onChange={v => onChange("hotelPhone", v)}/>
        <Field label="Habitación" value={formData.hotelRoom} onChange={v => onChange("hotelRoom", v)}/>
      </div>

      <h3 style={{ margin: "24px 0 10px", fontSize: 16, fontWeight: 700 }}>Algo más?</h3>
      <textarea
        placeholder="Restricciones alimentarias, celebración, lo que quieras avisarnos…"
        value={formData.notes}
        onChange={e => onChange("notes", e.target.value)}
        style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid var(--line)", fontFamily: "inherit", fontSize: 14, minHeight: 80, resize: "vertical", background: "var(--cream-soft)" }}
      />

      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16, fontSize: 13, color: "var(--ink-soft)", cursor: 'pointer' }}>
        <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} style={{ marginTop: 3, accentColor: "var(--coral)" }}/>
        <span>Acepto los <a href="#" onClick={e=>e.preventDefault()} style={{ color: "var(--coral)", textDecoration: "underline" }}>términos</a> y la <a href="#" onClick={e=>e.preventDefault()} style={{ color: "var(--coral)", textDecoration: "underline" }}>política de cancelación</a>.</span>
      </label>

      <button type="submit" className="btn btn-coral btn-xl" style={{ width: "100%", marginTop: 22 }}>
        Bora al pago <Icon name="arrow-right" size={16}/>
      </button>
    </form>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  wide?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, type = "text", wide }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: wide ? "1 / -1" : "auto" }}>
    <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.02em" }}>{label}</span>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} required style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", fontFamily: "inherit", fontSize: 15, background: "var(--cream-soft)" }}/>
  </label>
);

interface PaymentFormProps {
  payment: string;
  setPayment: (p: string) => void;
  next: () => void;
  back: () => void;
  total: number;
  isSubmitting: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ payment, setPayment, next, back, total, isSubmitting }) => {
  return (
    <div style={{ background: "var(--paper)", borderRadius: 20, padding: 28, boxShadow: "var(--shadow-sm)" }}>
      <h2 className="display" style={{ fontSize: 24, margin: "0 0 6px" }}>Pago</h2>
      <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: 14 }}>Elegí cómo querés pagar. Lo más fácil es Pix.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }} className="pay-grid">
        <PayOption id="pix" current={payment} set={setPayment} title="Pix" sub="-5% off" icon="⚡"/>
        <PayOption id="card" current={payment} set={setPayment} title="Tarjeta" sub="Crédito o débito" icon="💳"/>
        <PayOption id="wpp" current={payment} set={setPayment} title="WhatsApp" sub="Pagás por chat" icon="💬"/>
      </div>

      {payment === "pix" && (
        <div style={{ padding: 22, background: "var(--cream-soft)", borderRadius: 16, textAlign: "center" }}>
          <div style={{ width: 160, height: 160, margin: "0 auto", background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QrPattern/>
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, marginTop: 14, color: "var(--muted)" }}>
            escaneá con tu app bancaria · o copiá el código abajo
          </p>
          <div style={{ display: "flex", gap: 6, marginTop: 10, padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1px solid var(--line)", alignItems: "center", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>00020126360014BR.GOV.BCB.PIX0114+5548999912345...</span>
            <button style={{ color: "var(--coral)", fontWeight: 700 }} onClick={e => { e.preventDefault(); alert("¡Código Copiado!"); }}>Copiar</button>
          </div>
        </div>
      )}

      {payment === "card" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="form-grid">
          <Field label="Número de tarjeta" value="4242 4242 4242 4242" onChange={()=>{}} wide/>
          <Field label="Vencimiento" value="08/27" onChange={()=>{}}/>
          <Field label="CVV" value="123" onChange={()=>{}}/>
          <Field label="Titular" value="MARIANA CASTILLO" onChange={()=>{}} wide/>
        </div>
      )}

      {payment === "wpp" && (
        <div style={{ padding: 22, background: "#E8F8EE", borderRadius: 16, borderLeft: "4px solid #25D366" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
            <Icon name="whatsapp" size={20} style={{ color: "#25D366" }}/> Pago por WhatsApp
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--ink-soft)" }}>
            Tocá <strong>Confirmar</strong> y te escribimos por WhatsApp para coordinar el pago. Tu lugar queda reservado por 12 horas.
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button onClick={back} className="btn btn-ghost btn-lg" style={{ flex: 1 }}><Icon name="chevron-left" size={14}/> Volver</button>
        <button onClick={next} className="btn btn-coral btn-xl" style={{ flex: 2 }} disabled={isSubmitting}>
          {isSubmitting ? 'Procesando...' : `Confirmar y pagar R$ ${total.toLocaleString("es")}`} <Icon name="arrow-right" size={16}/>
        </button>
      </div>
    </div>
  );
};

const PayOption: React.FC<{ id: string; current: string; set: (id: string) => void; title: string; sub: string; icon: string }> = ({
  id, current, set, title, sub, icon
}) => (
  <button onClick={()=>set(id)} style={{
    padding: 14, borderRadius: 14,
    background: "var(--cream-soft)",
    boxShadow: current === id ? "inset 0 0 0 2px var(--coral)" : "inset 0 0 0 1px var(--line)",
    textAlign: "left",
    display: "flex", flexDirection: "column", gap: 4,
  }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div style={{ width: 18, height: 18, borderRadius: 999, boxShadow: current === id ? "inset 0 0 0 6px var(--coral)" : "inset 0 0 0 1px var(--line)", background: current === id ? "var(--cream-soft)" : "transparent" }}/>
    </div>
    <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
    <span style={{ fontSize: 12, color: "var(--muted)" }}>{sub}</span>
  </button>
);

const QrPattern: React.FC = () => {
  const rows = 12;
  const cols = 12;
  return (
    <svg viewBox={`0 0 ${cols} ${rows}`} width="100%" height="100%" style={{ display: "block" }}>
      {Array.from({ length: rows*cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const v = ((r*7 + c*3 + r*c) * 2654435761 >>> 0) % 100;
        if (v < 45) return <rect key={i} x={c} y={r} width="1" height="1" fill="var(--ink)"/>;
        return null;
      })}
      {[[0,0],[0,9],[9,0]].map(([x,y],i)=>(
        <g key={i}>
          <rect x={x} y={y} width="3" height="3" fill="var(--ink)"/>
          <rect x={x+0.5} y={y+0.5} width="2" height="2" fill="#fff"/>
          <rect x={x+1} y={y+1} width="1" height="1" fill="var(--ink)"/>
        </g>
      ))}
    </svg>
  );
};

interface OrderSummaryProps {
  tour: any;
  adults: number;
  kids: number;
  date: string;
  slot: string;
  subtotal: number;
  discount: number;
  fee: number;
  total: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  tour, adults, kids, date, slot, subtotal, discount, fee, total
}) => (
  <div style={{ background: "var(--paper)", borderRadius: 20, padding: 24, boxShadow: "var(--shadow-md)" }}>
    <div className="eyebrow" style={{ marginBottom: 12 }}>Tu reserva</div>
    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
      <Photo variant={tour.photoVariant} glyph={tour.glyph} ratio="1/1" rounded="sm" style={{ width: 84, height: 84, flexShrink: 0 }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>{tour.title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          <Icon name="calendar" size={11}/> {date} · {slot}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          {adults} adulto{adults>1?"s":""}{kids ? ` · ${kids} niño${kids>1?"s":""}` : ""}
        </div>
      </div>
    </div>

    <div className="dotted-div" style={{ margin: "12px 0" }}/>

    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
      <Row label={`Adultos × ${adults}`} value={`R$ ${(tour.priceFrom*adults).toLocaleString("es")}`}/>
      {kids > 0 && <Row label={`Niños × ${kids} (50% off)`} value={`R$ ${(Math.round(tour.priceFrom*0.5)*kids).toLocaleString("es")}`}/>}
      <Row label="Subtotal" value={`R$ ${subtotal.toLocaleString("es")}`} bold/>
      <Row label={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>Cupón BORA10 <Badge tone="sun">-10%</Badge></span>} value={`− R$ ${discount.toLocaleString("es")}`} color="var(--moss)"/>
      <Row label="Cargo plataforma" value={`R$ ${fee.toLocaleString("es")}`} color="var(--muted)"/>
    </div>

    <div className="dotted-div" style={{ margin: "12px 0" }}/>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
      <span style={{ fontWeight: 700 }}>Total</span>
      <span className="display" style={{ fontSize: 26, fontWeight: 700 }}>R$ {total.toLocaleString("es")}</span>
    </div>

    <div style={{ background: "var(--cream-soft)", padding: 12, borderRadius: 12, fontSize: 12, color: "var(--ink-soft)", display: "flex", gap: 10 }}>
      <Icon name="shield" size={16} style={{ color: "var(--moss)", flexShrink: 0, marginTop: 2 }}/>
      <span>Cancelá gratis hasta el <strong>26 mayo 08:30</strong> y te devolvemos el 100%. Después de eso, 50%.</span>
    </div>

    {/* code input */}
    <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
      <input placeholder="Código de cupón" defaultValue="BORA10" style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 13, fontFamily: "inherit", background: "var(--cream-soft)" }}/>
      <button className="btn btn-ghost btn-sm" onClick={e=>e.preventDefault()}>Aplicar</button>
    </div>
  </div>
);

const Row: React.FC<{ label: React.ReactNode; value: string; bold?: boolean; color?: string }> = ({
  label, value, bold, color
}) => (
  <div style={{ display: "flex", justifyContent: "space-between", color: color || "var(--ink)", fontWeight: bold ? 700 : 400 }}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

interface SuccessProps {
  tour: any;
  adults: number;
  kids: number;
  date: string;
  slot: string;
  bookingId: string;
  hotelAddress: string;
}

const CheckoutSuccess: React.FC<SuccessProps> = ({
  tour, adults, kids, date, slot, bookingId, hotelAddress
}) => (
  <div className="page">
    <div className="wrap-wide" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 720 }}>
      <div style={{ background: "var(--paper)", borderRadius: 28, padding: "clamp(28px, 5vw, 56px)", boxShadow: "var(--shadow-md)", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 999, background: "var(--moss)", color: "#fff", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="check" size={42} stroke={3}/>
        </div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Reserva confirmada</div>
        <h1 className="display" style={{ fontSize: "clamp(36px, 5vw, 56px)", margin: 0, lineHeight: 1 }}>
          Bora!<br/>
          <span style={{ color: "var(--coral)", fontStyle: "italic", fontWeight: 500 }}>Te esperamos en Floripa.</span>
        </h1>
        <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 17 }}>
          Te enviamos los detalles a tu email y por WhatsApp. Código <span style={{ fontFamily: "var(--font-mono)", background: "var(--cream-soft)", padding: "2px 8px", borderRadius: 6 }}>#{bookingId}</span>
        </p>

        <div style={{ marginTop: 28, padding: 20, background: "var(--cream-soft)", borderRadius: 16, textAlign: "left", display: "flex", gap: 14, alignItems: "center" }}>
          <Photo variant={tour.photoVariant} glyph={tour.glyph} ratio="1/1" rounded="sm" style={{ width: 72, height: 72, flexShrink: 0 }}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>{tour.title}</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>{date} · {slot} · {adults} adulto{adults>1?"s":""}{kids ? ` · ${kids} niño${kids>1?"s":""}` : ""}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Recogida en {hotelAddress}</div>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Bora avisarle a la banda</div>
          <ShareRow emphasis="loud" title="" size="md"/>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
          <a href="#" onClick={e=>e.preventDefault()} className="btn btn-ghost btn-lg"><Icon name="calendar" size={14}/> Agregar al calendario</a>
          <Link href="/" className="btn btn-coral btn-lg">Bora explorar más tours <Icon name="arrow-right" size={14}/></Link>
        </div>
      </div>
    </div>
  </div>
);

export default function CheckoutPage() {
  return (
    <div className="page" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Header />
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <h2>Cargando simulador de reserva...</h2>
        </div>
      }>
        <CheckoutPageContent />
      </Suspense>
      <Footer />
    </div>
  );
}
