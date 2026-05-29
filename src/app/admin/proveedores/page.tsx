"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBookings, updateBookingDetails, addBookingLog } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';

export default function ProveedoresDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Guía seleccionado para desglose
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  
  // Estados para el formulario de pago
  const [payBookingId, setPayBookingId] = useState<string | null>(null);
  const [depositDate, setDepositDate] = useState<string>('');

  async function loadData() {
    setLoading(true);
    try {
      const bookingsData = await getBookings();
      setBookings(bookingsData);
      
      // Auto-seleccionar primer guía si hay datos y ninguno seleccionado
      if (bookingsData.length > 0 && !selectedGuide) {
        const uniqueGuides = Array.from(new Set(bookingsData.map(b => b.assignedGuide || 'Sin asignar')));
        if (uniqueGuides.length > 0) {
          setSelectedGuide(uniqueGuides[0]);
        }
      }
    } catch (e) {
      console.error("Error al cargar datos de proveedores:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // Inicializar fecha de depósito con el día de hoy
    setDepositDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Helpers de Formateo de Fechas
  const parseBookingDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const clean = dateStr.toLowerCase().replace(/[^a-z0-9áéíóúüñ\s-]/g, '').trim();
    const parts = clean.split(/\s+/);
    let day = 1;
    let monthIdx = 4;
    let year = 2026;
    
    for (const part of parts) {
      const mIdx = months.findIndex(m => m.startsWith(part.substring(0, 3)));
      if (mIdx !== -1) monthIdx = mIdx;
      const dNum = parseInt(part, 10);
      if (!isNaN(dNum) && dNum > 0 && dNum <= 31) day = dNum;
    }
    return new Date(year, monthIdx, day);
  };

  const formatBookingDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return `${day} ${months[monthIdx]}`;
    }
    return dateStr;
  };

  // --- AGRUPACIÓN Y CÁLCULOS EN CALIENTE POR GUÍA ---
  const guidesSummary = React.useMemo(() => {
    const summary: Record<string, {
      guideName: string;
      salidasCount: number;
      totalDevengado: number;
      totalPagado: number;
      totalPendiente: number;
      bookingsList: any[];
    }> = {};

    bookings.forEach(b => {
      // Ignorar cancelados si no devengan costo
      if (b.paymentStatus === 'CANCELLED') return;
      
      const guide = b.assignedGuide || 'Sin asignar';
      const cost = Number(b.guideNetCost || 0);
      const isPaid = b.providerPaymentStatus === 'PAID';

      if (!summary[guide]) {
        summary[guide] = {
          guideName: guide,
          salidasCount: 0,
          totalDevengado: 0,
          totalPagado: 0,
          totalPendiente: 0,
          bookingsList: []
        };
      }

      summary[guide].salidasCount += 1;
      summary[guide].totalDevengado += cost;
      if (isPaid) {
        summary[guide].totalPagado += cost;
      } else {
        summary[guide].totalPendiente += cost;
      }
      summary[guide].bookingsList.push(b);
    });

    return Object.values(summary).sort((a, b) => b.totalPendiente - a.totalPendiente);
  }, [bookings]);

  // --- TOTALES GLOBAL DE PROVEEDORES ---
  const globalDevengado = guidesSummary.reduce((sum, g) => sum + g.totalDevengado, 0);
  const globalPagado = guidesSummary.reduce((sum, g) => sum + g.totalPagado, 0);
  const globalPendiente = guidesSummary.reduce((sum, g) => sum + g.totalPendiente, 0);

  // --- ACCIÓN: REGISTRAR LIQUIDACIÓN / PAGO ---
  const handleRegisterPayment = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const updates = {
        providerPaymentStatus: 'PAID',
        providerPaymentDate: depositDate
      };
      const { error } = await updateBookingDetails(bookingId, updates);
      if (error) {
        alert("Error al registrar el depósito al proveedor.");
      } else {
        // Actualizar estado local reactivo
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updates } : b));
        setPayBookingId(null);
        
        await addBookingLog({
          bookingId,
          comment: `Liquidación registrada para el guía. Depósito el día ${formatBookingDateForDisplay(depositDate)}.`,
          author: 'Sistema'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  // --- ACCIÓN: REVERSAR PAGO AL PROVEEDOR ---
  const handleRevertPayment = async (bookingId: string) => {
    if (!confirm("¿Seguro que deseas marcar este pago como PENDIENTE de liquidación?")) return;
    setActionLoading(bookingId);
    try {
      const updates = {
        providerPaymentStatus: 'PENDING',
        providerPaymentDate: ''
      };
      const { error } = await updateBookingDetails(bookingId, updates);
      if (error) {
        alert("Error al reversar el pago.");
      } else {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updates } : b));
        
        await addBookingLog({
          bookingId,
          comment: `Liquidación revertida por el administrador. Estado de pago del guía: PENDIENTE.`,
          author: 'Sistema'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const selectedGuideData = guidesSummary.find(g => g.guideName === selectedGuide);

  return (
    <div className="page" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Header />

      <main className="wrap-wide" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* Enlace de regreso al Dashboard */}
        <div style={{ marginBottom: 16 }}>
          <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--coral)', textDecoration: 'none', fontWeight: 600 }}>
            <Icon name="chevron-left" size={14} /> Regresar a Gestión de Tours y Reservas
          </Link>
        </div>

        {/* Encabezado Principal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--coral)' }}>Control de Liquidaciones y Guías</div>
            <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 48px)', margin: 0, lineHeight: 1 }}>
              Liquidación de Proveedores
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--ink-soft)', fontSize: 15 }}>
              Seguimiento financiero acumulado por guía y auditoría de depósitos bancarios.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="btn btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, background: 'var(--paper)' }}
          >
            <Icon name="refresh" size={14} className={loading ? 'spin-animation' : ''} />
            {loading ? 'Recargando...' : 'Actualizar Datos'}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Calculando liquidaciones y salidas de guías...</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* GRID DE KPIs FINANCIEROS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20
            }}>
              {/* Devengado Global */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🛡️</span> Total Devengado Proveedores
                </div>
                <div className="display" style={{ fontSize: 36, fontWeight: 700, margin: '14px 0 6px', color: 'var(--ink)' }}>
                  R$ {globalDevengado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  Suma total de costos de guías de todas las salidas registradas.
                </div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.04, pointerEvents: 'none' }}>💼</div>
              </div>

              {/* Pagado Global */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🟢</span> Total Liquidado (Ya Pagado)
                </div>
                <div className="display" style={{ fontSize: 36, fontWeight: 700, margin: '14px 0 6px', color: 'var(--moss)' }}>
                  R$ {globalPagado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  Monto total ya depositado a los guías.
                </div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.04, pointerEvents: 'none' }}>✅</div>
              </div>

              {/* Pendiente Global */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>⏳</span> Saldo Activo Pendiente
                </div>
                <div className="display" style={{ fontSize: 36, fontWeight: 700, margin: '14px 0 6px', color: globalPendiente > 0 ? 'var(--coral)' : 'var(--moss)' }}>
                  R$ {globalPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  Monto acumulado pendiente por depositar y liquidar.
                </div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.04, pointerEvents: 'none' }}>⏳</div>
              </div>
            </div>

            {/* SECCIÓN PRINCIPAL EN 2 COLUMNAS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 24
            }}>
              
              {/* COLUMNA IZQUIERDA: TABLA DE GUÍAS */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)', height: 'fit-content' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: '0 0 16px', textAlign: 'left' }}>
                  Liquidación por Proveedor
                </h2>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--line)', fontSize: 12, color: 'var(--muted)' }}>
                        <th style={{ padding: '10px 8px', fontWeight: 600 }}>Guía Asignado</th>
                        <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Salidas</th>
                        <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Devengado</th>
                        <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Saldo Deuda</th>
                        <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guidesSummary.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>
                            No hay salidas registradas con costo de guía.
                          </td>
                        </tr>
                      ) : (
                        guidesSummary.map(g => (
                          <tr key={g.guideName} style={{ 
                            borderBottom: '1px solid var(--line-soft)', 
                            background: selectedGuide === g.guideName ? 'var(--cream-soft)' : 'transparent',
                            transition: 'background 0.2s ease'
                          }}>
                            <td style={{ padding: '14px 8px', fontWeight: 700 }}>
                              👤 {g.guideName}
                            </td>
                            <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                              <Badge tone="soft">{g.salidasCount}</Badge>
                            </td>
                            <td style={{ padding: '14px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                              R$ {g.totalDevengado}
                            </td>
                            <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: g.totalPendiente > 0 ? 'var(--coral)' : 'var(--moss)' }}>
                              R$ {g.totalPendiente}
                            </td>
                            <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                              <button
                                onClick={() => setSelectedGuide(g.guideName)}
                                className="btn btn-ghost"
                                style={{ padding: '6px 12px', fontSize: 12, height: 'auto', border: selectedGuide === g.guideName ? '1px solid var(--coral)' : 'none' }}
                              >
                                Ver Detalle
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* COLUMNA DERECHA: DESGLOSE Y ACCIONES */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)' }}>
                {selectedGuideData ? (
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line-soft)', paddingBottom: 12, marginBottom: 20 }}>
                      <div>
                        <div className="eyebrow" style={{ color: 'var(--coral)' }}>Desglose Operativo</div>
                        <h2 className="display" style={{ fontSize: 24, margin: '4px 0 0' }}>👤 {selectedGuideData.guideName}</h2>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Saldo Deuda</span>
                        <strong style={{ fontSize: 20, color: selectedGuideData.totalPendiente > 0 ? 'var(--coral)' : 'var(--moss)', fontFamily: 'var(--font-mono)' }}>
                          R$ {selectedGuideData.totalPendiente}
                        </strong>
                      </div>
                    </div>

                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Listado de Salidas y Estado de Pago</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {selectedGuideData.bookingsList.map(b => {
                        const isPaid = b.providerPaymentStatus === 'PAID';
                        const showForm = payBookingId === b.id;

                        return (
                          <div key={b.id} style={{ 
                            border: '1px solid var(--line-soft)', 
                            borderRadius: 14, 
                            padding: 16, 
                            background: isPaid ? 'rgba(46, 125, 50, 0.02)' : 'rgba(211, 47, 47, 0.01)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                          }}>
                            {/* Información de la Salida */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                              <div>
                                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Código: {b.id}</div>
                                <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{b.tourTitle}</strong>
                                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4, display: 'flex', gap: 10 }}>
                                  <span>📅 {formatBookingDateForDisplay(b.date)}</span>
                                  <span>⏱️ {b.slot}</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                                  Pasajero: <strong>{b.name} {b.lastname}</strong> {b.whatsappNickname && `(${b.whatsappNickname})`}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Costo Neto Guía</div>
                                <strong style={{ fontSize: 16, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>R$ {b.guideNetCost}</strong>
                              </div>
                            </div>

                            {/* Fila de Estado y Botones Táctiles */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--line-soft)', paddingTop: 10, marginTop: 4, flexWrap: 'wrap', gap: 10 }}>
                              <div>
                                <Badge tone={isPaid ? 'moss' : 'sun'}>
                                  {isPaid ? 'Liquidado' : 'Pendiente de Pago'}
                                </Badge>
                                {isPaid && b.providerPaymentDate && (
                                  <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
                                    Depósito: {formatBookingDateForDisplay(b.providerPaymentDate)}
                                  </span>
                                )}
                              </div>

                              <div>
                                {!isPaid ? (
                                  !showForm ? (
                                    <button 
                                      onClick={() => setPayBookingId(b.id)}
                                      className="btn btn-coral" 
                                      style={{ padding: '6px 14px', fontSize: 12, height: 'auto', border: 'none', cursor: 'pointer' }}
                                    >
                                      💸 Registrar Pago
                                    </button>
                                  ) : null
                                ) : (
                                  <button
                                    onClick={() => handleRevertPayment(b.id)}
                                    disabled={actionLoading === b.id}
                                    className="btn btn-ghost"
                                    style={{ padding: '6px 14px', fontSize: 12, height: 'auto', color: 'var(--coral)', border: '1px solid rgba(211,47,47,0.2)' }}
                                  >
                                    ↩️ Reversar Pago
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Formulario de Pago Táctil Integrado */}
                            {showForm && (
                              <div style={{ 
                                background: 'var(--cream-soft)', 
                                padding: 14, 
                                borderRadius: 10, 
                                border: '1px solid var(--line-soft)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                                animation: 'fadeIn 0.2s ease'
                              }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700 }}>Fecha del Depósito Bancario</span>
                                  <input 
                                    type="date" 
                                    value={depositDate} 
                                    onChange={e => setDepositDate(e.target.value)} 
                                    style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--paper)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}
                                  />
                                </label>

                                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                  <button
                                    type="button"
                                    onClick={() => setPayBookingId(null)}
                                    className="btn btn-ghost"
                                    style={{ flex: 1, padding: 8, fontSize: 12, height: 'auto', border: 'none' }}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRegisterPayment(b.id)}
                                    disabled={actionLoading === b.id}
                                    className="btn btn-coral"
                                    style={{ flex: 2, padding: 8, fontSize: 12, height: 'auto', border: 'none', cursor: 'pointer' }}
                                  >
                                    {actionLoading === b.id ? 'Registrando...' : 'Confirmar Depósito R$'}
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                    Selecciona un guía de la lista para ver su desglose detallado de salidas y pagos.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
