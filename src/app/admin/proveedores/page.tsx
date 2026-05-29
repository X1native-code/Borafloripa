"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getBookings, 
  getProviders, 
  createProvider, 
  getProviderPayments, 
  addProviderPayment
} from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';

export default function ProveedoresDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedTour, setSelectedTour] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);

  // Selecciones
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // slide-over drawer para Crear Proveedor
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [newProvName, setNewProvName] = useState('');
  const [newProvWhatsapp, setNewProvWhatsapp] = useState('');
  const [newProvPixKey, setNewProvPixKey] = useState('');
  const [newProvEmail, setNewProvEmail] = useState('');
  const [newProvCpfCnpj, setNewProvCpfCnpj] = useState('');
  const [newProvCompanyName, setNewProvCompanyName] = useState('');
  const [newProvObs, setNewProvObs] = useState('');

  // Formulario de Abono Parcial
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payNotes, setPayNotes] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [bookingsData, providersData, paymentsData] = await Promise.all([
        getBookings(),
        getProviders(),
        getProviderPayments()
      ]);
      setBookings(bookingsData);
      setProviders(providersData);
      setPayments(paymentsData);

      // Auto-seleccionar primer proveedor si existe
      if (providersData.length > 0 && !selectedProviderId) {
        setSelectedProviderId(providersData[0].id);
      }
    } catch (e) {
      console.error("Error al cargar datos relacionales de proveedores:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // Inicializar fecha de abono con el día de hoy en formato YYYY-MM-DD
    setPayDate(new Date().toISOString().split('T')[0]);

    // Listener de responsividad
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- ACCIÓN: CREAR PROVEEDOR ---
  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName.trim()) return;

    setActionLoading('create-provider');
    try {
      const { data, error } = await createProvider({
        name: newProvName.trim(),
        whatsapp: newProvWhatsapp.trim(),
        pix_key: newProvPixKey.trim(),
        email: newProvEmail.trim(),
        cpfCnpj: newProvCpfCnpj.trim(),
        companyName: newProvCompanyName.trim(),
        observations: newProvObs.trim()
      });

      if (error) {
        alert("Error al registrar el nuevo proveedor.");
      } else if (data) {
        setProviders(prev => [...prev, data]);
        setSelectedProviderId(data.id);
        setShowCreateDrawer(false);
        // Limpiar inputs
        setNewProvName('');
        setNewProvWhatsapp('');
        setNewProvPixKey('');
        setNewProvEmail('');
        setNewProvCpfCnpj('');
        setNewProvCompanyName('');
        setNewProvObs('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // --- ACCIÓN: REGISTRAR ABONO PARCIAL ---
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId || !payAmount || Number(payAmount) <= 0) return;

    setActionLoading('add-payment');
    try {
      const amountNum = Number(payAmount);
      const { data, error } = await addProviderPayment({
        provider_id: selectedProviderId,
        amount_paid: amountNum,
        payment_date: payDate,
        notes: payNotes.trim() || 'Abono parcial manual'
      });

      if (error) {
        alert("Error al registrar el pago.");
      } else if (data) {
        setPayments(prev => [data, ...prev]);
        setPayAmount('');
        setPayNotes('');
        alert(`¡Abono de R$ ${amountNum.toLocaleString('es-ES', { minimumFractionDigits: 2 })} registrado correctamente!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // --- EXTRACCIÓN DE TOURS/EXPERIENCIAS ÚNICAS ---
  const uniqueTours = React.useMemo(() => {
    const titles = bookings
      .filter(b => b.paymentStatus !== 'CANCELLED' && b.tourTitle)
      .map(b => b.tourTitle);
    return Array.from(new Set(titles)).sort();
  }, [bookings]);

  // --- MATEMÁTICA Y AGRUPACIÓN DE PROVEEDORES ---
  const providersSummary = React.useMemo(() => {
    return providers.map(p => {
      // Filtrar salidas/bookings asociadas a este proveedor por coincidencia de nombre y por tour
      const associatedBookings = bookings.filter(b => 
        b.paymentStatus !== 'CANCELLED' && 
        b.assignedGuide && 
        b.assignedGuide.toLowerCase().trim() === p.name.toLowerCase().trim() &&
        (selectedTour === 'ALL' || b.tourTitle === selectedTour)
      );

      // Total Devengado: tarifa neta guideNetCost de los tours asignados
      const totalDevengado = associatedBookings.reduce((sum, b) => sum + Number(b.guideNetCost || 0), 0);

      // Total Pagado: suma de los abonos registrados en provider_payments
      // Si se filtra por tour, los abonos son globales, así que mostramos 0 para el tour específico o el total si es ALL
      const associatedPayments = payments.filter(pay => pay.provider_id === p.id);
      const totalPagado = selectedTour === 'ALL'
        ? associatedPayments.reduce((sum, pay) => sum + Number(pay.amount_paid || 0), 0)
        : 0;

      // Saldo Pendiente: Total Devengado - Total Pagado
      const saldoPendiente = selectedTour === 'ALL'
        ? (totalDevengado - totalPagado)
        : totalDevengado;

      // Ganancia Generada para la Agencia: Suma de la diferencia de [Precio Venta Cliente - Costo Neto Guía]
      const gananciaGenerada = associatedBookings.reduce((sum, b) => {
        const venta = Number(b.total || 0);
        const guideCost = Number(b.guideNetCost || 0);
        return sum + Math.max(0, venta - guideCost);
      }, 0);

      return {
        ...p,
        totalDevengado,
        totalPagado,
        saldoPendiente,
        gananciaGenerada,
        bookingsList: associatedBookings,
        paymentsList: associatedPayments
      };
    }).sort((a, b) => b.saldoPendiente - a.saldoPendiente);
  }, [providers, bookings, payments, selectedTour]);

  // Totales Globales
  const globalDevengado = providersSummary.reduce((sum, p) => sum + p.totalDevengado, 0);
  const globalPagado = providersSummary.reduce((sum, p) => sum + p.totalPagado, 0);
  const globalPendiente = providersSummary.reduce((sum, p) => sum + p.saldoPendiente, 0);
  const globalGanancia = providersSummary.reduce((sum, p) => sum + p.gananciaGenerada, 0);

  const activeProvider = providersSummary.find(p => p.id === selectedProviderId);

  // Helper para mostrar fechas
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]}`;
    }
    return dateStr;
  };

  return (
    <div className="page" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Header />

      <main className="wrap-wide" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: 16 }}>
          <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--coral)', textDecoration: 'none', fontWeight: 600 }}>
            <Icon name="chevron-left" size={14} /> Regresar a Gestión de Catálogo y Reservas
          </Link>
        </div>

        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--coral)' }}>Control de Guías y Liquidaciones</div>
            <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 48px)', margin: 0, lineHeight: 1 }}>
              Liquidación de Proveedores
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--ink-soft)', fontSize: 15 }}>
              Seguimiento financiero en tiempo real, abonos parciales libres y margen de ganancia de la agencia.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowCreateDrawer(true)}
              className="btn btn-coral"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 13, fontWeight: 700 }}
            >
              <Icon name="plus" size={12} /> + Crear Proveedor
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="btn btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, background: 'var(--paper)' }}
            >
              <Icon name="refresh" size={14} className={loading ? 'spin-animation' : ''} />
              {loading ? 'Sincronizando...' : 'Recargar'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Procesando abonos y base de proveedores...</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* BARRA DE FILTRO POR EXPERIENCIA */}
            <div style={{
              background: 'var(--paper)',
              padding: '16px 20px',
              borderRadius: 20,
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🔍</span>
                <strong style={{ fontSize: 13, color: 'var(--ink)' }}>Filtrar Finanzas por Experiencia:</strong>
              </div>
              <select
                value={selectedTour}
                onChange={e => setSelectedTour(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--line-soft)',
                  background: 'var(--cream)',
                  color: 'var(--ink)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  flex: 1,
                  minWidth: 240,
                  fontWeight: 600
                }}
              >
                <option value="ALL">✨ Mostrar todos los tours (General)</option>
                {uniqueTours.map(title => (
                  <option key={title} value={title}>⛵ {title}</option>
                ))}
              </select>
              {selectedTour !== 'ALL' && (
                <button
                  onClick={() => setSelectedTour('ALL')}
                  className="btn btn-ghost"
                  style={{ padding: '8px 14px', fontSize: 11, background: 'var(--cream-soft)', height: 'auto' }}
                >
                  Limpiar filtro
                </button>
              )}
            </div>
            
            {/* GRID DE KPIs FINANCIEROS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20
            }}>
              <div style={{ background: 'var(--paper)', padding: 20, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🛡️ Devengado Total
                </div>
                <div className="display" style={{ fontSize: 32, fontWeight: 700, margin: '10px 0 4px', color: 'var(--ink)' }}>
                  R$ {globalDevengado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Suma neta de tarifas de guías.</div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 64, opacity: 0.03, pointerEvents: 'none' }}>💼</div>
              </div>

              <div style={{ background: 'var(--paper)', padding: 20, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🟢 Total Pagado
                </div>
                <div className="display" style={{ fontSize: 32, fontWeight: 700, margin: '10px 0 4px', color: 'var(--moss)' }}>
                  R$ {globalPagado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Suma de abonos parciales registrados.</div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 64, opacity: 0.03, pointerEvents: 'none' }}>✅</div>
              </div>

              <div style={{ background: 'var(--paper)', padding: 20, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ⏳ Saldo Pendiente Global
                </div>
                <div className="display" style={{ fontSize: 32, fontWeight: 700, margin: '10px 0 4px', color: globalPendiente > 0 ? 'var(--coral)' : 'var(--moss)' }}>
                  R$ {globalPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Deuda acumulada por liquidar.</div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 64, opacity: 0.03, pointerEvents: 'none' }}>⏳</div>
              </div>

              <div style={{ background: 'var(--paper)', padding: 20, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  💎 Utilidad Generada Agencia
                </div>
                <div className="display" style={{ fontSize: 32, fontWeight: 700, margin: '10px 0 4px', color: 'var(--moss)' }}>
                  R$ {globalGanancia.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Margen de ganancia [Venta - Guía].</div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 64, opacity: 0.03, pointerEvents: 'none' }}>💎</div>
              </div>
            </div>

            {/* SECCIÓN PRINCIPAL: LISTADO Y FORMULARIO */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 24,
              alignItems: 'start'
            }}>
              
              {/* COLUMNA IZQUIERDA: LISTADO DE PROVEEDORES */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: '0 0 16px', textAlign: 'left' }}>
                  Catálogo de Proveedores
                </h2>
                
                {isMobile ? (
                  // MOBILE VIEW: TARJETAS VERTICALES DE ALTA DENSIDAD
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {providersSummary.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>No hay proveedores registrados.</div>
                    ) : (
                      providersSummary.map(g => (
                        <div 
                          key={g.id} 
                          onClick={() => setSelectedProviderId(g.id)}
                          style={{
                            border: `1px solid ${selectedProviderId === g.id ? 'var(--coral)' : 'var(--line-soft)'}`,
                            borderRadius: 14,
                            padding: 16,
                            background: selectedProviderId === g.id ? 'var(--cream-soft)' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: 16 }}>👤 {g.name}</strong>
                            <Badge tone="soft">{g.bookingsList.length} Salidas</Badge>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                            <div>
                              <div style={{ color: 'var(--muted)', fontSize: 11 }}>Devengado</div>
                              <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>R$ {g.totalDevengado.toLocaleString('es-ES')}</div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--muted)', fontSize: 11 }}>Pagado</div>
                              <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>R$ {g.totalPagado.toLocaleString('es-ES')}</div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--muted)', fontSize: 11 }}>Saldo Deuda</div>
                              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: g.saldoPendiente > 0 ? 'var(--coral)' : 'var(--moss)' }}>R$ {g.saldoPendiente.toLocaleString('es-ES')}</div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--muted)', fontSize: 11 }}>Ganancia Agencia</div>
                              <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--moss)' }}>R$ {g.gananciaGenerada.toLocaleString('es-ES')}</div>
                            </div>
                          </div>

                          <div style={{ fontSize: 11, color: 'var(--muted)', borderTop: '1px dashed var(--line-soft)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <span>
                              📱 {g.whatsapp ? (
                                <a
                                  href={`https://wa.me/${g.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--moss)', textDecoration: 'none', fontWeight: 600, borderBottom: '1px dashed var(--moss)' }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  {g.whatsapp}
                                </a>
                              ) : (
                                'Sin WhatsApp'
                              )}
                            </span>
                            <span>🔑 Pix: {g.pix_key || 'Sin Pix'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // DESKTOP VIEW: TABLA GENERAL DE ALTA DENSIDAD
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--line)', fontSize: 12, color: 'var(--muted)' }}>
                          <th style={{ padding: '10px 8px', fontWeight: 600 }}>Nombre</th>
                          <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Salidas</th>
                          <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Devengado</th>
                          <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Pagado</th>
                          <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Deuda</th>
                          <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Agencia</th>
                          <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {providersSummary.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>
                              No hay proveedores registrados.
                            </td>
                          </tr>
                        ) : (
                          providersSummary.map(g => (
                            <tr key={g.id} style={{ 
                              borderBottom: '1px solid var(--line-soft)', 
                              background: selectedProviderId === g.id ? 'var(--cream-soft)' : 'transparent',
                              transition: 'background 0.2s ease',
                              fontSize: 13
                            }}>
                              <td style={{ padding: '12px 8px' }}>
                                <div style={{ fontWeight: 700 }}>👤 {g.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                  {g.whatsapp ? (
                                    <a
                                      href={`https://wa.me/${g.whatsapp.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: 'var(--moss)', textDecoration: 'none', fontWeight: 600, borderBottom: '1px dashed var(--moss)' }}
                                      onClick={e => e.stopPropagation()}
                                    >
                                      📱 {g.whatsapp}
                                    </a>
                                  ) : (
                                    <span>📱 Sin WhatsApp</span>
                                  )}
                                  <span>|</span>
                                  <span>🔑 Pix: <strong style={{ color: 'var(--ink)' }}>{g.pix_key || 'Sin Pix'}</strong></span>
                                </div>
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                <Badge tone="soft">{g.bookingsList.length}</Badge>
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                R$ {g.totalDevengado.toLocaleString('es-ES')}
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                R$ {g.totalPagado.toLocaleString('es-ES')}
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: g.saldoPendiente > 0 ? 'var(--coral)' : 'var(--moss)' }}>
                                R$ {g.saldoPendiente.toLocaleString('es-ES')}
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--moss)', fontWeight: 500 }}>
                                R$ {g.gananciaGenerada.toLocaleString('es-ES')}
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                <button
                                  onClick={() => setSelectedProviderId(g.id)}
                                  className="btn btn-ghost"
                                  style={{ padding: '4px 10px', fontSize: 11, height: 'auto', border: selectedProviderId === g.id ? '1px solid var(--coral)' : 'none' }}
                                >
                                  Detalle
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* COLUMNA DERECHA: DESGLOSE, HISTORIAL Y FORMULARIO DE ABONOS */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)' }}>
                {activeProvider ? (
                  <div style={{ textAlign: 'left' }}>
                    {/* Header del Proveedor */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line-soft)', paddingBottom: 12, marginBottom: 20 }}>
                      <div>
                        <div className="eyebrow" style={{ color: 'var(--coral)' }}>Ficha de Proveedor</div>
                        <h2 className="display" style={{ fontSize: 24, margin: '4px 0 0' }}>👤 {activeProvider.name}</h2>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Saldo Deuda</span>
                        <strong style={{ fontSize: 22, color: activeProvider.saldoPendiente > 0 ? 'var(--coral)' : 'var(--moss)', fontFamily: 'var(--font-mono)' }}>
                          R$ {activeProvider.saldoPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>

                    {/* Ficha Técnica */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, background: 'var(--cream-soft)', padding: 14, borderRadius: 14, marginBottom: 24, fontSize: 13 }}>
                      <div>📱 <strong>WhatsApp:</strong> <span style={{ color: 'var(--ink-soft)' }}>{activeProvider.whatsapp || 'Sin WhatsApp'}</span></div>
                      <div>🔑 <strong>Llave Pix:</strong> <span style={{ color: 'var(--ink-soft)' }}>{activeProvider.pix_key || 'Sin Pix'}</span></div>
                      <div>🆔 <strong>CPF / CNPJ:</strong> <span style={{ color: 'var(--ink-soft)' }}>{activeProvider.cpfCnpj || 'No registrado'}</span></div>
                      {activeProvider.companyName && (
                        <div style={{ gridColumn: '1 / -1' }}>🏢 <strong>Razón Social:</strong> <span style={{ color: 'var(--ink-soft)' }}>{activeProvider.companyName}</span></div>
                      )}
                      <div style={{ gridColumn: '1 / -1' }}>📧 <strong>Email:</strong> <span style={{ color: 'var(--ink-soft)' }}>{activeProvider.email || 'Sin Email'}</span></div>
                      {activeProvider.observations && (
                        <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--line)', paddingTop: 8, marginTop: 4 }}>
                          📝 <strong>Notas:</strong> <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{activeProvider.observations}</span>
                        </div>
                      )}
                    </div>

                    {/* FORMULARIO: REGISTRAR PAGO A PROVEEDOR */}
                    <div style={{ border: '1px solid var(--line-soft)', borderRadius: 16, padding: 18, background: 'rgba(255, 106, 77, 0.01)', marginBottom: 28 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
                        💸 Registrar Pago a Proveedor
                      </h3>
                      
                      <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>Monto del Abono (R$)</span>
                            <input 
                              type="number" 
                              required
                              step="0.01"
                              min="0.01"
                              placeholder="0.00"
                              value={payAmount}
                              onChange={e => setPayAmount(e.target.value)}
                              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, fontFamily: 'var(--font-mono)', background: 'var(--paper)' }}
                            />
                          </label>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>Fecha del Depósito</span>
                            <input 
                              type="date" 
                              required
                              value={payDate}
                              onChange={e => setPayDate(e.target.value)}
                              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, fontFamily: 'inherit', background: 'var(--paper)', cursor: 'pointer' }}
                            />
                          </label>
                        </div>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700 }}>Notas / Concepto del depósito</span>
                          <input 
                            type="text" 
                            placeholder="Transferencia Pix banco Itaú, etc..."
                            value={payNotes}
                            onChange={e => setPayNotes(e.target.value)}
                            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--paper)' }}
                          />
                        </label>

                        <button 
                          type="submit" 
                          disabled={actionLoading === 'add-payment'}
                          className="btn btn-coral btn-lg"
                          style={{ width: '100%', border: 'none', marginTop: 4 }}
                        >
                          {actionLoading === 'add-payment' ? 'Registrando...' : 'Confirmar Abono R$'}
                        </button>
                      </form>
                    </div>

                    {/* PESTAÑAS DETALLE: ABONOS / SALIDAS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                      <div style={{ borderBottom: '2px solid var(--ink)', paddingBottom: 8, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>
                        Historial de Abonos ({activeProvider.paymentsList.length})
                      </div>
                      <div style={{ borderBottom: '2px solid var(--line-soft)', paddingBottom: 8, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                        Salidas Asignadas ({activeProvider.bookingsList.length})
                      </div>
                    </div>

                    {/* LISTA: HISTORIAL DE ABONOS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                      {activeProvider.paymentsList.length === 0 ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                          No hay abonos registrados para este proveedor.
                        </div>
                      ) : (
                        activeProvider.paymentsList.map(pay => (
                          <div key={pay.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, border: '1px solid var(--line-soft)', background: 'var(--cream-soft)', fontSize: 13 }}>
                            <div>
                              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--moss)' }}>R$ {pay.amount_paid.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</strong>
                              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>📅 {formatDateDisplay(pay.payment_date)} · {pay.notes}</div>
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#{pay.id.split('-')[1] || pay.id}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* LISTA: SALIDAS ASOCIADAS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--line-soft)', paddingTop: 20, marginTop: 20 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px' }}>Salidas y Costos Devengados</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                        {activeProvider.bookingsList.length === 0 ? (
                          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                            No hay salidas asociadas a este guía.
                          </div>
                        ) : (
                          activeProvider.bookingsList.map(b => (
                            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 12, borderRadius: 10, border: '1px solid var(--line-soft)', fontSize: 13 }}>
                              <div>
                                <strong style={{ color: 'var(--ink)' }}>{b.tourTitle}</strong>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>📅 {formatDateDisplay(b.date)} · Pasajero: {b.name} {b.lastname}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>R$ {b.guideNetCost}</div>
                                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Costo neto</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                    Selecciona un proveedor de la lista para ver su ficha técnica, historial de abonos y salidas asignadas.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </main>

      {/* SLIDE-OVER DRAWER: CREAR PROVEEDOR */}
      {showCreateDrawer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(14, 27, 44, 0.4)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.3s ease'
        }} onClick={() => setShowCreateDrawer(false)}>
          
          <div style={{
            width: '100%',
            maxWidth: 460,
            background: 'var(--paper)',
            height: '100vh',
            boxShadow: 'var(--shadow-lg)',
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto',
            animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--coral)' }}>Crear Proveedor</div>
                <h3 className="display" style={{ fontSize: 24, margin: '4px 0 0' }}>+ Nuevo Guía</h3>
              </div>
              <button
                onClick={() => setShowCreateDrawer(false)}
                style={{ background: 'var(--cream-soft)', border: 'none', padding: 8, borderRadius: 999, cursor: 'pointer', display: 'flex' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProvider} style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Nombre completo del Guía</span>
                <input
                  type="text"
                  required
                  placeholder="ej: Agustina Castillo"
                  value={newProvName}
                  onChange={e => setNewProvName(e.target.value)}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14, background: 'var(--cream-soft)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Número de WhatsApp</span>
                <input
                  type="text"
                  placeholder="ej: +55 48 99999-1111"
                  value={newProvWhatsapp}
                  onChange={e => setNewProvWhatsapp(e.target.value)}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14, background: 'var(--cream-soft)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Llave Pix (Llave CPF, email, cel, etc)</span>
                <input
                  type="text"
                  placeholder="ej: agustina@pix.br"
                  value={newProvPixKey}
                  onChange={e => setNewProvPixKey(e.target.value)}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14, background: 'var(--cream-soft)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Correo electrónico (Email)</span>
                <input
                  type="email"
                  placeholder="ej: agustina@boraflo.com"
                  value={newProvEmail}
                  onChange={e => setNewProvEmail(e.target.value)}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14, background: 'var(--cream-soft)' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>CPF o CNPJ</span>
                  <input
                    type="text"
                    placeholder="ej: 123.456.789-00"
                    value={newProvCpfCnpj}
                    onChange={e => setNewProvCpfCnpj(e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14, background: 'var(--cream-soft)' }}
                  />
                </label>
                
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Razón Social (Empresa)</span>
                  <input
                    type="text"
                    placeholder="ej: Claudia Ecoturismo Ltda"
                    value={newProvCompanyName}
                    onChange={e => setNewProvCompanyName(e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14, background: 'var(--cream-soft)' }}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Observaciones / Notas internas</span>
                <textarea
                  rows={4}
                  placeholder="ej: Guía preferencial para paseos en barco en Costa da Lagoa, bilingüe."
                  value={newProvObs}
                  onChange={e => setNewProvObs(e.target.value)}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontSize: 14, background: 'var(--cream-soft)', resize: 'vertical' }}
                />
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 20, borderTop: '1px dashed var(--line)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateDrawer(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create-provider'}
                  className="btn btn-coral"
                  style={{ flex: 2, padding: '12px', border: 'none' }}
                >
                  {actionLoading === 'create-provider' ? 'Registrando...' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
