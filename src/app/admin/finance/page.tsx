"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBookings, getBookingPayments } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';

type PeriodType = 'today' | 'yesterday' | '7days' | 'month';

export default function FinanceDashboard() {
  const [period, setPeriod] = useState<PeriodType>('7days');
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFinanceData() {
    setLoading(true);
    try {
      const [bookingsData, paymentsData] = await Promise.all([
        getBookings(),
        getBookingPayments()
      ]);
      setBookings(bookingsData);
      setPayments(paymentsData);
    } catch (e) {
      console.error("Error al cargar datos financieros:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinanceData();
  }, []);

  // Helper para verificar si una fecha cae en el período seleccionado
  const isDateInPeriod = (dateStr: string, selectedPeriod: PeriodType): boolean => {
    const date = new Date(dateStr);
    const now = new Date();
    
    // Configurar horas a 0 para comparar fechas puras
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    const sevenDaysAgoStart = new Date(todayStart);
    sevenDaysAgoStart.setDate(sevenDaysAgoStart.getDate() - 7);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const compareTime = date.getTime();
    
    if (selectedPeriod === 'today') {
      return compareTime >= todayStart.getTime();
    } else if (selectedPeriod === 'yesterday') {
      return compareTime >= yesterdayStart.getTime() && compareTime < todayStart.getTime();
    } else if (selectedPeriod === '7days') {
      return compareTime >= sevenDaysAgoStart.getTime();
    } else if (selectedPeriod === 'month') {
      return compareTime >= monthStart.getTime();
    }
    return false;
  };

  // Filtrar abonos y reservas según el período seleccionado
  const filteredPayments = payments.filter(p => isDateInPeriod(p.createdAt, period));
  const filteredBookings = bookings.filter(b => isDateInPeriod(b.createdAt || b.date, period));

  // --- CÁLCULO DE KPIs OPERATIVOS ---

  // 1. Ingresos Totales en Reales (BRL)
  const totalRevenueBrl = filteredPayments.reduce((sum, p) => sum + p.amountBrl, 0);

  // 2. Transacciones por Moneda
  const currencyBreakdown = filteredPayments.reduce((acc: any, p) => {
    acc[p.currency] = (acc[p.currency] || 0) + p.amount;
    return acc;
  }, {});

  // 3. Saldo Pendiente
  // Para las reservas del período, sumamos el saldo pendiente
  const totalPendingBalance = filteredBookings.reduce((sum, b) => {
    const paidForBooking = payments
      .filter(p => p.bookingId === b.id)
      .reduce((s, p) => s + p.amountBrl, 0);
    const pending = Math.max(0, b.total - paidForBooking);
    return sum + pending;
  }, 0);

  // 4. Conteo de Reservas
  const totalBookingsCount = filteredBookings.length;

  // 5. Ingresos por Método de Pago
  const methodRevenue = filteredPayments.reduce((acc: any, p) => {
    const method = p.paymentMethod || 'other';
    acc[method] = (acc[method] || 0) + p.amountBrl;
    return acc;
  }, {});

  const totalPaidMethods = Object.values(methodRevenue).reduce((a: any, b: any) => a + b, 0) as number;

  // 6. Costo Total de Proveedores (Guías)
  const totalGuideCosts = filteredBookings.reduce((sum, b) => sum + Number(b.guideNetCost || 0), 0);

  // 7. Margen de Ganancia Neto
  const netProfitMargin = totalRevenueBrl - totalGuideCosts;

  return (
    <div className="page" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Header />

      <main className="wrap-wide" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* Enlace de regreso al dashboard */}
        <div style={{ marginBottom: 16 }}>
          <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--coral)', textDecoration: 'none', fontWeight: 600 }}>
            <Icon name="chevron-left" size={14} /> Regresar a Gestión de Tours y Reservas
          </Link>
        </div>

        {/* Encabezado Principal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--coral)' }}>Auditoría y Rendimiento Financiero</div>
            <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 48px)', margin: 0, lineHeight: 1 }}>
              Dashboard de Finanzas
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--ink-soft)', fontSize: 15 }}>
              Visualización agregada de caja, abonos recibidos y saldos por cobrar.
            </p>
          </div>

          <button
            onClick={loadFinanceData}
            disabled={loading}
            className="btn btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, background: 'var(--paper)' }}
          >
            <Icon name="refresh" size={14} className={loading ? 'spin-animation' : ''} />
            {loading ? 'Recargando...' : 'Actualizar Datos'}
          </button>
        </div>

        {/* Selector de Período Premium */}
        <div style={{
          display: 'flex',
          gap: 6,
          background: 'var(--paper)',
          padding: 6,
          borderRadius: 14,
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 32,
          maxWidth: 420
        }}>
          {(['today', 'yesterday', '7days', 'month'] as PeriodType[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                background: period === p ? 'var(--cream)' : 'transparent',
                color: 'var(--ink)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                textTransform: 'capitalize'
              }}
            >
              {p === 'today' ? 'Hoy' : p === 'yesterday' ? 'Ayer' : p === '7days' ? '7 días' : 'Mes'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Agregando métricas y abonos...</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* GRID DE TARJETAS DE KPI PREMIUM */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 20
            }}>
              
              {/* Tarjeta 1: Ingreso en Reales */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>📈</span> Ingresos Recibidos (Caja BRL)
                </div>
                <div className="display" style={{ fontSize: 36, fontWeight: 700, margin: '14px 0 6px', color: 'var(--moss)' }}>
                  R$ {totalRevenueBrl.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  Monto total abonado en Reales en este período.
                </div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.04, pointerEvents: 'none' }}>💰</div>
              </div>

              {/* Tarjeta 2: Reservas Registradas */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🗓️</span> Reservas Creadas
                </div>
                <div className="display" style={{ fontSize: 36, fontWeight: 700, margin: '14px 0 6px' }}>
                  {totalBookingsCount}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  Reservas ingresadas al catálogo en este período.
                </div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.04, pointerEvents: 'none' }}>⛵</div>
              </div>

              {/* Tarjeta 3: Saldo por Cobrar */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>📉</span> Saldos Pendientes (Por cobrar)
                </div>
                <div className="display" style={{ fontSize: 36, fontWeight: 700, margin: '14px 0 6px', color: 'var(--coral)' }}>
                  R$ {totalPendingBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  Saldo pendiente por cobrar de las reservas de este período.
                </div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.04, pointerEvents: 'none' }}>⏳</div>
              </div>

              {/* Tarjeta 4: Resumen Multimoneda */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🌍</span> Caja Multimoneda Recibida
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>BRL (Reales):</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>R$ {(currencyBreakdown['BRL'] || 0).toLocaleString('es')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>USD (Dólares):</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>$ {(currencyBreakdown['USD'] || 0).toLocaleString('es')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>ARS (Pesos):</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>$ {(currencyBreakdown['ARS'] || 0).toLocaleString('es')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>EUR (Euros):</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>€ {(currencyBreakdown['EUR'] || 0).toLocaleString('es')}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta 5: Costo de Proveedores */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>👤</span> Costo de Proveedores (Guías BRL)
                </div>
                <div className="display" style={{ fontSize: 36, fontWeight: 700, margin: '14px 0 6px', color: 'var(--coral)' }}>
                  R$ {totalGuideCosts.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  Costo neto total asignado a los guías en este período.
                </div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.04, pointerEvents: 'none' }}>🛡️</div>
              </div>

              {/* Tarjeta 6: Margen de Ganancia Neto */}
              <div style={{ background: 'var(--paper)', padding: 24, borderRadius: 20, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>💎</span> Margen de Ganancia Neto
                </div>
                <div className="display" style={{ fontSize: 36, fontWeight: 700, margin: '14px 0 6px', color: netProfitMargin >= 0 ? 'var(--moss)' : 'var(--coral)' }}>
                  R$ {netProfitMargin.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  Liquidez real de caja restando el costo de guías a los ingresos.
                </div>
                <div style={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, opacity: 0.04, pointerEvents: 'none' }}>📊</div>
              </div>

            </div>

            {/* SECCIÓN INTERMEDIA: RENDIMIENTO POR MÉTODO Y TENDENCIAS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24
            }}>
              
              {/* Gráfico Horizontal de Métodos de Pago */}
              <div style={{ background: 'var(--paper)', padding: 28, borderRadius: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
                  Participación de Métodos de Pago (BRL)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['pix', 'card', 'cash', 'transfer'].map(method => {
                    const rev = methodRevenue[method] || 0;
                    const pct = totalPaidMethods > 0 ? (rev / totalPaidMethods) * 100 : 0;
                    const color = method === 'pix' ? 'var(--moss)' : method === 'card' ? 'var(--coral)' : method === 'cash' ? 'var(--sun)' : 'var(--ink-soft)';
                    
                    return (
                      <div key={method} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
                          <span style={{ textTransform: 'uppercase' }}>{method === 'pix' ? 'PIX' : method === 'card' ? 'Tarjeta' : method === 'cash' ? 'Efectivo' : 'Transferencia'}</span>
                          <span>R$ {rev.toLocaleString('es')} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: 8, background: 'var(--cream)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                  {totalPaidMethods === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0', fontStyle: 'italic' }}>
                      Sin transacciones en este período.
                    </div>
                  )}
                </div>
              </div>

              {/* Estructura del Rendimiento de Reservas Cobradas */}
              <div style={{ background: 'var(--paper)', padding: 28, borderRadius: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
                  Relación de Cobros vs Saldo
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center', height: '100%', minHeight: 120 }}>
                  {(() => {
                    const totalRevenueEstimate = totalRevenueBrl + totalPendingBalance;
                    const revenuePct = totalRevenueEstimate > 0 ? (totalRevenueBrl / totalRevenueEstimate) * 100 : 0;
                    const pendingPct = totalRevenueEstimate > 0 ? (totalPendingBalance / totalRevenueEstimate) * 100 : 0;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', width: '100%', height: 32, borderRadius: 10, overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                          {totalRevenueBrl > 0 && (
                            <div style={{ width: `${revenuePct}%`, background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }} title="Ingresado">
                              {revenuePct >= 15 ? 'Ingresado' : ''}
                            </div>
                          )}
                          {totalPendingBalance > 0 && (
                            <div style={{ width: `${pendingPct}%`, background: 'var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }} title="Por cobrar">
                              {pendingPct >= 15 ? 'Por cobrar' : ''}
                            </div>
                          )}
                          {totalRevenueEstimate === 0 && (
                            <div style={{ width: '100%', background: 'var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>
                              Sin datos financieros
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--moss)' }} />
                            <span><strong>Caja Recibida:</strong> R$ {totalRevenueBrl.toLocaleString('es')} ({revenuePct.toFixed(1)}%)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--coral)' }} />
                            <span><strong>Saldo Restante:</strong> R$ {totalPendingBalance.toLocaleString('es')} ({pendingPct.toFixed(1)}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* SECCIÓN FINAL: LISTA DE TRANSACCIONES DEL PERÍODO */}
            <div style={{ background: 'var(--paper)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>
                Historial de Abonos en el Período
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--line)', fontSize: 12, color: 'var(--muted)' }}>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Fecha / Hora</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Reserva Asociada</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Monto Original</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Tasa de Cambio</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Monto Equivalente BRL</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Método</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p, idx) => {
                      const assocBooking = bookings.find(b => b.id === p.bookingId);
                      
                      return (
                        <tr key={p.id || idx} style={{ borderBottom: '1px solid var(--line-soft)', fontSize: 13 }}>
                          <td style={{ padding: '12px 8px' }}>
                            {new Date(p.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            {assocBooking ? (
                              <div>
                                <strong style={{ color: 'var(--ink)' }}>{assocBooking.name} {assocBooking.lastname}</strong>
                                <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>{assocBooking.tourTitle.split(':')[0]} ({assocBooking.date})</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--muted)' }}>Reserva #{p.bookingId.substring(0, 8)}...</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {p.currency} {p.amount.toLocaleString('es')}
                          </td>
                          <td style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                            {p.currency === 'BRL' ? '1.00' : p.exchangeRate.toFixed(4)}
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--moss)' }}>
                            R$ {p.amountBrl.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <Badge tone={p.paymentMethod === 'pix' ? 'moss' : p.paymentMethod === 'card' ? 'coral' : 'sun'}>
                              {p.paymentMethod.toUpperCase()}
                            </Badge>
                          </td>
                          <td style={{ padding: '12px 8px', color: 'var(--muted)', fontSize: 12 }}>
                            {p.notes || 'Abono recibido'}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)' }}>
                          No hay transacciones registradas para este período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
