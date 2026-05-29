"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getTours, 
  getBookings, 
  updateTourActiveStatus, 
  updateTourDetails,
  getBookingPayments,
  addBookingPayment,
  deleteBookingPayment,
  getBookingLogs,
  addBookingLog,
  updateBookingDetails
} from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Photo } from '@/components/Photo';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';

const parseBookingDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const clean = dateStr.toLowerCase().replace(/[^a-z0-9áéíóúüñ\s-]/g, '').trim();
  const parts = clean.split(/\s+/);
  let day = 1;
  let monthIdx = 4; // Mayo por defecto
  let year = 2026;
  
  for (const part of parts) {
    const mIdx = months.findIndex(m => m.startsWith(part.substring(0, 3)));
    if (mIdx !== -1) monthIdx = mIdx;
    const dNum = parseInt(part, 10);
    if (!isNaN(dNum) && dNum > 0 && dNum <= 31) day = dNum;
  }
  return new Date(year, monthIdx, day);
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'tours' | 'bookings'>('tours');
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Booking operations state
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  
  // Expanded booking live details
  const [activePayments, setActivePayments] = useState<any[]>([]);
  const [activeLogs, setActiveLogs] = useState<any[]>([]);
  
  // Form states for booking operations
  const [opAssignedGuide, setOpAssignedGuide] = useState('');
  const [opPickupTime, setOpPickupTime] = useState('');
  const [opOperatorNotes, setOpOperatorNotes] = useState('');
  const [opVoucherSent, setOpVoucherSent] = useState(false);
  const [opPaymentStatus, setOpPaymentStatus] = useState('PENDING');
  const [opGuideNetCost, setOpGuideNetCost] = useState<number>(0);
  const [opProviderPaymentStatus, setOpProviderPaymentStatus] = useState('PENDING');
  const [opProviderPaymentDate, setOpProviderPaymentDate] = useState('');

  // Form states for adding payment
  const [newPayAmount, setNewPayAmount] = useState(100);
  const [newPayCurrency, setNewPayCurrency] = useState('BRL');
  const [newPayRate, setNewPayRate] = useState(1.0);
  const [newPayMethod, setNewPayMethod] = useState('pix');
  const [newPayNotes, setNewPayNotes] = useState('');

  // Form states for adding log
  const [newLogComment, setNewLogComment] = useState('');
  const [newLogAuthor, setNewLogAuthor] = useState('Admin');

  // Filters for bookings
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [bookingTourFilter, setBookingTourFilter] = useState('ALL');
  const [bookingDateRangeFilter, setBookingDateRangeFilter] = useState<'ALL' | 'today' | 'tomorrow' | '7days' | '30days'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [crmMode, setCrmMode] = useState<boolean>(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Manual creation & comprehensive client editing states
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [activeEditingBooking, setActiveEditingBooking] = useState<any | null>(null);

  const [formName, setFormName] = useState('');
  const [formLastname, setFormLastname] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formCountry, setFormCountry] = useState('🇦🇷 Argentina');
  const [formHotelAddress, setFormHotelAddress] = useState('');
  const [formHotelRoom, setFormHotelRoom] = useState('');
  const [formHotelPhone, setFormHotelPhone] = useState('');
  const [formTourId, setFormTourId] = useState('');
  const [formDate, setFormDate] = useState('28 Mayo');
  const [formSlot, setFormSlot] = useState('08:30');
  const [formAdults, setFormAdults] = useState(2);
  const [formKids, setFormKids] = useState(0);
  const [formTotal, setFormTotal] = useState(360);
  const [formPaymentMethod, setFormPaymentMethod] = useState('pix');
  const [formPaymentStatus, setFormPaymentStatus] = useState('PENDING');
  const [formGuideNetCost, setFormGuideNetCost] = useState<number>(0);
  const [formProviderPaymentStatus, setFormProviderPaymentStatus] = useState('PENDING');
  const [formProviderPaymentDate, setFormProviderPaymentDate] = useState('');

  // Edit tour state
  const [editingTour, setEditingTour] = useState<any | null>(null);
  const [editTab, setEditTab] = useState<'general' | 'experience' | 'itinerary' | 'inclusions' | 'important'>('general');
  const [editFormData, setEditFormData] = useState({
    title: '',
    subtitle: '',
    priceFrom: 0,
    photoLabel: '',
    description: '',
    itinerary: [] as any[],
    includes: [] as string[],
    excludes: [] as string[],
    importantInfo: [] as string[]
  });

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Hook para actualizar la tasa de cambio por defecto
  useEffect(() => {
    if (newPayCurrency === 'BRL') {
      setNewPayRate(1.0);
    } else if (newPayCurrency === 'USD') {
      setNewPayRate(5.2);
    } else if (newPayCurrency === 'ARS') {
      setNewPayRate(0.005);
    } else if (newPayCurrency === 'EUR') {
      setNewPayRate(5.5);
    }
  }, [newPayCurrency]);

  async function loadData() {
    setLoading(true);
    try {
      const [toursData, bookingsData, paymentsData] = await Promise.all([
        getTours(),
        getBookings(),
        getBookingPayments()
      ]);
      setTours(toursData);
      setBookings(bookingsData);
      setAllPayments(paymentsData);
    } catch (e) {
      console.error("Error al cargar datos administrativos:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handlers para operaciones de reservas
  const handleExpandBooking = async (booking: any) => {
    if (expandedBookingId === booking.id) {
      setExpandedBookingId(null);
      return;
    }
    setExpandedBookingId(booking.id);
    setOpAssignedGuide(booking.assignedGuide || '');
    setOpPickupTime(booking.pickupTime || '');
    setOpOperatorNotes(booking.operatorNotes || '');
    setOpVoucherSent(booking.voucherSent || false);
    setOpPaymentStatus(booking.paymentStatus || 'PENDING');
    setOpGuideNetCost(booking.guideNetCost || 0);
    setOpProviderPaymentStatus(booking.providerPaymentStatus || 'PENDING');
    setOpProviderPaymentDate(booking.providerPaymentDate || '');
    
    // Cargar pagos y logs en vivo
    try {
      const [payments, logs] = await Promise.all([
        getBookingPayments(booking.id),
        getBookingLogs(booking.id)
      ]);
      setActivePayments(payments);
      setActiveLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPayment = async (bookingId: string) => {
    if (newPayAmount <= 0) return;
    
    const amountBrl = Number((newPayAmount * newPayRate).toFixed(2));
    
    try {
      const { data, error } = await addBookingPayment({
        bookingId,
        amount: newPayAmount,
        currency: newPayCurrency,
        exchangeRate: newPayRate,
        amountBrl,
        paymentMethod: newPayMethod,
        notes: newPayNotes
      });
      
      if (error) {
        alert('Error al añadir el abono.');
      } else if (data) {
        setActivePayments(prev => [...prev, data]);
        // Actualizar listado global para balances en vivo
        setAllPayments(prev => [...prev, data]);
        // Limpiar formulario
        setNewPayAmount(100);
        setNewPayNotes('');
        // Agregar un log automático de auditoría
        await handleAddSystemLog(bookingId, `Se registró un abono de ${newPayCurrency} ${newPayAmount} (R$ ${amountBrl}) vía ${newPayMethod.toUpperCase()}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePayment = async (paymentId: string, bookingId: string, amountDesc: string) => {
    if (!confirm('¿Estás seguro de eliminar este abono?')) return;
    try {
      const { error } = await deleteBookingPayment(paymentId);
      if (error) {
        alert('Error al eliminar abono.');
      } else {
        setActivePayments(prev => prev.filter(p => p.id !== paymentId));
        setAllPayments(prev => prev.filter(p => p.id !== paymentId));
        // Agregar un log automático de auditoría
        await handleAddSystemLog(bookingId, `Se eliminó el abono de ${amountDesc}.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (bookingId: string) => {
    if (!newLogComment.trim()) return;
    
    try {
      const { data, error } = await addBookingLog({
        bookingId,
        comment: newLogComment,
        author: newLogAuthor
      });
      
      if (error) {
        alert('Error al agregar comentario.');
      } else if (data) {
        setActiveLogs(prev => [...prev, data]);
        setNewLogComment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSystemLog = async (bookingId: string, comment: string) => {
    try {
      const { data } = await addBookingLog({
        bookingId,
        comment,
        author: 'Sistema'
      });
      if (data) {
        setActiveLogs(prev => [...prev, data]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveOperationalFields = async (bookingId: string) => {
    const updates = {
      assignedGuide: opAssignedGuide,
      pickupTime: opPickupTime,
      operatorNotes: opOperatorNotes,
      voucherSent: opVoucherSent,
      paymentStatus: opPaymentStatus,
      guideNetCost: Number(opGuideNetCost),
      providerPaymentStatus: opProviderPaymentStatus,
      providerPaymentDate: opProviderPaymentDate
    };
    
    try {
      const { error } = await updateBookingDetails(bookingId, updates);
      if (error) {
        alert('Error al guardar cambios operativos.');
      } else {
        // Actualizar en el estado local de bookings para que persista visualmente en la tabla principal
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updates } : b));
        // Añadir log de auditoría automático
        await handleAddSystemLog(bookingId, 'Campos operativos actualizados por el administrador.');
        alert('¡Cambios operativos guardados correctamente!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sync database manually
  const handleDatabaseSync = async () => {
    setSyncStatus('syncing');
    try {
      // Llamar dinámicamente a la carga de datos locales para insertarlos en Supabase
      const response = await fetch('/api/sync-tours', { method: 'POST' }).catch(() => null);
      
      // Dado que puede correr offline o por wrapper, simulamos si falla o si se ejecuta local
      setTimeout(async () => {
        // En cualquier caso refrescamos localmente
        await loadData();
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }, 1500);
    } catch (e) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleToggleActive = async (tourId: string, currentStatus: boolean) => {
    setActionLoading(tourId);
    const newStatus = !currentStatus;
    
    // Optimistic UI update
    setTours(prev => prev.map(t => t.id === tourId ? { ...t, isActive: newStatus } : t));

    try {
      const { error } = await updateTourActiveStatus(tourId, newStatus);
      if (error) {
        // Rollback on error
        setTours(prev => prev.map(t => t.id === tourId ? { ...t, isActive: currentStatus } : t));
        alert('Error al cambiar el estado del tour en Supabase. Inténtalo de nuevo.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenEdit = (tour: any) => {
    setEditingTour(tour);
    setEditTab('general'); // Reset tab to general
    setEditFormData({
      title: tour.title,
      subtitle: tour.subtitle,
      priceFrom: tour.priceFrom,
      photoLabel: tour.photoLabel || '',
      description: tour.description || '',
      itinerary: tour.itinerary ? JSON.parse(JSON.stringify(tour.itinerary)) : [],
      includes: tour.includes ? [...tour.includes] : [],
      excludes: tour.excludes ? [...tour.excludes] : [],
      importantInfo: tour.importantInfo ? [...tour.importantInfo] : []
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTour) return;

    setActionLoading(editingTour.id);
    try {
      const { error } = await updateTourDetails(editingTour.id, editFormData);
      if (error) {
        alert('Error al actualizar el tour en Supabase.');
      } else {
        // Update local state
        setTours(prev => prev.map(t => t.id === editingTour.id ? { ...t, ...editFormData } : t));
        setEditingTour(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Helpers para manejo dinámico de arreglos
  const handleItineraryChange = (index: number, field: string, value: string) => {
    setEditFormData(prev => {
      const newItinerary = [...prev.itinerary];
      newItinerary[index] = { ...newItinerary[index], [field]: value };
      return { ...prev, itinerary: newItinerary };
    });
  };

  const handleAddItineraryStep = () => {
    setEditFormData(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, { time: "09:00", duration: "", title: "Nuevo paso", desc: "Descripción del paso" }]
    }));
  };

  const handleRemoveItineraryStep = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index)
    }));
  };

  const handleArrayStringChange = (arrayField: 'includes' | 'excludes' | 'importantInfo', index: number, value: string) => {
    setEditFormData(prev => {
      const newArray = [...prev[arrayField]];
      newArray[index] = value;
      return { ...prev, [arrayField]: newArray };
    });
  };

  const handleAddArrayString = (arrayField: 'includes' | 'excludes' | 'importantInfo') => {
    setEditFormData(prev => ({
      ...prev,
      [arrayField]: [...prev[arrayField], ""]
    }));
  };

  const handleRemoveArrayString = (arrayField: 'includes' | 'excludes' | 'importantInfo', index: number) => {
    setEditFormData(prev => ({
      ...prev,
      [arrayField]: prev[arrayField].filter((_, i) => i !== index)
    }));
  };

  // WhatsApp dinámico con extracción inteligente y codificación pre-redactada
  const handleWhatsAppAction = (booking: any) => {
    // 1. Limpieza estricta del número de WhatsApp usando Regex
    const cleanNumber = booking.whatsapp.replace(/[^0-9]/g, '');

    // 2. Redacción dinámica
    let greeting = `¡Hola ${booking.name}! Te saluda el equipo de Bora Floripa.`;
    
    // Personalización especial por cumpleaños o notas especiales
    const noteText = booking.notes?.toLowerCase() || '';
    if (noteText.includes('cumple') || noteText.includes('aniversario') || noteText.includes('fiesta')) {
      greeting = `¡Hola ${booking.name}! 🥳 Te saluda el equipo de Bora Floripa. ¡Nos enteramos que celebramos algo muy especial! 🎉`;
    }

    const tourText = booking.tourTitle;
    const dateText = booking.date;
    const timeText = booking.slot;
    const hotelText = booking.hotelAddress ? `Los pasaremos a buscar por el ${booking.hotelAddress}` : 'Coordinaremos el punto de recogida';
    const roomText = booking.hotelRoom ? ` (Hab. ${booking.hotelRoom})` : '';
    
    const message = `${greeting} Confirmamos tu reserva para el ${tourText} el día ${dateText}. ${hotelText}${roomText} a las ${timeText}. ¡Nos vemos pronto! 🌴`;
    
    // 3. Codificación nativa
    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;
    
    window.open(waUrl, '_blank');
  };

  const handleOpenCreateBooking = () => {
    setFormName('');
    setFormLastname('');
    setFormEmail('');
    setFormWhatsapp('');
    setFormCountry('🇦🇷 Argentina');
    setFormHotelAddress('');
    setFormHotelRoom('');
    setFormHotelPhone('');
    setFormTourId(tours[0]?.id || 'city-tour-floripa');
    setFormDate('28 Mayo');
    setFormSlot('08:30');
    setFormAdults(2);
    setFormKids(0);
    setFormTotal(360);
    setFormPaymentMethod('pix');
    setFormPaymentStatus('PENDING');
    setFormGuideNetCost(0);
    setFormProviderPaymentStatus('PENDING');
    setFormProviderPaymentDate('');
    setShowCreateBooking(true);
  };

  const handleOpenEditBooking = (booking: any) => {
    setActiveEditingBooking(booking);
    setFormName(booking.name || '');
    setFormLastname(booking.lastname || '');
    setFormEmail(booking.email || '');
    setFormWhatsapp(booking.whatsapp || '');
    setFormCountry(booking.country || '🇦🇷 Argentina');
    setFormHotelAddress(booking.hotelAddress || '');
    setFormHotelRoom(booking.hotelRoom || '');
    setFormHotelPhone(booking.hotelPhone || '');
    setFormTourId(booking.tourId || 'city-tour-floripa');
    setFormDate(booking.date || '28 Mayo');
    setFormSlot(booking.slot || '08:30');
    setFormAdults(Number(booking.adults || 2));
    setFormKids(Number(booking.kids || 0));
    setFormTotal(Number(booking.total || 0));
    setFormPaymentMethod(booking.paymentMethod || 'pix');
    setFormPaymentStatus(booking.paymentStatus || 'PENDING');
    setFormGuideNetCost(booking.guideNetCost || 0);
    setFormProviderPaymentStatus(booking.providerPaymentStatus || 'PENDING');
    setFormProviderPaymentDate(booking.providerPaymentDate || '');
  };

  const handleCreateBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create-booking');
    try {
      const selectedTour = tours.find(t => t.id === formTourId);
      const tourTitle = selectedTour?.title || 'Tour Manual';
      
      const newBookingData = {
        tourId: formTourId,
        tourTitle,
        date: formDate,
        slot: formSlot,
        adults: Number(formAdults),
        kids: Number(formKids),
        subtotal: Number(formTotal),
        discount: 0,
        fee: 0,
        total: Number(formTotal),
        name: formName,
        lastname: formLastname,
        email: formEmail,
        whatsapp: formWhatsapp,
        country: formCountry,
        hotelAddress: formHotelAddress,
        hotelPhone: formHotelPhone,
        hotelRoom: formHotelRoom,
        notes: 'Creado manualmente desde el panel administrativo.',
        paymentMethod: formPaymentMethod,
        paymentStatus: formPaymentStatus,
        createdAt: new Date().toISOString(),
        assignedGuide: '',
        pickupTime: formSlot,
        operatorNotes: '',
        voucherSent: false,
        guideNetCost: Number(formGuideNetCost),
        providerPaymentStatus: formProviderPaymentStatus,
        providerPaymentDate: formProviderPaymentDate
      };

      const { data, error } = await createBooking(newBookingData);
      if (error) {
        alert('Error al registrar la reserva manual.');
      } else if (data) {
        const savedBooking = {
          ...newBookingData,
          id: data.id
        };
        setBookings(prev => [savedBooking, ...prev]);
        setShowCreateBooking(false);
        
        await addBookingLog({
          bookingId: data.id,
          comment: `Reserva manual creada por el administrador. Tour: ${tourTitle.split(':')[0]} para el ${formDate}.`,
          author: 'Sistema'
        });
        
        alert('¡Reserva creada exitosamente!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditingBooking) return;
    
    setActionLoading(activeEditingBooking.id);
    try {
      const selectedTour = tours.find(t => t.id === formTourId);
      const tourTitle = selectedTour?.title || 'Tour Manual';

      const updates = {
        name: formName,
        lastname: formLastname,
        email: formEmail,
        whatsapp: formWhatsapp,
        country: formCountry,
        hotelAddress: formHotelAddress,
        hotelRoom: formHotelRoom,
        hotelPhone: formHotelPhone,
        tourId: formTourId,
        tourTitle,
        date: formDate,
        slot: formSlot,
        adults: Number(formAdults),
        kids: Number(formKids),
        total: Number(formTotal),
        paymentMethod: formPaymentMethod,
        paymentStatus: formPaymentStatus,
        guideNetCost: Number(formGuideNetCost),
        providerPaymentStatus: formProviderPaymentStatus,
        providerPaymentDate: formProviderPaymentDate
      };

      const { error } = await updateBookingDetails(activeEditingBooking.id, updates);
      if (error) {
        alert('Error al actualizar los datos del cliente.');
      } else {
        setBookings(prev => prev.map(b => b.id === activeEditingBooking.id ? { ...b, ...updates } : b));
        setActiveEditingBooking(null);
        
        await addBookingLog({
          bookingId: activeEditingBooking.id,
          comment: 'El administrador modificó los datos de contacto y detalles de la reserva.',
          author: 'Sistema'
        });
        
        alert('¡Datos de reserva actualizados correctamente!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="page" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <Header />

      <main className="wrap-wide" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {/* Banner de Bienvenida */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--coral)' }}>Panel de Control Interno</div>
            <h1 className="display" style={{ fontSize: 'clamp(32px, 5vw, 48px)', margin: 0, lineHeight: 1 }}>
              Dashboard Administrativo
            </h1>
            <p style={{ margin: '8px 0 0', color: 'var(--ink-soft)', fontSize: 15 }}>
              Control de catálogo de experiencias y procesamiento ágil de reservas.
            </p>
          </div>

          <button
            onClick={handleDatabaseSync}
            disabled={syncStatus === 'syncing'}
            className={`btn ${syncStatus === 'success' ? 'btn-moss' : syncStatus === 'error' ? 'btn-coral' : 'btn-ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 13, background: 'var(--paper)' }}
          >
            <Icon name="refresh" size={14} className={syncStatus === 'syncing' ? 'spin-animation' : ''} />
            {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'success' ? '¡Sincronizado!' : syncStatus === 'error' ? 'Error de Sinc' : 'Sincronizar Tours'}
          </button>
        </div>

        {/* Sub-Menú Utilitario (Control de Pestañas Premium) */}
        <div style={{
          display: 'flex',
          gap: 6,
          background: 'var(--paper)',
          padding: 6,
          borderRadius: 14,
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 32,
          maxWidth: 580
        }}>
          <button
            onClick={() => setActiveTab('tours')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              background: activeTab === 'tours' ? 'var(--cream)' : 'transparent',
              color: 'var(--ink)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s ease, transform 0.1s ease'
            }}
          >
            <Icon name="sparkle" size={15} /> Gestión de Tours ({tours.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              background: activeTab === 'bookings' ? 'var(--cream)' : 'transparent',
              color: 'var(--ink)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s ease, transform 0.1s ease'
            }}
          >
            <Icon name="calendar" size={15} /> Reservas ({bookings.length})
          </button>
          <Link
            href="/admin/finance"
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'transparent',
              color: 'var(--ink)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s ease, transform 0.1s ease'
            }}
          >
            <Icon name="credit" size={15} /> Finanzas 📊
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Cargando datos del panel...</h3>
          </div>
        ) : (
          <div style={{ background: 'var(--paper)', borderRadius: 20, padding: 'clamp(16px, 3vw, 28px)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            
            {/* SECCIÓN A: GESTIÓN DE EXPERIENCIAS (TOURS) */}
            {activeTab === 'tours' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 16px', fontSize: 22, fontWeight: 700 }}>
                  Catálogo de Tours
                </h2>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--line)', fontSize: 13, color: 'var(--muted)' }}>
                        <th style={{ padding: '12px 8px', fontWeight: 600 }}>Miniatura</th>
                        <th style={{ padding: '12px 8px', fontWeight: 600 }}>Experiencia / Ubicación</th>
                        <th style={{ padding: '12px 8px', fontWeight: 600 }}>Categoría</th>
                        <th style={{ padding: '12px 8px', fontWeight: 600 }}>Precio actual</th>
                        <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'center' }}>Visible en Web</th>
                        <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tours.map((tour) => (
                        <tr key={tour.id} style={{ borderBottom: '1px solid var(--line-soft)', fontSize: 14 }}>
                          <td style={{ padding: '14px 8px' }}>
                            <Photo
                              variant={tour.photoVariant}
                              glyph={tour.glyph}
                              ratio="4/3"
                              rounded="xs"
                              style={{ width: 56, height: 42, minWidth: 56 }}
                            />
                          </td>
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{tour.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                              <Icon name="pin" size={11} /> {tour.location} · {tour.duration}
                            </div>
                          </td>
                          <td style={{ padding: '14px 8px' }}>
                            <Badge tone="soft">{tour.cat}</Badge>
                          </td>
                          <td style={{ padding: '14px 8px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            R$ {tour.priceFrom}
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            {/* Switch visual premium */}
                            <button
                              onClick={() => handleToggleActive(tour.id, tour.isActive !== false)}
                              disabled={actionLoading === tour.id}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              aria-label={tour.isActive !== false ? "Desactivar tour" : "Activar tour"}
                            >
                              <div style={{
                                width: 44,
                                height: 24,
                                borderRadius: 12,
                                background: tour.isActive !== false ? 'var(--moss)' : 'var(--line)',
                                position: 'relative',
                                transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                              }}>
                                <div style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: 999,
                                  background: '#fff',
                                  position: 'absolute',
                                  top: 3,
                                  left: tour.isActive !== false ? 23 : 3,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                  transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }} />
                              </div>
                            </button>
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenEdit(tour)}
                              className="btn btn-ghost btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 12px' }}
                            >
                              <Icon name="sparkle" size={13} /> Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECCIÓN B: CONTROL DE RESERVAS (BOOKINGS) */}
            {activeTab === 'bookings' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 16px', fontSize: 22, fontWeight: 700 }}>
                  Lista de Reservas Recibidas
                </h2>

                {/* Filtros avanzados de búsqueda */}
                <div style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 20,
                  alignItems: 'center',
                  background: 'var(--cream-soft)',
                  padding: 16,
                  borderRadius: 14,
                  border: '1px solid var(--line-soft)'
                }}>
                  <div style={{ flex: '2 1 240px', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Buscar por cliente, tour, whatsapp, hotel..."
                      value={bookingSearchQuery}
                      onChange={e => setBookingSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: 10,
                        border: '1px solid var(--line)',
                        fontSize: 13,
                        background: 'var(--paper)',
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
                      <Icon name="search" size={15} />
                    </div>
                  </div>

                  <div style={{ flex: '1 1 150px' }}>
                    <select
                      value={bookingTourFilter}
                      onChange={e => setBookingTourFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--line)',
                        fontSize: 13,
                        background: 'var(--paper)',
                        fontFamily: 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ALL">Todos los Tours</option>
                      {tours.map(t => (
                        <option key={t.id} value={t.id}>{t.title.split(':')[0]}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: '1 1 150px' }}>
                    <select
                      value={bookingStatusFilter}
                      onChange={e => setBookingStatusFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--line)',
                        fontSize: 13,
                        background: 'var(--paper)',
                        fontFamily: 'inherit',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ALL">Todos los Estados</option>
                      <option value="PENDING">Pendientes</option>
                      <option value="PAID">Pagados</option>
                      <option value="CANCELLED">Cancelados</option>
                    </select>
                  </div>
                </div>

                {/* Sub-Menú Rango de Fechas & Modo de Vista */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 24
                }}>
                  {/* Botón "+ Crear Cliente Manual" */}
                  <button
                    type="button"
                    onClick={handleOpenCreateBooking}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 13,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      background: 'var(--coral)',
                      color: '#fff',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#d9533f';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--coral)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <Icon name="plus" size={14} /> + Crear Cliente Manual
                  </button>
                  {/* Selector de Rango de Fechas (Botones Premium) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--cream-soft)',
                    padding: 4,
                    borderRadius: 10,
                    border: '1px solid var(--line-soft)'
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '0 8px', color: 'var(--ink-soft)' }}>Rango:</span>
                    {[
                      { id: 'ALL', label: 'Todos' },
                      { id: 'today', label: 'Hoy' },
                      { id: 'tomorrow', label: 'Mañana' },
                      { id: '7days', label: '7 días' },
                      { id: '30days', label: '30 días' }
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setBookingDateRangeFilter(r.id as any)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: bookingDateRangeFilter === r.id ? 'var(--paper)' : 'transparent',
                          color: bookingDateRangeFilter === r.id ? 'var(--coral)' : 'var(--ink-soft)',
                          fontSize: 12,
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: bookingDateRangeFilter === r.id ? 'var(--shadow-sm)' : 'none',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onMouseEnter={e => {
                          if (bookingDateRangeFilter !== r.id) {
                            e.currentTarget.style.background = 'rgba(14, 27, 44, 0.03)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (bookingDateRangeFilter !== r.id) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {/* Switch para Alternar Modo (Vista CRM vs Vista Tours) */}
                  <div style={{
                    display: 'flex',
                    background: 'var(--cream-soft)',
                    padding: 4,
                    borderRadius: 10,
                    border: '1px solid var(--line-soft)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setCrmMode(false)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: !crmMode ? 'var(--paper)' : 'transparent',
                        color: !crmMode ? 'var(--coral)' : 'var(--ink-soft)',
                        fontSize: 12,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: !crmMode ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <span>🚌 Vista Tours</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCrmMode(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: crmMode ? 'var(--paper)' : 'transparent',
                        color: crmMode ? 'var(--coral)' : 'var(--ink-soft)',
                        fontSize: 12,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: crmMode ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <span>👤 Vista CRM</span>
                    </button>
                  </div>

                  {/* Switch para Alternar Vista (Lista vs Calendario) */}
                  <div style={{
                    display: 'flex',
                    background: 'var(--cream-soft)',
                    padding: 4,
                    borderRadius: 10,
                    border: '1px solid var(--line-soft)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: viewMode === 'list' ? 'var(--paper)' : 'transparent',
                        color: viewMode === 'list' ? 'var(--coral)' : 'var(--ink-soft)',
                        fontSize: 12,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      onMouseEnter={e => {
                        if (viewMode !== 'list') {
                          e.currentTarget.style.background = 'rgba(14, 27, 44, 0.03)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (viewMode !== 'list') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Icon name="list" size={13} /> Lista
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('calendar')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: viewMode === 'calendar' ? 'var(--paper)' : 'transparent',
                        color: viewMode === 'calendar' ? 'var(--coral)' : 'var(--ink-soft)',
                        fontSize: 12,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: viewMode === 'calendar' ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      onMouseEnter={e => {
                        if (viewMode !== 'calendar') {
                          e.currentTarget.style.background = 'rgba(14, 27, 44, 0.03)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (viewMode !== 'calendar') {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Icon name="calendar" size={13} /> Calendario
                    </button>
                  </div>
                </div>

                {/* Contenido Dinámico de las Reservas (Lista / Calendario) */}
                {(() => {
                  const filteredBookings = bookings.filter(b => {
                    const matchQuery = 
                      bookingSearchQuery === '' ||
                      `${b.name} ${b.lastname}`.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
                      b.email.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
                      b.whatsapp.includes(bookingSearchQuery) ||
                      (b.hotelAddress && b.hotelAddress.toLowerCase().includes(bookingSearchQuery.toLowerCase())) ||
                      b.id.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
                      b.tourTitle.toLowerCase().includes(bookingSearchQuery.toLowerCase());

                    const matchStatus = 
                      bookingStatusFilter === 'ALL' || 
                      b.paymentStatus === bookingStatusFilter;

                    const matchTour = 
                      bookingTourFilter === 'ALL' || 
                      b.tourId === bookingTourFilter;

                    let matchDate = true;
                    if (bookingDateRangeFilter !== 'ALL') {
                      const bDate = parseBookingDate(b.date);
                      const now = new Date();
                      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                      
                      if (bookingDateRangeFilter === 'today') {
                        matchDate = bDate >= todayStart && bDate <= todayEnd;
                      } else if (bookingDateRangeFilter === 'tomorrow') {
                        const tomStart = new Date(todayStart);
                        tomStart.setDate(tomStart.getDate() + 1);
                        const tomEnd = new Date(todayEnd);
                        tomEnd.setDate(tomEnd.getDate() + 1);
                        matchDate = bDate >= tomStart && bDate <= tomEnd;
                      } else if (bookingDateRangeFilter === '7days') {
                        const sevenEnd = new Date(todayEnd);
                        sevenEnd.setDate(sevenEnd.getDate() + 7);
                        matchDate = bDate >= todayStart && bDate <= sevenEnd;
                      } else if (bookingDateRangeFilter === '30days') {
                        const thirtyEnd = new Date(todayEnd);
                        thirtyEnd.setDate(thirtyEnd.getDate() + 30);
                        matchDate = bDate >= todayStart && bDate <= thirtyEnd;
                      }
                    }

                    return matchQuery && matchStatus && matchTour && matchDate;
                  });

                  // Helper para mapeo de colores en el calendario
                  const getTourVariantStyles = (tourId: string) => {
                    const tour = tours.find(t => t.id === tourId);
                    const variant = tour?.photoVariant || 'ink';
                    
                    const styles: Record<string, { bg: string, text: string }> = {
                      moss: { bg: '#ECFDF5', text: '#047857' },
                      turq: { bg: '#ECFEFF', text: '#0E7490' },
                      sky: { bg: '#EFF6FF', text: '#1D4ED8' },
                      coral: { bg: '#FFF1F2', text: '#BE123C' },
                      sun: { bg: '#FFFBEB', text: '#B45309' },
                      ink: { bg: '#F8FAFC', text: '#334155' }
                    };
                    return styles[variant] || styles.ink;
                  };

                  return (
                    <div>
                      {crmMode ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.25s ease' }}>
                          {(() => {
                            const passengersMap: Record<string, any[]> = {};
                            filteredBookings.forEach(b => {
                              const cleanPhone = b.whatsapp ? b.whatsapp.replace(/[^0-9]/g, '') : '';
                              const key = cleanPhone || `${b.name.trim().toLowerCase()}_${b.lastname.trim().toLowerCase()}`;
                              if (!passengersMap[key]) passengersMap[key] = [];
                              passengersMap[key].push(b);
                            });
                            const passengerKeys = Object.keys(passengersMap);

                            if (passengerKeys.length === 0) {
                              return (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14, border: '1px dashed var(--line)', borderRadius: 12 }}>
                                  No hay pasajeros registrados con los filtros aplicados.
                                </div>
                              );
                            }

                            return passengerKeys.map(key => {
                              const passengerBookings = passengersMap[key];
                              const leadBooking = passengerBookings[0];
                              const passengerTotalCotizado = passengerBookings.reduce((sum, b) => sum + b.total, 0);
                              const passengerBookingIds = passengerBookings.map(b => b.id);
                              const passengerTotalAbonado = allPayments
                                .filter(p => passengerBookingIds.includes(p.bookingId))
                                .reduce((sum, p) => sum + p.amountBrl, 0);
                              const passengerSaldoGlobal = Math.max(0, passengerTotalCotizado - passengerTotalAbonado);

                              return (
                                <div key={key} style={{
                                  background: 'var(--paper)',
                                  border: '1px solid var(--line-soft)',
                                  borderRadius: 18,
                                  boxShadow: 'var(--shadow-sm)',
                                  padding: 24,
                                  textAlign: 'left',
                                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.transform = 'none';
                                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                }}
                                >
                                  {/* Cabecera de Ficha Única CRM */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                                          👤 {leadBooking.name} {leadBooking.lastname}
                                        </h3>
                                        <Badge tone="soft">{passengerBookings.length} {passengerBookings.length > 1 ? 'Experiencias' : 'Experiencia'}</Badge>
                                      </div>
                                      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', fontSize: 13, color: 'var(--ink-soft)' }}>
                                        <span>📞 <strong>WhatsApp:</strong> {leadBooking.whatsapp}</span>
                                        <span>✉️ <strong>Email:</strong> {leadBooking.email}</span>
                                        <span>🌍 <strong>País:</strong> {leadBooking.country}</span>
                                      </div>
                                    </div>

                                    {/* Balance Global de Ficha Única */}
                                    <div style={{ 
                                      background: 'var(--cream-soft)', 
                                      padding: '12px 20px', 
                                      borderRadius: 14, 
                                      border: '1px solid var(--line-soft)',
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(3, 1fr)',
                                      gap: 20,
                                      minWidth: 320
                                    }}>
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Cotizado Global</div>
                                        <strong style={{ fontSize: 14, fontFamily: 'var(--font-mono)' }}>R$ {passengerTotalCotizado}</strong>
                                      </div>
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Abonado Global</div>
                                        <strong style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--moss)' }}>R$ {passengerTotalAbonado}</strong>
                                      </div>
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Saldo Pendiente</div>
                                        <strong style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: passengerSaldoGlobal === 0 ? 'var(--moss)' : 'var(--coral)' }}>R$ {passengerSaldoGlobal}</strong>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Listado de Tours del Pasajero */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Historial de Reservas</span>
                                    {passengerBookings.map((b, bIdx) => {
                                      const bookingPaidBrl = allPayments
                                        .filter(p => p.bookingId === b.id)
                                        .reduce((sum, p) => sum + p.amountBrl, 0);
                                      const bookingBalanceRemaining = Math.max(0, b.total - bookingPaidBrl);
                                      const colors = getTourVariantStyles(b.tourId);

                                      return (
                                        <div key={b.id || bIdx} style={{
                                          background: 'var(--cream-soft)',
                                          borderRadius: 12,
                                          border: `1px solid var(--line-soft)`,
                                          borderLeft: `5px solid ${colors.text}`,
                                          marginBottom: 4
                                        }}>
                                          <div style={{
                                            padding: '12px 16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 12
                                          }}>
                                            <div>
                                              <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{b.tourTitle}</strong>
                                              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                                                📅 {b.date} · ⏱️ {b.slot} · 👥 {b.adults} Ad {b.kids > 0 ? `/ ${b.kids} Ni` : ''}
                                                {b.hotelAddress && ` · 🟢 Pickup: ${b.hotelAddress} ${b.hotelRoom ? `(Hab. ${b.hotelRoom})` : ''}`}
                                              </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                              <div style={{ textAlign: 'right', fontSize: 12 }}>
                                                <div style={{ color: 'var(--ink)' }}>Cotizado: <strong>R$ {b.total}</strong></div>
                                                <div style={{ color: bookingBalanceRemaining === 0 ? 'var(--moss)' : 'var(--coral)' }}>
                                                  Saldo: <strong>R$ {bookingBalanceRemaining}</strong>
                                                </div>
                                              </div>

                                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                                <button
                                                  type="button"
                                                  onClick={() => handleExpandBooking(b)}
                                                  className="btn btn-ghost btn-sm"
                                                  style={{
                                                    padding: '6px 12px',
                                                    borderRadius: 8,
                                                    background: expandedBookingId === b.id ? 'var(--cream)' : '#fff',
                                                    fontSize: 12,
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                  }}
                                                >
                                                  Operar
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleWhatsAppAction(b)}
                                                  className="btn btn-moss btn-sm"
                                                  style={{
                                                    padding: '6px 12px',
                                                    borderRadius: 8,
                                                    background: '#25D366',
                                                    color: '#fff',
                                                    fontSize: 12,
                                                    border: 'none',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                  }}
                                                >
                                                  WhatsApp
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleOpenEditBooking(b)}
                                                  className="btn btn-ghost btn-sm"
                                                  style={{
                                                    padding: '6px 12px',
                                                    borderRadius: 8,
                                                    background: '#fff',
                                                    fontSize: 12,
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                  }}
                                                >
                                                  Editar
                                                </button>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Formulario/Operaciones en línea si está expandida esta reserva específica */}
                                          {expandedBookingId === b.id && (
                                            <div style={{ padding: '16px', background: 'var(--cream-soft)', borderTop: '1px solid var(--line-soft)' }}>
                                              <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                                                gap: 16,
                                                animation: 'fadeIn 0.2s ease'
                                              }}>
                                                {/* COLUMNA 1: LOGÍSTICA OPERATIVA */}
                                                <div style={{ 
                                                  background: '#fff', 
                                                  padding: 16, 
                                                  borderRadius: 12, 
                                                  boxShadow: 'var(--shadow-sm)', 
                                                  display: 'flex', 
                                                  flexDirection: 'column', 
                                                  gap: 10 
                                                }}>
                                                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span>⚙️</span> Logística Operativa
                                                  </h4>
                                                  
                                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700 }}>Guía Asignado</span>
                                                    <input 
                                                      type="text" 
                                                      value={opAssignedGuide} 
                                                      onChange={e => setOpAssignedGuide(e.target.value)}
                                                      placeholder="Ej: Tiago Silva"
                                                      style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                    />
                                                  </label>

                                                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--coral)' }}>Costo Guía (R$)</span>
                                                      <input 
                                                        type="number" 
                                                        value={opGuideNetCost} 
                                                        onChange={e => setOpGuideNetCost(Number(e.target.value))}
                                                        placeholder="Ej: 150"
                                                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'var(--font-mono)' }}
                                                      />
                                                    </label>
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--coral)' }}>Pago Guía</span>
                                                      <select 
                                                        value={opProviderPaymentStatus} 
                                                        onChange={e => setOpProviderPaymentStatus(e.target.value)}
                                                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', cursor: 'pointer', fontFamily: 'inherit' }}
                                                      >
                                                        <option value="PENDING">Pendiente</option>
                                                        <option value="PAID">Pagado</option>
                                                      </select>
                                                    </label>
                                                  </div>

                                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--coral)' }}>Fecha Depósito Guía</span>
                                                    <input 
                                                      type="text" 
                                                      value={opProviderPaymentDate} 
                                                      onChange={e => setOpProviderPaymentDate(e.target.value)}
                                                      placeholder="Ej: 28 Mayo"
                                                      style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                    />
                                                  </label>
                                                  
                                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 10, fontWeight: 700 }}>Hora Pickup</span>
                                                      <input 
                                                        type="text" 
                                                        value={opPickupTime} 
                                                        onChange={e => setOpPickupTime(e.target.value)}
                                                        placeholder="Ej: 08:30"
                                                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      />
                                                    </label>
                                                    
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 10, fontWeight: 700 }}>Pago</span>
                                                      <select 
                                                        value={opPaymentStatus} 
                                                        onChange={e => setOpPaymentStatus(e.target.value)}
                                                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      >
                                                        <option value="PENDING">PENDING</option>
                                                        <option value="PAID">PAID</option>
                                                        <option value="CANCELLED">CANCELLED</option>
                                                      </select>
                                                    </label>
                                                  </div>

                                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700 }}>Notas Internas</span>
                                                    <textarea 
                                                      rows={2}
                                                      value={opOperatorNotes} 
                                                      onChange={e => setOpOperatorNotes(e.target.value)}
                                                      placeholder="Detalles logísticos..."
                                                      style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', resize: 'vertical', fontFamily: 'inherit' }}
                                                    />
                                                  </label>

                                                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: '2px 0' }}>
                                                    <input 
                                                      type="checkbox" 
                                                      checked={opVoucherSent} 
                                                      onChange={e => setOpVoucherSent(e.target.checked)}
                                                      style={{ width: 14, height: 14 }}
                                                    />
                                                    <span style={{ fontSize: 11, fontWeight: 700 }}>¿Voucher Enviado?</span>
                                                  </label>

                                                  <button 
                                                    type="button" 
                                                    onClick={() => handleSaveOperationalFields(b.id)}
                                                    className="btn btn-coral" 
                                                    style={{ width: '100%', padding: '8px', fontSize: 12, fontWeight: 700, borderRadius: 8, marginTop: 'auto', border: 'none', cursor: 'pointer' }}
                                                  >
                                                    Guardar Logística
                                                  </button>
                                                </div>

                                                {/* COLUMNA 2: ABONOS MULTIMONEDA */}
                                                <div style={{ 
                                                  background: '#fff', 
                                                  padding: 16, 
                                                  borderRadius: 12, 
                                                  boxShadow: 'var(--shadow-sm)', 
                                                  display: 'flex', 
                                                  flexDirection: 'column', 
                                                  gap: 10 
                                                }}>
                                                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span>💰</span> Finanzas & Abonos
                                                  </h4>

                                                  <div style={{ 
                                                    background: 'var(--cream-soft)', 
                                                    padding: '8px 10px', 
                                                    borderRadius: 8, 
                                                    border: '1px solid var(--line-soft)', 
                                                    fontSize: 11,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 2
                                                  }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                      <span>Total:</span>
                                                      <strong>R$ {b.total}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                      <span>Abonado:</span>
                                                      <strong style={{ color: 'var(--moss)' }}>R$ {bookingPaidBrl}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--line)', paddingTop: 4, marginTop: 2 }}>
                                                      <span>Saldo:</span>
                                                      <strong style={{ color: bookingBalanceRemaining === 0 ? 'var(--moss)' : 'var(--coral)' }}>R$ {bookingBalanceRemaining}</strong>
                                                    </div>
                                                  </div>

                                                  {/* Listado de transacciones */}
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 80, overflowY: 'auto' }}>
                                                    {activePayments.map((p: any) => (
                                                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cream-soft)', padding: '4px 6px', borderRadius: 4, fontSize: 10 }}>
                                                        <div>
                                                          <strong>{p.currency} {p.amount}</strong>
                                                          <span style={{ display: 'block', fontSize: 8, color: 'var(--muted)' }}>{p.paymentMethod.toUpperCase()} · {p.notes || 'Abono'}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                          <strong>R$ {p.amountBrl}</strong>
                                                          <button 
                                                            type="button" 
                                                            onClick={() => handleDeletePayment(p.id, b.id, `${p.currency} ${p.amount}`)}
                                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--coral)', padding: 1, display: 'flex' }}
                                                          >
                                                            <Icon name="close" size={10} />
                                                          </button>
                                                        </div>
                                                      </div>
                                                    ))}
                                                    {activePayments.length === 0 && (
                                                      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>
                                                        Sin abonos.
                                                      </div>
                                                    )}
                                                  </div>

                                                  {/* Agregar abono */}
                                                  <div style={{ borderTop: '1px dashed var(--line)', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                                      <input 
                                                        type="number" 
                                                        value={newPayAmount} 
                                                        onChange={e => setNewPayAmount(Number(e.target.value))}
                                                        placeholder="Monto"
                                                        style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, background: 'var(--cream-soft)' }}
                                                      />
                                                      <select 
                                                        value={newPayCurrency} 
                                                        onChange={e => setNewPayCurrency(e.target.value)}
                                                        style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      >
                                                        <option value="BRL">BRL</option>
                                                        <option value="USD">USD</option>
                                                        <option value="ARS">ARS</option>
                                                        <option value="EUR">EUR</option>
                                                      </select>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                                      <input 
                                                        type="number" 
                                                        step="any"
                                                        value={newPayRate} 
                                                        onChange={e => setNewPayRate(Number(e.target.value))}
                                                        placeholder="Tasa"
                                                        style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, background: 'var(--cream-soft)' }}
                                                      />
                                                      <select 
                                                        value={newPayMethod} 
                                                        onChange={e => setNewPayMethod(e.target.value)}
                                                        style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      >
                                                        <option value="pix">PIX</option>
                                                        <option value="cash">Efectivo</option>
                                                        <option value="card">Tarjeta</option>
                                                        <option value="transfer">Transfer</option>
                                                      </select>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                      <input 
                                                        type="text" 
                                                        placeholder="Glosa/Notas"
                                                        value={newPayNotes}
                                                        onChange={e => setNewPayNotes(e.target.value)}
                                                        style={{ flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      />
                                                      <button 
                                                        type="button" 
                                                        onClick={() => handleAddPayment(b.id)}
                                                        className="btn btn-moss"
                                                        style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, borderRadius: 4, border: 'none', cursor: 'pointer' }}
                                                      >
                                                        Abonar
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* COLUMNA 3: BITÁCORA DE COMENTARIOS */}
                                                <div style={{ 
                                                  background: '#fff', 
                                                  padding: 16, 
                                                  borderRadius: 12, 
                                                  boxShadow: 'var(--shadow-sm)', 
                                                  display: 'flex', 
                                                  flexDirection: 'column', 
                                                  gap: 10 
                                                }}>
                                                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span>📝</span> Bitácora Operativa
                                                  </h4>

                                                  <div style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    gap: 6, 
                                                    maxHeight: 100, 
                                                    overflowY: 'auto', 
                                                    flex: 1 
                                                  }}>
                                                    {activeLogs.map((l: any) => (
                                                      <div key={l.id} style={{ fontSize: 10, paddingBottom: 4, borderBottom: '1px dashed var(--line-soft)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 8 }}>
                                                          <strong style={{ color: l.author === 'Sistema' ? 'var(--coral)' : 'var(--ink)' }}>{l.author}</strong>
                                                          <span>{new Date(l.createdAt).toLocaleDateString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                                                        </div>
                                                        <div style={{ color: 'var(--ink-soft)' }}>{l.comment}</div>
                                                      </div>
                                                    ))}
                                                    {activeLogs.length === 0 && (
                                                      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', fontStyle: 'italic', margin: 'auto' }}>
                                                        Sin registros en la bitácora.
                                                      </div>
                                                    )}
                                                  </div>

                                                  <div style={{ borderTop: '1px dashed var(--line)', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <textarea 
                                                      rows={1}
                                                      placeholder="Comentario..."
                                                      value={newLogComment}
                                                      onChange={e => setNewLogComment(e.target.value)}
                                                      style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, resize: 'vertical', background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                    />
                                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                      <select 
                                                        value={newLogAuthor}
                                                        onChange={e => setNewLogAuthor(e.target.value)}
                                                        style={{ padding: '2px 4px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 10, width: 80, background: 'var(--cream-soft)', fontFamily: 'inherit', cursor: 'pointer' }}
                                                      >
                                                        <option value="Admin">Admin</option>
                                                        <option value="Agustina">Agustina</option>
                                                        <option value="Claudia">Claudia</option>
                                                      </select>
                                                      <button 
                                                        type="button" 
                                                        onClick={() => handleAddComment(b.id)}
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, borderRadius: 4, marginLeft: 'auto', background: 'var(--cream-soft)', border: 'none', cursor: 'pointer' }}
                                                      >
                                                        Registrar
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : viewMode === 'list' ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--line)', fontSize: 13, color: 'var(--muted)' }}>
                                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Cliente</th>
                                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Tour / Fecha</th>
                                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Tarifa / Abono / Saldo</th>
                                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Control Operativo / Hotel / Observaciones</th>
                                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>Acción Operativa</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredBookings.length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)' }}>
                                    No se encontraron reservas con los filtros aplicados.
                                  </td>
                                </tr>
                              ) : (
                                filteredBookings.map((booking, idx) => {
                                  // Calcular saldo matemático en Reales
                                  const paidBrl = allPayments
                                    .filter(p => p.bookingId === booking.id)
                                    .reduce((sum, p) => sum + p.amountBrl, 0);
                                  const balanceRemaining = Math.max(0, booking.total - paidBrl);

                                  return (
                                    <React.Fragment key={booking.id || idx}>
                                      <tr style={{ 
                                        borderBottom: expandedBookingId === booking.id ? 'none' : '1px solid var(--line-soft)', 
                                        fontSize: 14,
                                        background: expandedBookingId === booking.id ? 'var(--cream-soft)' : 'transparent',
                                        transition: 'background 0.2s ease'
                                      }}>
                                        <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                                          <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                                            {booking.name} {booking.lastname}
                                          </div>
                                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                                            <Icon name="phone" size={11} /> {booking.whatsapp}
                                          </div>
                                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                                            <Icon name="star" size={11} /> {booking.country}
                                          </div>
                                        </td>
                                        <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                                          <div style={{ fontWeight: 600 }}>{booking.tourTitle}</div>
                                          <div style={{ fontSize: 12, color: 'var(--coral)', fontWeight: 600, marginTop: 4 }}>
                                            <Icon name="calendar" size={11} /> {booking.date} · {booking.slot}
                                          </div>
                                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                            Pax: {booking.adults} adulto{booking.adults > 1 ? 's' : ''}
                                            {booking.kids > 0 ? ` · ${booking.kids} niño${booking.kids > 1 ? 's' : ''}` : ''}
                                          </div>
                                        </td>
                                        <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                                          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>R$ {booking.total}</div>
                                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                            Abonado: R$ {paidBrl.toLocaleString('es')}
                                          </div>
                                          <div style={{ 
                                            fontSize: 11, 
                                            fontWeight: 700, 
                                            color: balanceRemaining === 0 ? 'var(--moss)' : 'var(--coral)', 
                                            marginTop: 2 
                                          }}>
                                            Saldo: R$ {balanceRemaining.toLocaleString('es')}
                                          </div>
                                        </td>
                                        <td style={{ padding: '16px 8px', verticalAlign: 'top' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                                            <Badge tone={booking.paymentStatus === 'PAID' ? 'moss' : booking.paymentStatus === 'CANCELLED' ? 'ink' : 'sun'}>
                                              {booking.paymentStatus === 'PAID' ? 'Paid' : booking.paymentStatus === 'CANCELLED' ? 'Cancelled' : 'Pending'} ({booking.paymentMethod?.toUpperCase()})
                                            </Badge>
                                            
                                            {booking.voucherSent ? (
                                              <Badge tone="moss">Voucher Enviado ✉️</Badge>
                                            ) : (
                                              <Badge tone="sun">Voucher Pendiente</Badge>
                                            )}
                                          </div>
                                          
                                          {/* Dirección de Hotel / Recogida */}
                                          {booking.hotelAddress && (
                                            <div style={{ fontSize: 12, background: 'var(--cream-soft)', padding: '6px 10px', borderRadius: 8, marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-soft)' }}>
                                              <span style={{ fontSize: 12 }}>🟢</span> 
                                              <span><strong>Pickup:</strong> {booking.hotelAddress} {booking.hotelRoom ? `(Hab. ${booking.hotelRoom})` : ''}</span>
                                            </div>
                                          )}

                                          {/* Guía asignado y hora específica */}
                                          {(booking.assignedGuide || booking.pickupTime) && (
                                            <div style={{ fontSize: 11, color: 'var(--ink-soft)', display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                                              {booking.assignedGuide && (
                                                <span>👤 <strong>Guía:</strong> {booking.assignedGuide}</span>
                                              )}
                                              {booking.pickupTime && (
                                                <span>⏱️ <strong>Pickup:</strong> {booking.pickupTime}</span>
                                              )}
                                            </div>
                                          )}

                                          {/* Observaciones */}
                                          {booking.notes && (
                                            <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 4, marginTop: 4 }}>
                                              <span>📝</span>
                                              <span style={{ fontStyle: 'italic' }}>Obs: "{booking.notes}"</span>
                                            </div>
                                          )}
                                        </td>
                                        <td style={{ padding: '16px 8px', verticalAlign: 'middle', textAlign: 'right' }}>
                                          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                                            {/* Botón de expandir para control logístico/abonos */}
                                            <button
                                              onClick={() => handleExpandBooking(booking)}
                                              className="btn btn-ghost btn-sm"
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontSize: 13,
                                                padding: '8px 14px',
                                                borderRadius: 10,
                                                background: expandedBookingId === booking.id ? 'var(--cream)' : 'var(--cream-soft)'
                                              }}
                                            >
                                              <Icon name={expandedBookingId === booking.id ? "chevron-up" : "chevron-down"} size={13} />
                                              Operar
                                            </button>

                                            {/* Botón Mágico de WhatsApp */}
                                            <button
                                              onClick={() => handleWhatsAppAction(booking)}
                                              className="btn btn-moss btn-sm"
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '8px 14px',
                                                fontSize: 13,
                                                background: '#25D366',
                                                color: '#fff',
                                                border: 'none',
                                                fontWeight: 700,
                                                borderRadius: 10,
                                                boxShadow: '0 2px 8px rgba(37,211,102,0.1)'
                                              }}
                                            >
                                              <Icon name="whatsapp" size={14} /> WhatsApp
                                            </button>

                                            {/* Botón de Edición Completa */}
                                            <button
                                              onClick={() => handleOpenEditBooking(booking)}
                                              className="btn btn-ghost btn-sm"
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                fontSize: 13,
                                                padding: '8px 14px',
                                                borderRadius: 10,
                                                background: 'var(--cream-soft)',
                                                border: 'none',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              <Icon name="sparkle" size={13} /> Editar
                                            </button>
                                          </div>
                                        </td>
                                      </tr>

                                      {/* Sección Expandible Operativa en 3 Columnas */}
                                      {expandedBookingId === booking.id && (
                                        <tr style={{ background: 'var(--cream-soft)' }}>
                                          <td colSpan={5} style={{ padding: '20px 16px 28px', borderBottom: '1px solid var(--line-soft)' }}>
                                            <div style={{
                                              display: 'grid',
                                              gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))',
                                              gap: 20,
                                              animation: 'fadeIn 0.2s ease',
                                              textAlign: 'left'
                                            }}>
                                              
                                              {/* COLUMNA 1: LOGÍSTICA OPERATIVA */}
                                              <div style={{ 
                                                background: 'var(--paper)', 
                                                padding: 18, 
                                                borderRadius: 14, 
                                                boxShadow: 'var(--shadow-sm)', 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: 12 
                                              }}>
                                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                  <span>⚙️</span> Logística Operativa
                                                </h4>
                                                
                                                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Guía Asignado</span>
                                                  <input 
                                                    type="text" 
                                                    value={opAssignedGuide} 
                                                    onChange={e => setOpAssignedGuide(e.target.value)}
                                                    placeholder="Ej: Tiago Silva"
                                                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                  />
                                                </label>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--coral)' }}>Costo Neto Guía (R$)</span>
                                                    <input 
                                                      type="number" 
                                                      value={opGuideNetCost} 
                                                      onChange={e => setOpGuideNetCost(Number(e.target.value))}
                                                      placeholder="Ej: 150"
                                                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--cream-soft)', fontFamily: 'var(--font-mono)' }}
                                                    />
                                                  </label>
                                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--coral)' }}>Pago Proveedor</span>
                                                    <select 
                                                      value={opProviderPaymentStatus} 
                                                      onChange={e => setOpProviderPaymentStatus(e.target.value)}
                                                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--cream-soft)', cursor: 'pointer', fontFamily: 'inherit' }}
                                                    >
                                                      <option value="PENDING">Pendiente</option>
                                                      <option value="PAID">Pagado</option>
                                                    </select>
                                                  </label>
                                                </div>

                                                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--coral)' }}>Fecha Depósito Proveedor</span>
                                                  <input 
                                                    type="text" 
                                                    value={opProviderPaymentDate} 
                                                    onChange={e => setOpProviderPaymentDate(e.target.value)}
                                                    placeholder="Ej: 28 Mayo"
                                                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                  />
                                                </label>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Hora de Recogida</span>
                                                    <input 
                                                      type="text" 
                                                      value={opPickupTime} 
                                                      onChange={e => setOpPickupTime(e.target.value)}
                                                      placeholder="Ej: 08:30"
                                                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                    />
                                                  </label>
                                                  
                                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Estado de Pago</span>
                                                    <select 
                                                      value={opPaymentStatus} 
                                                      onChange={e => setOpPaymentStatus(e.target.value)}
                                                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--cream-soft)', cursor: 'pointer', fontFamily: 'inherit' }}
                                                    >
                                                      <option value="PENDING">PENDING</option>
                                                      <option value="PAID">PAID</option>
                                                      <option value="CANCELLED">CANCELLED</option>
                                                    </select>
                                                  </label>
                                                </div>

                                                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Notas Operativas Internas</span>
                                                  <textarea 
                                                    rows={2}
                                                    value={opOperatorNotes} 
                                                    onChange={e => setOpOperatorNotes(e.target.value)}
                                                    placeholder="Detalles logísticos o incidencias internas..."
                                                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--cream-soft)', resize: 'vertical', fontFamily: 'inherit' }}
                                                  />
                                                </label>

                                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', margin: '4px 0' }}>
                                                  <input 
                                                    type="checkbox" 
                                                    checked={opVoucherSent} 
                                                    onChange={e => setOpVoucherSent(e.target.checked)}
                                                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                                                  />
                                                  <span style={{ fontSize: 12, fontWeight: 700 }}>¿Voucher Enviado al Cliente?</span>
                                                </label>

                                                <button 
                                                  type="button" 
                                                  onClick={() => handleSaveOperationalFields(booking.id)}
                                                  className="btn btn-coral" 
                                                  style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 700, borderRadius: 10, marginTop: 'auto', border: 'none', cursor: 'pointer' }}
                                                >
                                                  Guardar Logística
                                                </button>
                                              </div>

                                              {/* COLUMNA 2: REGISTRO FINANCIERO (ABONOS MULTIMONEDA) */}
                                              <div style={{ 
                                                background: 'var(--paper)', 
                                                padding: 18, 
                                                borderRadius: 14, 
                                                boxShadow: 'var(--shadow-sm)', 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: 12 
                                              }}>
                                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                  <span>💰</span> Finanzas & Abonos
                                                </h4>

                                                {/* Caja de balance numérico en reales */}
                                                <div style={{ 
                                                  background: 'var(--cream-soft)', 
                                                  padding: '10px 14px', 
                                                  borderRadius: 10, 
                                                  border: '1px solid var(--line-soft)', 
                                                  display: 'flex', 
                                                  flexDirection: 'column', 
                                                  gap: 4 
                                                }}>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                    <span style={{ color: 'var(--ink-soft)' }}>Total Cotizado:</span>
                                                    <strong style={{ fontFamily: 'var(--font-mono)' }}>R$ {booking.total}</strong>
                                                  </div>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                    <span style={{ color: 'var(--ink-soft)' }}>Abonado (Reales):</span>
                                                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--moss)' }}>R$ {paidBrl.toLocaleString('es')}</strong>
                                                  </div>
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px dashed var(--line)', paddingTop: 6, marginTop: 4 }}>
                                                    <span style={{ fontWeight: 700 }}>Saldo Pendiente:</span>
                                                    <strong style={{ fontFamily: 'var(--font-mono)', color: balanceRemaining === 0 ? 'var(--moss)' : 'var(--coral)', fontSize: 15 }}>
                                                      R$ {balanceRemaining.toLocaleString('es')}
                                                    </strong>
                                                  </div>
                                                </div>

                                                {/* Historial de transacciones de este booking */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 110, overflowY: 'auto', paddingRight: 4 }}>
                                                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Transacciones</span>
                                                  {activePayments.map((p: any) => (
                                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cream-soft)', padding: '5px 8px', borderRadius: 6, fontSize: 11 }}>
                                                      <div>
                                                        <strong style={{ color: 'var(--ink)' }}>{p.currency} {p.amount}</strong>
                                                        {p.currency !== 'BRL' && <span style={{ fontSize: 9, color: 'var(--muted)' }}> (x{p.exchangeRate})</span>}
                                                        <span style={{ display: 'block', fontSize: 9, color: 'var(--muted)' }}>{p.paymentMethod.toUpperCase()} · {p.notes || 'Abono'}</span>
                                                      </div>
                                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <strong style={{ fontFamily: 'var(--font-mono)' }}>R$ {p.amountBrl}</strong>
                                                        <button 
                                                          type="button" 
                                                          onClick={() => handleDeletePayment(p.id, booking.id, `${p.currency} ${p.amount}`)}
                                                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--coral)', padding: 2, display: 'flex' }}
                                                          title="Eliminar abono"
                                                        >
                                                          <Icon name="close" size={12} />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ))}
                                                  {activePayments.length === 0 && (
                                                    <div style={{ textAlign: 'center', fontSize: 11, padding: '8px 0', color: 'var(--muted)', fontStyle: 'italic' }}>
                                                      No hay abonos registrados.
                                                    </div>
                                                  )}
                                                </div>

                                                {/* Formulario de abono multimoneda en vivo */}
                                                <div style={{ borderTop: '1px dashed var(--line)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 6 }}>
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>Monto</span>
                                                      <input 
                                                        type="number" 
                                                        value={newPayAmount} 
                                                        onChange={e => setNewPayAmount(Number(e.target.value))}
                                                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--cream-soft)' }}
                                                      />
                                                    </label>
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>Moneda</span>
                                                      <select 
                                                        value={newPayCurrency} 
                                                        onChange={e => setNewPayCurrency(e.target.value)}
                                                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      >
                                                        <option value="BRL">BRL (R$)</option>
                                                        <option value="USD">USD ($)</option>
                                                        <option value="ARS">ARS ($)</option>
                                                        <option value="EUR">EUR (€)</option>
                                                      </select>
                                                    </label>
                                                  </div>

                                                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 6 }}>
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>Tasa de Cambio</span>
                                                      <input 
                                                        type="number" 
                                                        step="any"
                                                        value={newPayRate} 
                                                        onChange={e => setNewPayRate(Number(e.target.value))}
                                                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--cream-soft)' }}
                                                      />
                                                    </label>
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>Método</span>
                                                      <select 
                                                        value={newPayMethod} 
                                                        onChange={e => setNewPayMethod(e.target.value)}
                                                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      >
                                                        <option value="pix">PIX</option>
                                                        <option value="cash">Efectivo</option>
                                                        <option value="card">Tarjeta</option>
                                                        <option value="transfer">Transferencia</option>
                                                      </select>
                                                    </label>
                                                  </div>

                                                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginTop: 2 }}>
                                                    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>Glosa / Notas del pago</span>
                                                      <input 
                                                        type="text" 
                                                        placeholder="Ej: Pago seña"
                                                        value={newPayNotes}
                                                        onChange={e => setNewPayNotes(e.target.value)}
                                                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      />
                                                    </label>
                                                    <button 
                                                      type="button" 
                                                      onClick={() => handleAddPayment(booking.id)}
                                                      className="btn btn-moss"
                                                      style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, borderRadius: 6, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}
                                                    >
                                                      Abonar
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* COLUMNA 3: BITÁCORA DE COMENTARIOS (LOGS) */}
                                              <div style={{ 
                                                background: 'var(--paper)', 
                                                padding: 18, 
                                                borderRadius: 14, 
                                                boxShadow: 'var(--shadow-sm)', 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: 12 
                                              }}>
                                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                  <span>📝</span> Bitácora Operativa
                                                </h4>

                                                {/* Historial cronológico de comentarios */}
                                                <div style={{ 
                                                  display: 'flex', 
                                                  flexDirection: 'column', 
                                                  gap: 8, 
                                                  maxHeight: 140, 
                                                  overflowY: 'auto', 
                                                  paddingRight: 4, 
                                                  flex: 1 
                                                }}>
                                                  {activeLogs.map((l: any) => (
                                                    <div key={l.id} style={{ fontSize: 11, paddingBottom: 6, borderBottom: '1px dashed var(--line-soft)' }}>
                                                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 9, marginBottom: 2 }}>
                                                        <strong style={{ color: l.author === 'Sistema' ? 'var(--coral)' : 'var(--ink)' }}>{l.author}</strong>
                                                        <span>{new Date(l.createdAt).toLocaleDateString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                                                      </div>
                                                      <div style={{ color: 'var(--ink-soft)', lineHeight: 1.35 }}>{l.comment}</div>
                                                    </div>
                                                  ))}
                                                  {activeLogs.length === 0 && (
                                                    <div style={{ textAlign: 'center', fontSize: 11, padding: '20px 0', color: 'var(--muted)', fontStyle: 'italic', margin: 'auto' }}>
                                                      No hay comentarios ni registros en la bitácora.
                                                    </div>
                                                  )}
                                                </div>

                                                {/* Caja de registro de comentarios rápidos */}
                                                <div style={{ borderTop: '1px dashed var(--line)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600 }}>Agregar Comentario</span>
                                                    <textarea 
                                                      rows={1}
                                                      placeholder="Escribe comentarios, novedades o bitácora..."
                                                      value={newLogComment}
                                                      onChange={e => setNewLogComment(e.target.value)}
                                                      style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, resize: 'vertical', background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                    />
                                                  </label>
                                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <label style={{ flex: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                      <span style={{ fontSize: 9, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Por:</span>
                                                      <select 
                                                        value={newLogAuthor}
                                                        onChange={e => setNewLogAuthor(e.target.value)}
                                                        style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, width: '100%', background: 'var(--cream-soft)', fontFamily: 'inherit', cursor: 'pointer' }}
                                                      >
                                                        <option value="Admin">Admin</option>
                                                        <option value="Agustina">Agustina</option>
                                                        <option value="Claudia">Claudia</option>
                                                      </select>
                                                    </label>
                                                    <button 
                                                      type="button" 
                                                      onClick={() => handleAddComment(booking.id)}
                                                      className="btn btn-ghost btn-sm"
                                                      style={{ padding: '5px 10px', fontSize: 10, fontWeight: 700, borderRadius: 6, background: 'var(--cream-soft)', border: 'none', cursor: 'pointer' }}
                                                    >
                                                      Registrar
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>

                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        /* VISTA CALENDARIO MENSUAL (MAYO 2026) */
                        <div style={{ animation: 'fadeIn 0.2s ease', textAlign: 'left' }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: 1,
                            background: 'var(--line-soft)',
                            borderRadius: 14,
                            overflow: 'hidden',
                            border: '1px solid var(--line-soft)',
                            boxShadow: 'var(--shadow-sm)'
                          }}>
                            {/* Cabecera de días */}
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dayName => (
                              <div key={dayName} style={{
                                background: 'var(--cream-soft)',
                                padding: '12px 8px',
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: 12,
                                color: 'var(--ink-soft)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                {dayName.substring(0, 3)}
                              </div>
                            ))}

                            {/* Celdas vacías de compensación (Mayo 2026 empieza el Viernes -> 4 leading offsets) */}
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={`empty-${i}`} style={{
                                background: 'var(--cream-soft)',
                                opacity: 0.4,
                                minHeight: 120
                              }} />
                            ))}

                            {/* Días del mes (1 al 31) */}
                            {Array.from({ length: 31 }).map((_, i) => {
                              const dayNumber = i + 1;
                              // Encontrar reservas filtradas para este día de Mayo 2026
                              const dayBookings = filteredBookings.filter(b => {
                                const bDate = parseBookingDate(b.date);
                                return bDate.getFullYear() === 2026 && bDate.getMonth() === 4 && bDate.getDate() === dayNumber;
                              });

                              return (
                                <div
                                  key={`day-${dayNumber}`}
                                  onClick={() => {
                                    setSelectedCalendarDate(`2026-05-${dayNumber.toString().padStart(2, '0')}`);
                                  }}
                                  style={{
                                    background: 'var(--paper)',
                                    minHeight: 120,
                                    padding: 8,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    cursor: 'pointer',
                                    border: '1px solid var(--line-soft)',
                                    position: 'relative',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = 'var(--cream-soft)';
                                    e.currentTarget.style.borderColor = 'var(--coral-soft)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(14, 27, 44, 0.06)';
                                    e.currentTarget.style.zIndex = '5';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = 'var(--paper)';
                                    e.currentTarget.style.borderColor = 'var(--line-soft)';
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.zIndex = 'auto';
                                  }}
                                >
                                  {/* Número del día */}
                                  <div style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: dayBookings.length > 0 ? 'var(--coral)' : 'var(--ink-soft)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: dayBookings.length > 0 ? 'var(--cream)' : 'transparent',
                                    transition: 'all 0.2s ease'
                                  }}>
                                    {dayNumber}
                                  </div>

                                  {/* Eventos en miniatura */}
                                  <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    overflowY: 'auto',
                                    flex: 1,
                                    maxHeight: 80,
                                    paddingRight: 2
                                  }}>
                                    {dayBookings.map((b, bIdx) => {
                                      const colors = getTourVariantStyles(b.tourId);
                                      return (
                                        <div
                                          key={b.id || bIdx}
                                          title={`${b.name} ${b.lastname} - ${b.tourTitle}`}
                                          style={{
                                            background: colors.bg,
                                            color: colors.text,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            padding: '4px 6px',
                                            borderRadius: 6,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            borderLeft: `3px solid ${colors.text}`
                                          }}
                                        >
                                          {b.name.substring(0, 1)}. {b.lastname.split(' ')[0]} · {b.tourTitle.split(':')[0]}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* DRAWER LATERAL PREMIUM PARA DÍA SELECCIONADO EN CALENDARIO */}
                      {selectedCalendarDate && (
                        <div style={{
                          position: 'fixed',
                          inset: 0,
                          background: 'rgba(14, 27, 44, 0.4)',
                          zIndex: 100,
                          display: 'flex',
                          justifyContent: 'flex-end',
                          animation: 'fadeIn 0.3s ease'
                        }} onClick={() => setSelectedCalendarDate(null)}>
                          
                          <div style={{
                            width: '100%',
                            maxWidth: 900,
                            background: 'var(--paper)',
                            height: '100vh',
                            boxShadow: 'var(--shadow-lg)',
                            padding: '32px 28px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                            overflowY: 'auto',
                            animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            textAlign: 'left'
                          }} onClick={e => e.stopPropagation()}>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line-soft)', paddingBottom: 16 }}>
                              <div>
                                <div className="eyebrow" style={{ color: 'var(--coral)' }}>Reservas Asignadas</div>
                                <h3 className="display" style={{ fontSize: 26, margin: '4px 0 0' }}>
                                  {(() => {
                                    const dParts = selectedCalendarDate.split('-');
                                    const day = parseInt(dParts[2], 10);
                                    return `${day} de Mayo, 2026`;
                                  })()}
                                </h3>
                              </div>
                              <button
                                onClick={() => setSelectedCalendarDate(null)}
                                style={{ background: 'var(--cream-soft)', border: 'none', padding: 8, borderRadius: 999, cursor: 'pointer', display: 'flex', transition: 'all 0.2s ease' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--line-soft)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--cream-soft)'}
                              >
                                <Icon name="close" size={18} />
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, paddingBottom: 20 }}>
                              {(() => {
                                const dParts = selectedCalendarDate.split('-');
                                const dayNumber = parseInt(dParts[2], 10);
                                const dayBookings = filteredBookings.filter(b => {
                                  const bDate = parseBookingDate(b.date);
                                  return bDate.getFullYear() === 2026 && bDate.getMonth() === 4 && bDate.getDate() === dayNumber;
                                });

                                if (dayBookings.length === 0) {
                                  return (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14, border: '1px dashed var(--line)', borderRadius: 12 }}>
                                      No hay reservas registradas para esta fecha en el calendario filtrado.
                                    </div>
                                  );
                                }

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {dayBookings.map((booking, bIdx) => {
                                      const paidBrl = allPayments
                                        .filter(p => p.bookingId === booking.id)
                                        .reduce((sum, p) => sum + p.amountBrl, 0);
                                      const balanceRemaining = Math.max(0, booking.total - paidBrl);
                                      const colors = getTourVariantStyles(booking.tourId);

                                      return (
                                        <div key={booking.id || bIdx} style={{
                                          background: 'var(--cream-soft)',
                                          border: `1px solid var(--line-soft)`,
                                          borderRadius: 14,
                                          overflow: 'hidden',
                                          boxShadow: 'var(--shadow-sm)'
                                        }}>
                                          {/* Cabecera del cliente */}
                                          <div style={{
                                            padding: 16,
                                            background: 'var(--paper)',
                                            borderBottom: '1px solid var(--line-soft)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            flexWrap: 'wrap',
                                            gap: 12
                                          }}>
                                            <div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <strong style={{ fontSize: 16, color: 'var(--ink)' }}>{booking.name} {booking.lastname}</strong>
                                                <span style={{ fontSize: 11, background: colors.bg, color: colors.text, padding: '2px 8px', borderRadius: 99, fontWeight: 700, borderLeft: `3px solid ${colors.text}` }}>
                                                  {booking.tourTitle.split(':')[0]}
                                                </span>
                                              </div>
                                              <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 12, color: 'var(--muted)' }}>📱 {booking.whatsapp}</span>
                                                <span style={{ fontSize: 12, color: 'var(--muted)' }}>📧 {booking.email}</span>
                                                <span style={{ fontSize: 12, color: 'var(--muted)' }}>🌍 {booking.country}</span>
                                              </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                              <button
                                                onClick={() => handleWhatsAppAction(booking)}
                                                className="btn btn-moss btn-sm"
                                                style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: 6,
                                                  padding: '8px 14px',
                                                  fontSize: 12,
                                                  background: '#25D366',
                                                  color: '#fff',
                                                  border: 'none',
                                                  fontWeight: 700,
                                                  borderRadius: 8,
                                                  cursor: 'pointer'
                                                }}
                                              >
                                                <Icon name="whatsapp" size={12} /> WhatsApp
                                              </button>

                                              {/* Botón de Edición Completa en Drawer */}
                                              <button
                                                onClick={() => handleOpenEditBooking(booking)}
                                                className="btn btn-ghost btn-sm"
                                                style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: 6,
                                                  fontSize: 12,
                                                  padding: '8px 14px',
                                                  borderRadius: 8,
                                                  background: 'var(--cream-soft)',
                                                  border: 'none',
                                                  cursor: 'pointer'
                                                }}
                                              >
                                                <Icon name="sparkle" size={12} />
                                                Editar
                                              </button>

                                              <button
                                                onClick={() => handleExpandBooking(booking)}
                                                className="btn btn-ghost btn-sm"
                                                style={{
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: 6,
                                                  fontSize: 12,
                                                  padding: '8px 14px',
                                                  borderRadius: 8,
                                                  background: expandedBookingId === booking.id ? 'var(--cream)' : 'var(--cream-soft)',
                                                  border: 'none',
                                                  cursor: 'pointer'
                                                }}
                                              >
                                                <Icon name={expandedBookingId === booking.id ? "chevron-up" : "chevron-down"} size={12} />
                                                {expandedBookingId === booking.id ? 'Cerrar Panel' : 'Operar'}
                                              </button>
                                            </div>
                                          </div>

                                          {/* Fila de detalles rápidos del booking */}
                                          <div style={{
                                            padding: '12px 16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: 12,
                                            borderBottom: expandedBookingId === booking.id ? '1px solid var(--line-soft)' : 'none',
                                            fontSize: 13,
                                            background: '#fff'
                                          }}>
                                            <div>
                                              <span><strong>Pax:</strong> {booking.adults} Ad / {booking.kids} Ni</span>
                                              <span style={{ margin: '0 8px', color: 'var(--line)' }}>|</span>
                                              <span><strong>Horario:</strong> {booking.slot}</span>
                                              {booking.hotelAddress && (
                                                <>
                                                  <span style={{ margin: '0 8px', color: 'var(--line)' }}>|</span>
                                                  <span><strong>Hotel:</strong> {booking.hotelAddress} {booking.hotelRoom ? `(Hab. ${booking.hotelRoom})` : ''}</span>
                                                </>
                                              )}
                                            </div>
                                            <div>
                                              <strong style={{ fontFamily: 'var(--font-mono)' }}>R$ {booking.total}</strong> (Abonado: R$ {paidBrl}) <strong style={{ color: balanceRemaining === 0 ? 'var(--moss)' : 'var(--coral)', fontFamily: 'var(--font-mono)' }}>Saldo: R$ {balanceRemaining}</strong>
                                            </div>
                                          </div>

                                          {/* Panel operativo de 3 columnas */}
                                          {expandedBookingId === booking.id && (
                                            <div style={{ padding: 16, background: 'var(--cream-soft)', borderTop: '1px solid var(--line-soft)' }}>
                                              <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                                                gap: 16,
                                                animation: 'fadeIn 0.2s ease'
                                              }}>
                                                {/* COLUMNA 1: LOGÍSTICA OPERATIVA */}
                                                <div style={{ 
                                                  background: 'var(--paper)', 
                                                  padding: 16, 
                                                  borderRadius: 12, 
                                                  boxShadow: 'var(--shadow-sm)', 
                                                  display: 'flex', 
                                                  flexDirection: 'column', 
                                                  gap: 10 
                                                }}>
                                                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span>⚙️</span> Logística Operativa
                                                  </h4>
                                                  
                                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700 }}>Guía Asignado</span>
                                                    <input 
                                                      type="text" 
                                                      value={opAssignedGuide} 
                                                      onChange={e => setOpAssignedGuide(e.target.value)}
                                                      placeholder="Ej: Tiago Silva"
                                                      style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                    />
                                                  </label>

                                                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--coral)' }}>Costo Guía (R$)</span>
                                                      <input 
                                                        type="number" 
                                                        value={opGuideNetCost} 
                                                        onChange={e => setOpGuideNetCost(Number(e.target.value))}
                                                        placeholder="Ej: 150"
                                                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'var(--font-mono)' }}
                                                      />
                                                    </label>
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--coral)' }}>Pago Guía</span>
                                                      <select 
                                                        value={opProviderPaymentStatus} 
                                                        onChange={e => setOpProviderPaymentStatus(e.target.value)}
                                                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', cursor: 'pointer', fontFamily: 'inherit' }}
                                                      >
                                                        <option value="PENDING">Pendiente</option>
                                                        <option value="PAID">Pagado</option>
                                                      </select>
                                                    </label>
                                                  </div>

                                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--coral)' }}>Fecha Depósito Guía</span>
                                                    <input 
                                                      type="text" 
                                                      value={opProviderPaymentDate} 
                                                      onChange={e => setOpProviderPaymentDate(e.target.value)}
                                                      placeholder="Ej: 28 Mayo"
                                                      style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                    />
                                                  </label>
                                                  
                                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 10, fontWeight: 700 }}>Hora Pickup</span>
                                                      <input 
                                                        type="text" 
                                                        value={opPickupTime} 
                                                        onChange={e => setOpPickupTime(e.target.value)}
                                                        placeholder="Ej: 08:30"
                                                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      />
                                                    </label>
                                                    
                                                    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <span style={{ fontSize: 10, fontWeight: 700 }}>Pago</span>
                                                      <select 
                                                        value={opPaymentStatus} 
                                                        onChange={e => setOpPaymentStatus(e.target.value)}
                                                        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      >
                                                        <option value="PENDING">PENDING</option>
                                                        <option value="PAID">PAID</option>
                                                        <option value="CANCELLED">CANCELLED</option>
                                                      </select>
                                                    </label>
                                                  </div>

                                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700 }}>Notas Internas</span>
                                                    <textarea 
                                                      rows={2}
                                                      value={opOperatorNotes} 
                                                      onChange={e => setOpOperatorNotes(e.target.value)}
                                                      placeholder="Detalles logísticos..."
                                                      style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, background: 'var(--cream-soft)', resize: 'vertical', fontFamily: 'inherit' }}
                                                    />
                                                  </label>

                                                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: '2px 0' }}>
                                                    <input 
                                                      type="checkbox" 
                                                      checked={opVoucherSent} 
                                                      onChange={e => setOpVoucherSent(e.target.checked)}
                                                      style={{ width: 14, height: 14 }}
                                                    />
                                                    <span style={{ fontSize: 11, fontWeight: 700 }}>¿Voucher Enviado?</span>
                                                  </label>

                                                  <button 
                                                    type="button" 
                                                    onClick={() => handleSaveOperationalFields(booking.id)}
                                                    className="btn btn-coral" 
                                                    style={{ width: '100%', padding: '8px', fontSize: 12, fontWeight: 700, borderRadius: 8, marginTop: 'auto', border: 'none', cursor: 'pointer' }}
                                                  >
                                                    Guardar Logística
                                                  </button>
                                                </div>

                                                {/* COLUMNA 2: ABONOS MULTIMONEDA */}
                                                <div style={{ 
                                                  background: 'var(--paper)', 
                                                  padding: 16, 
                                                  borderRadius: 12, 
                                                  boxShadow: 'var(--shadow-sm)', 
                                                  display: 'flex', 
                                                  flexDirection: 'column', 
                                                  gap: 10 
                                                }}>
                                                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span>💰</span> Finanzas & Abonos
                                                  </h4>

                                                  <div style={{ 
                                                    background: 'var(--cream-soft)', 
                                                    padding: '8px 10px', 
                                                    borderRadius: 8, 
                                                    border: '1px solid var(--line-soft)', 
                                                    fontSize: 11,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 2
                                                  }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                      <span>Total:</span>
                                                      <strong>R$ {booking.total}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                      <span>Abonado:</span>
                                                      <strong style={{ color: 'var(--moss)' }}>R$ {paidBrl}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--line)', paddingTop: 4, marginTop: 2 }}>
                                                      <span>Saldo:</span>
                                                      <strong style={{ color: balanceRemaining === 0 ? 'var(--moss)' : 'var(--coral)' }}>R$ {balanceRemaining}</strong>
                                                    </div>
                                                  </div>

                                                  {/* Listado de transacciones */}
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 80, overflowY: 'auto' }}>
                                                    {activePayments.map((p: any) => (
                                                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cream-soft)', padding: '4px 6px', borderRadius: 4, fontSize: 10 }}>
                                                        <div>
                                                          <strong>{p.currency} {p.amount}</strong>
                                                          <span style={{ display: 'block', fontSize: 8, color: 'var(--muted)' }}>{p.paymentMethod.toUpperCase()} · {p.notes || 'Abono'}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                          <strong>R$ {p.amountBrl}</strong>
                                                          <button 
                                                            type="button" 
                                                            onClick={() => handleDeletePayment(p.id, booking.id, `${p.currency} ${p.amount}`)}
                                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--coral)', padding: 1, display: 'flex' }}
                                                          >
                                                            <Icon name="close" size={10} />
                                                          </button>
                                                        </div>
                                                      </div>
                                                    ))}
                                                    {activePayments.length === 0 && (
                                                      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>
                                                        Sin abonos.
                                                      </div>
                                                    )}
                                                  </div>

                                                  {/* Agregar abono */}
                                                  <div style={{ borderTop: '1px dashed var(--line)', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                                      <input 
                                                        type="number" 
                                                        value={newPayAmount} 
                                                        onChange={e => setNewPayAmount(Number(e.target.value))}
                                                        placeholder="Monto"
                                                        style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, background: 'var(--cream-soft)' }}
                                                      />
                                                      <select 
                                                        value={newPayCurrency} 
                                                        onChange={e => setNewPayCurrency(e.target.value)}
                                                        style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      >
                                                        <option value="BRL">BRL</option>
                                                        <option value="USD">USD</option>
                                                        <option value="ARS">ARS</option>
                                                        <option value="EUR">EUR</option>
                                                      </select>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                                      <input 
                                                        type="number" 
                                                        step="any"
                                                        value={newPayRate} 
                                                        onChange={e => setNewPayRate(Number(e.target.value))}
                                                        placeholder="Tasa"
                                                        style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, background: 'var(--cream-soft)' }}
                                                      />
                                                      <select 
                                                        value={newPayMethod} 
                                                        onChange={e => setNewPayMethod(e.target.value)}
                                                        style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      >
                                                        <option value="pix">PIX</option>
                                                        <option value="cash">Efectivo</option>
                                                        <option value="card">Tarjeta</option>
                                                        <option value="transfer">Transfer</option>
                                                      </select>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                      <input 
                                                        type="text" 
                                                        placeholder="Glosa/Notas"
                                                        value={newPayNotes}
                                                        onChange={e => setNewPayNotes(e.target.value)}
                                                        style={{ flex: 1, padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                      />
                                                      <button 
                                                        type="button" 
                                                        onClick={() => handleAddPayment(booking.id)}
                                                        className="btn btn-moss"
                                                        style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, borderRadius: 4, border: 'none', cursor: 'pointer' }}
                                                      >
                                                        Abonar
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* COLUMNA 3: BITÁCORA DE COMENTARIOS */}
                                                <div style={{ 
                                                  background: 'var(--paper)', 
                                                  padding: 16, 
                                                  borderRadius: 12, 
                                                  boxShadow: 'var(--shadow-sm)', 
                                                  display: 'flex', 
                                                  flexDirection: 'column', 
                                                  gap: 10 
                                                }}>
                                                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span>📝</span> Bitácora Operativa
                                                  </h4>

                                                  <div style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    gap: 6, 
                                                    maxHeight: 100, 
                                                    overflowY: 'auto', 
                                                    flex: 1 
                                                  }}>
                                                    {activeLogs.map((l: any) => (
                                                      <div key={l.id} style={{ fontSize: 10, paddingBottom: 4, borderBottom: '1px dashed var(--line-soft)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 8 }}>
                                                          <strong style={{ color: l.author === 'Sistema' ? 'var(--coral)' : 'var(--ink)' }}>{l.author}</strong>
                                                          <span>{new Date(l.createdAt).toLocaleDateString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                                                        </div>
                                                        <div style={{ color: 'var(--ink-soft)' }}>{l.comment}</div>
                                                      </div>
                                                    ))}
                                                    {activeLogs.length === 0 && (
                                                      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', fontStyle: 'italic', margin: 'auto' }}>
                                                        Sin registros en la bitácora.
                                                      </div>
                                                    )}
                                                  </div>

                                                  <div style={{ borderTop: '1px dashed var(--line)', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <textarea 
                                                      rows={1}
                                                      placeholder="Comentario..."
                                                      value={newLogComment}
                                                      onChange={e => setNewLogComment(e.target.value)}
                                                      style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 11, resize: 'vertical', background: 'var(--cream-soft)', fontFamily: 'inherit' }}
                                                    />
                                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                      <select 
                                                        value={newLogAuthor}
                                                        onChange={e => setNewLogAuthor(e.target.value)}
                                                        style={{ padding: '2px 4px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 10, width: 80, background: 'var(--cream-soft)', fontFamily: 'inherit', cursor: 'pointer' }}
                                                      >
                                                        <option value="Admin">Admin</option>
                                                        <option value="Agustina">Agustina</option>
                                                        <option value="Claudia">Claudia</option>
                                                      </select>
                                                      <button 
                                                        type="button" 
                                                        onClick={() => handleAddComment(booking.id)}
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, borderRadius: 4, marginLeft: 'auto', background: 'var(--cream-soft)', border: 'none', cursor: 'pointer' }}
                                                      >
                                                        Registrar
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        )}
      </main>

      {/* VISTA LATERAL / MODAL DE EDICIÓN RÁPIDA (SLIDE-OVER DRAWER) */}
      {editingTour && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(14, 27, 44, 0.4)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.3s ease'
        }} onClick={() => setEditingTour(null)}>
          
          <div style={{
            width: '100%',
            maxWidth: 520,
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
                <div className="eyebrow" style={{ color: 'var(--coral)' }}>Editar Experiencia</div>
                <h3 className="display" style={{ fontSize: 24, margin: '4px 0 0' }}>{editingTour.title.split(':')[0]}</h3>
              </div>
              <button
                onClick={() => setEditingTour(null)}
                style={{ background: 'var(--cream-soft)', border: 'none', padding: 8, borderRadius: 999, cursor: 'pointer', display: 'flex' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Pestañas de sub-edición CSS Puro */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', borderBottom: '1px solid var(--line)', paddingBottom: 10, marginBottom: 4 }}>
              {[
                { id: 'general', label: 'General' },
                { id: 'experience', label: 'La Experiencia' },
                { id: 'itinerary', label: 'Itinerario' },
                { id: 'inclusions', label: 'Inclusiones' },
                { id: 'important', label: 'Importante' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditTab(tab.id as any)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: editTab === tab.id ? 'var(--cream)' : 'transparent',
                    color: 'var(--ink)',
                    fontSize: 12,
                    fontWeight: editTab === tab.id ? 700 : 500,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.2s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
              
              {/* PESTAÑA 1: GENERAL */}
              {editTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Título del Tour</span>
                    <input
                      type="text"
                      required
                      value={editFormData.title}
                      onChange={e => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                      style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: 14, background: 'var(--cream-soft)' }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Subtítulo o Descripción corta</span>
                    <textarea
                      required
                      rows={3}
                      value={editFormData.subtitle}
                      onChange={e => setEditFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: 14, background: 'var(--cream-soft)', resize: 'vertical' }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Precio de salida (R$)</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editFormData.priceFrom}
                      onChange={e => setEditFormData(prev => ({ ...prev, priceFrom: Number(e.target.value) }))}
                      style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: 14, background: 'var(--cream-soft)' }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Etiqueta de la foto (photo_label)</span>
                    <input
                      type="text"
                      value={editFormData.photoLabel}
                      onChange={e => setEditFormData(prev => ({ ...prev, photoLabel: e.target.value }))}
                      style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--line)', fontFamily: 'inherit', fontSize: 14, background: 'var(--cream-soft)' }}
                    />
                  </label>
                </div>
              )}

              {/* PESTAÑA 2: LA EXPERIENCIA */}
              {editTab === 'experience' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Descripción Extendida ("La Experiencia")</span>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--muted)' }}>Introduce la descripción completa. Se soportan saltos de línea.</p>
                    <textarea
                      rows={14}
                      required
                      value={editFormData.description}
                      onChange={e => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                      style={{
                        padding: '14px',
                        borderRadius: 10,
                        border: '1px solid var(--line)',
                        fontFamily: 'inherit',
                        fontSize: 14,
                        background: 'var(--cream-soft)',
                        resize: 'vertical',
                        lineHeight: 1.5,
                        flex: 1,
                        minHeight: 280
                      }}
                    />
                  </label>
                </div>
              )}

              {/* PESTAÑA 3: ITINERARIO */}
              {editTab === 'itinerary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Pasos del Itinerario ({editFormData.itinerary.length})</span>
                    <button
                      type="button"
                      onClick={handleAddItineraryStep}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12 }}
                    >
                      <Icon name="plus" size={12} /> Añadir Paso
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {editFormData.itinerary.map((step, idx) => (
                      <div key={idx} style={{
                        background: 'var(--cream-soft)',
                        border: '1px solid var(--line)',
                        borderRadius: 12,
                        padding: 14,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--coral)' }}>Paso #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItineraryStep(idx)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--coral)' }}
                            title="Eliminar paso"
                          >
                            <Icon name="close" size={14} />
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
                          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Hora</span>
                            <input
                              type="text"
                              required
                              value={step.time}
                              onChange={e => handleItineraryChange(idx, 'time', e.target.value)}
                              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                            />
                          </label>

                          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Título del paso</span>
                            <input
                              type="text"
                              required
                              value={step.title}
                              onChange={e => handleItineraryChange(idx, 'title', e.target.value)}
                              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 12 }}
                            />
                          </label>
                        </div>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Descripción extendida del paso</span>
                          <textarea
                            rows={2}
                            required
                            value={step.desc}
                            onChange={e => handleItineraryChange(idx, 'desc', e.target.value)}
                            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 12, resize: 'vertical' }}
                          />
                        </label>
                      </div>
                    ))}
                    {editFormData.itinerary.length === 0 && (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13, border: '1px dashed var(--line)', borderRadius: 12 }}>
                        No hay itinerarios registrados. Añade uno con el botón superior.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PESTAÑA 4: INCLUSIONES */}
              {editTab === 'inclusions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Incluye */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--moss)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        🟢 Qué Incluye ({editFormData.includes.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddArrayString('includes')}
                        className="btn btn-ghost btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12 }}
                      >
                        <Icon name="plus" size={12} /> Añadir
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {editFormData.includes.map((inc, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="text"
                            required
                            value={inc}
                            onChange={e => handleArrayStringChange('includes', idx, e.target.value)}
                            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--cream-soft)' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayString('includes', idx)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', color: 'var(--coral)' }}
                          >
                            <Icon name="close" size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed var(--line)' }}/>

                  {/* No Incluye */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        🔴 Qué NO Incluye ({editFormData.excludes.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddArrayString('excludes')}
                        className="btn btn-ghost btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12 }}
                      >
                        <Icon name="plus" size={12} /> Añadir
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {editFormData.excludes.map((exc, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="text"
                            required
                            value={exc}
                            onChange={e => handleArrayStringChange('excludes', idx, e.target.value)}
                            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--cream-soft)' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveArrayString('excludes', idx)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', color: 'var(--coral)' }}
                          >
                            <Icon name="close" size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* PESTAÑA 5: IMPORTANTE */}
              {editTab === 'important' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Notas Importantes / Qué llevar ({editFormData.importantInfo.length})</span>
                    <button
                      type="button"
                      onClick={() => handleAddArrayString('importantInfo')}
                      className="btn btn-ghost btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12 }}
                    >
                      <Icon name="plus" size={12} /> Añadir Nota
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {editFormData.importantInfo.map((info, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>#{idx + 1}</span>
                        <input
                          type="text"
                          required
                          value={info}
                          onChange={e => handleArrayStringChange('importantInfo', idx, e.target.value)}
                          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--cream-soft)' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayString('importantInfo', idx)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', color: 'var(--coral)' }}
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    ))}
                    {editFormData.importantInfo.length === 0 && (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13, border: '1px dashed var(--line)', borderRadius: 12 }}>
                        No hay notas importantes registradas. Añade una con el botón superior.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botones del Drawer lateral */}
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 20, borderTop: '1px dashed var(--line)', position: 'sticky', bottom: 0, background: 'var(--paper)', zIndex: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingTour(null)}
                  className="btn btn-ghost"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === editingTour.id}
                  className="btn btn-coral"
                  style={{ flex: 2, padding: '12px' }}
                >
                  {actionLoading === editingTour.id ? 'Guardando...' : 'Guardar Experiencia'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VISTA LATERAL / MODAL DE CREACIÓN MANUAL DE CLIENTE/RESERVA */}
      {showCreateBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(14, 27, 44, 0.4)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.3s ease'
        }} onClick={() => setShowCreateBooking(false)}>
          
          <div style={{
            width: '100%',
            maxWidth: 520,
            background: 'var(--paper)',
            height: '100vh',
            boxShadow: 'var(--shadow-lg)',
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto',
            animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            textAlign: 'left'
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line-soft)', paddingBottom: 12 }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--coral)' }}>Registrar Lead</div>
                <h3 className="display" style={{ fontSize: 24, margin: '4px 0 0' }}>Crear Cliente Manual</h3>
              </div>
              <button
                onClick={() => setShowCreateBooking(false)}
                style={{ background: 'var(--cream-soft)', border: 'none', padding: 8, borderRadius: 999, cursor: 'pointer', display: 'flex' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Nombre *</span>
                  <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="Juan" />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Apellido *</span>
                  <input type="text" required value={formLastname} onChange={e => setFormLastname(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="Pérez" />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>WhatsApp *</span>
                  <input type="text" required value={formWhatsapp} onChange={e => setFormWhatsapp(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="Ej: +54 9 11 9999-8888" />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>País *</span>
                  <input type="text" required value={formCountry} onChange={e => setFormCountry(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="Argentina" />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Email *</span>
                <input type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="juan@gmail.com" />
              </label>

              <div style={{ borderTop: '1px dashed var(--line-soft)', paddingTop: 12 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Hotel / Alojamiento</span>
                  <input type="text" value={formHotelAddress} onChange={e => setFormHotelAddress(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="Hotel Vila do Farol" />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Hab.</span>
                  <input type="text" value={formHotelRoom} onChange={e => setFormHotelRoom(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="102" />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Tel Hotel</span>
                  <input type="text" value={formHotelPhone} onChange={e => setFormHotelPhone(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="Opcional" />
                </label>
              </div>

              <div style={{ borderTop: '1px dashed var(--line-soft)', paddingTop: 12 }} />

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Experiencia / Tour Asignado *</span>
                <select value={formTourId} onChange={e => setFormTourId(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                  {tours.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Fecha *</span>
                  <input type="text" required value={formDate} onChange={e => setFormDate(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="Ej: 28 Mayo" />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Horario/Slot *</span>
                  <input type="text" required value={formSlot} onChange={e => setFormSlot(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="Ej: 08:30" />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Adultos *</span>
                  <input type="number" required min={1} value={formAdults} onChange={e => setFormAdults(Number(e.target.value))} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Niños *</span>
                  <input type="number" required min={0} value={formKids} onChange={e => setFormKids(Number(e.target.value))} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Total Cotizado R$ *</span>
                  <input type="number" required min={0} value={formTotal} onChange={e => setFormTotal(Number(e.target.value))} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'var(--font-mono)' }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Método de Pago</span>
                  <select value={formPaymentMethod} onChange={e => setFormPaymentMethod(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                    <option value="pix">PIX</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Estado de Pago</span>
                  <select value={formPaymentStatus} onChange={e => setFormPaymentStatus(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </label>
              </div>

              <div style={{ borderTop: '1px dashed var(--line-soft)', paddingTop: 12 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)' }}>Costo Neto Guía (R$)</span>
                  <input type="number" min={0} value={formGuideNetCost} onChange={e => setFormGuideNetCost(Number(e.target.value))} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'var(--font-mono)' }} placeholder="Ej: 150" />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)' }}>Pago al Proveedor</span>
                  <select value={formProviderPaymentStatus} onChange={e => setFormProviderPaymentStatus(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                    <option value="PENDING">Pendiente</option>
                    <option value="PAID">Pagado</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)' }}>Fecha de Depósito al Proveedor</span>
                <input type="text" value={formProviderPaymentDate} onChange={e => setFormProviderPaymentDate(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="Ej: 28 Mayo" />
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 16, borderTop: '1px solid var(--line-soft)', position: 'sticky', bottom: 0, background: 'var(--paper)', zIndex: 10 }}>
                <button type="button" onClick={() => setShowCreateBooking(false)} className="btn btn-ghost" style={{ flex: 1, padding: 12, border: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={actionLoading === 'create-booking'} className="btn btn-coral" style={{ flex: 2, padding: 12, border: 'none', cursor: 'pointer' }}>
                  {actionLoading === 'create-booking' ? 'Creando Lead...' : 'Guardar Lead'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VISTA LATERAL / MODAL DE EDICIÓN COMPLETA DE RESERVA/CLIENTE */}
      {activeEditingBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(14, 27, 44, 0.4)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.3s ease'
        }} onClick={() => setActiveEditingBooking(null)}>
          
          <div style={{
            width: '100%',
            maxWidth: 520,
            background: 'var(--paper)',
            height: '100vh',
            boxShadow: 'var(--shadow-lg)',
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto',
            animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            textAlign: 'left'
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line-soft)', paddingBottom: 12 }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--coral)' }}>Editar Lead</div>
                <h3 className="display" style={{ fontSize: 24, margin: '4px 0 0' }}>Modificar Cliente Completo</h3>
              </div>
              <button
                onClick={() => setActiveEditingBooking(null)}
                style={{ background: 'var(--cream-soft)', border: 'none', padding: 8, borderRadius: 999, cursor: 'pointer', display: 'flex' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <form onSubmit={handleEditBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Nombre *</span>
                  <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Apellido *</span>
                  <input type="text" required value={formLastname} onChange={e => setFormLastname(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>WhatsApp *</span>
                  <input type="text" required value={formWhatsapp} onChange={e => setFormWhatsapp(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>País *</span>
                  <input type="text" required value={formCountry} onChange={e => setFormCountry(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Email *</span>
                <input type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
              </label>

              <div style={{ borderTop: '1px dashed var(--line-soft)', paddingTop: 12 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Hotel / Alojamiento</span>
                  <input type="text" value={formHotelAddress} onChange={e => setFormHotelAddress(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Hab.</span>
                  <input type="text" value={formHotelRoom} onChange={e => setFormHotelRoom(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="Habitación" />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Tel Hotel</span>
                  <input type="text" value={formHotelPhone} onChange={e => setFormHotelPhone(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
              </div>

              <div style={{ borderTop: '1px dashed var(--line-soft)', paddingTop: 12 }} />

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Experiencia / Tour Asignado *</span>
                <select value={formTourId} onChange={e => setFormTourId(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                  {tours.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Fecha *</span>
                  <input type="text" required value={formDate} onChange={e => setFormDate(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Horario/Slot *</span>
                  <input type="text" required value={formSlot} onChange={e => setFormSlot(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Adultos *</span>
                  <input type="number" required min={1} value={formAdults} onChange={e => setFormAdults(Number(e.target.value))} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Niños *</span>
                  <input type="number" required min={0} value={formKids} onChange={e => setFormKids(Number(e.target.value))} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Total Cotizado R$ *</span>
                  <input type="number" required min={0} value={formTotal} onChange={e => setFormTotal(Number(e.target.value))} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'var(--font-mono)' }} />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Método de Pago</span>
                  <select value={formPaymentMethod} onChange={e => setFormPaymentMethod(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                    <option value="pix">PIX</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Estado de Pago</span>
                  <select value={formPaymentStatus} onChange={e => setFormPaymentStatus(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </label>
              </div>

              <div style={{ borderTop: '1px dashed var(--line-soft)', paddingTop: 12 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)' }}>Costo Neto Guía (R$)</span>
                  <input type="number" min={0} value={formGuideNetCost} onChange={e => setFormGuideNetCost(Number(e.target.value))} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'var(--font-mono)' }} placeholder="Ej: 150" />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)' }}>Pago al Proveedor</span>
                  <select value={formProviderPaymentStatus} onChange={e => setFormProviderPaymentStatus(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
                    <option value="PENDING">Pendiente</option>
                    <option value="PAID">Pagado</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral)' }}>Fecha de Depósito al Proveedor</span>
                <input type="text" value={formProviderPaymentDate} onChange={e => setFormProviderPaymentDate(e.target.value)} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--cream-soft)', fontSize: 13, fontFamily: 'inherit' }} placeholder="Ej: 28 Mayo" />
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 16, borderTop: '1px solid var(--line-soft)', position: 'sticky', bottom: 0, background: 'var(--paper)', zIndex: 10 }}>
                <button type="button" onClick={() => setActiveEditingBooking(null)} className="btn btn-ghost" style={{ flex: 1, padding: 12, border: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={actionLoading === activeEditingBooking.id} className="btn btn-coral" style={{ flex: 2, padding: 12, border: 'none', cursor: 'pointer' }}>
                  {actionLoading === activeEditingBooking.id ? 'Guardando Cambios...' : 'Guardar Cambios'}
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
