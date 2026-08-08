import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Lock,
  ArrowLeft,
  CalendarDays,
  User,
  Trash2,
  ShieldCheck,
  Plus,
  Minus,
  MessageCircle,
} from "lucide-react";
import LogoImg from "./Logo.jpg";

/* ------------------------------------------------------------------ */
/*  CONFIG — edite aqui                                               */
/* ------------------------------------------------------------------ */

const SALON_NAME = "Studio Fraga Cardoso";
const SALON_WHATSAPP = "5551985238712"; // <-- troque pelo número real do salão (só dígitos, com DDI+DDD)
const ADMIN_PASSCODE = "unhas2026"; // <-- troque pela senha do painel admin

// Endereço do backend. Em desenvolvimento local aponta pro servidor rodando na sua máquina;
// depois de hospedar o backend (Railway, Render, etc.), troque pelo link real ali no .env do frontend (VITE_API_URL).
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const OPEN_HOUR = 9; // horário de abertura
const CLOSE_HOUR = 19; // horário de fechamento (último horário possível = CLOSE_HOUR - duração)
const SLOT_STEP_MIN = 30; // granularidade dos horários exibidos
const DAYS_AHEAD = 365; // quantos dias aparecem no carrossel de datas

const FALLBACK_PROFESSIONALS = [
  { id: "carol", name: "Carol", initials: "CA" },
  { id: "suelen", name: "Suelen", initials: "SU" },
];

/* ------------------------------------------------------------------ */
/*  SERVIÇOS                                                          */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { id: "maos", label: "Mãos" },
  { id: "pes", label: "Pés" },
  { id: "combo", label: "Combo" },
  { id: "banho", label: "Banho de gel" },
  { id: "alongamento", label: "Alongamento" },
  { id: "manutencao", label: "Retirada / Manutenção" },
  { id: "sobrancelha", label: "Sobrancelha / Buço" },
  { id: "cilios", label: "Cílios" },
];

// duration em minutos — usado só como reserva enquanto a API não responde;
// a lista de verdade vem do backend (arquivo services.js) para ficar num lugar só.
const FALLBACK_SERVICES = [
  { id: "s1", cat: "maos", name: "Mão simples", duration: 60, price: 35 },
  { id: "s2", cat: "maos", name: "Mão decorada", duration: 60, price: 40 },
  { id: "s3", cat: "maos", name: "Esmaltação em gel (mãos)", duration: 90, price: 65 },
  { id: "s4", cat: "maos", name: "Esmaltação decorada (mãos)", duration: 90, price: 70 },

  { id: "s5", cat: "pes", name: "Pedicure simples", duration: 60, price: 40 },
  { id: "s6", cat: "pes", name: "Pé com francesinha", duration: 60, price: 43 },
  { id: "s7", cat: "pes", name: "Esmaltação em gel (pés)", duration: 90, price: 70 },
  { id: "s8", cat: "pes", name: "Esmaltação em gel pés c/ francesinha", duration: 90, price: 73 },

  { id: "s9", cat: "combo", name: "Pés e mãos", duration: 120, price: 75 },

  { id: "s10", cat: "banho", name: "Banho de gel c/ esmalte em gel", duration: 120, price: 150 },
  { id: "s11", cat: "banho", name: "Banho de gel simples", duration: 120, price: 110 },

  { id: "s12", cat: "alongamento", name: "Alongamento de unhas (inclui esmalte simples)", duration: 180, price: 190 },
  { id: "s13", cat: "alongamento", name: "Alongamento c/ decoração ou esmalte em gel", duration: 180, price: 250 },
  { id: "s14", cat: "alongamento", name: "Reposição de unhas", duration: 30, price: 20 },

  { id: "s15", cat: "manutencao", name: "Retirada de esmaltação + mão simples", duration: 90, price: 60 },
  { id: "s16", cat: "manutencao", name: "Reparo de unhas", duration: 30, price: 10 },
  { id: "s17", cat: "manutencao", name: "Manutenção de alongamento", duration: 120, price: 110 },
  { id: "s18", cat: "manutencao", name: "Manutenção de alongamento c/ esmaltação em gel", duration: 120, price: 150 },
  { id: "s19", cat: "manutencao", name: "Retirada de esmaltação", duration: 30, price: 15 },

  { id: "s20", cat: "sobrancelha", name: "Sobrancelha limpeza", duration: 30, price: 30 },
  { id: "s21", cat: "sobrancelha", name: "Buço", duration: 15, price: 15 },
  { id: "s22", cat: "sobrancelha", name: "Buço + sobrancelha", duration: 30, price: 40 },

  { id: "s23", cat: "cilios", name: "Lash lifting", duration: 90, price: 90 },
  { id: "s24", cat: "cilios", name: "Colocação de cílios", duration: 120, price: 130 },
  { id: "s25", cat: "cilios", name: "Manutenção de cílios", duration: 90, price: 90 },
  { id: "s26", cat: "cilios", name: "Retirada de cílios", duration: 30, price: 50 },
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function fmtDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function minutesToHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatPrice(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
}

// paleta rotativa "esmalte" pro dot de cada categoria — 3 tons dentro da mesma família
const DOT_TONES = ["dotWine", "dotGold", "dotPlum"];
function dotToneForCategory(catId) {
  const idx = CATEGORIES.findIndex((c) => c.id === catId);
  return DOT_TONES[idx % DOT_TONES.length];
}

/* ------------------------------------------------------------------ */
/*  APP                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const [route, setRoute] = useState("home"); // home | admin
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [storageError, setStorageError] = useState(false);

  const [bookingService, setBookingService] = useState(null); // objeto serviço ou null
  const [step, setStep] = useState(1); // 1 data/prof, 2 horário, 3 dados, 4 confirmado
  const [selectedDate, setSelectedDate] = useState(fmtDateKey(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedProf, setSelectedProf] = useState(null); // 'carol' | 'suelen' | 'none'
  const [selectedTime, setSelectedTime] = useState(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [lastBooking, setLastBooking] = useState(null);

  const [dayScrollStart, setDayScrollStart] = useState(0);

  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [professionals, setProfessionals] = useState(FALLBACK_PROFESSIONALS);

  /* -------------------- carregar serviços / profissionais da API -------------------- */

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch(`${API_BASE_URL}/services`);
        if (!res.ok) throw new Error("Falha ao buscar serviços");
        const data = await res.json();
        if (Array.isArray(data.services) && data.services.length) setServices(data.services);
        if (Array.isArray(data.professionals) && data.professionals.length) setProfessionals(data.professionals);
      } catch (e) {
        // mantém os valores de reserva (FALLBACK_*) se o backend estiver fora do ar
        setStorageError(true);
      }
    }
    loadServices();
  }, []);

  /* -------------------- carregar / salvar agendamentos via API -------------------- */

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`);
      if (!res.ok) throw new Error("Falha ao buscar agendamentos");
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
      setStorageError(false);
    } catch (e) {
      setStorageError(true);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
    // atualiza a agenda a cada 20s pra refletir agendamentos feitos por outras clientes/abas
    const interval = setInterval(loadBookings, 20000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  /* -------------------- filtro de serviços -------------------- */

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesCat = category === "all" || s.cat === category;
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [services, category, search]);

  const servicesByCategory = useMemo(() => {
    const groups = {};
    filteredServices.forEach((s) => {
      if (!groups[s.cat]) groups[s.cat] = [];
      groups[s.cat].push(s);
    });
    return groups;
  }, [filteredServices]);

  /* -------------------- datas do carrossel -------------------- */

  const dateOptions = useMemo(() => {
    const arr = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);


  const monthGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i= 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calendarMonth]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const isCurrentMonth = 
    calendarMonth.getFullYear() === todayStart.getFullYear() && calendarMonth.getMonth() === todayStart.getMonth();

  /* -------------------- disponibilidade -------------------- */

  function getBookingsFor(profId, dateKey) {
    return bookings.filter((b) => b.professionalId === profId && b.date === dateKey);
  }

  function isRangeFree(profId, dateKey, startMin, endMin) {
    const existing = getBookingsFor(profId, dateKey);
    return existing.every((b) => {
      const bStart = hhmmToMinutes(b.startTime);
      const bEnd = hhmmToMinutes(b.endTime);
      return endMin <= bStart || startMin >= bEnd;
    });
  }

  function availableSlots(profId, dateKey, durationMin) {
    const slots = [];
    const openMin = OPEN_HOUR * 60;
    const closeMin = CLOSE_HOUR * 60;
    for (let t = openMin; t + durationMin <= closeMin; t += SLOT_STEP_MIN) {
      // não permitir horário no passado se a data for hoje
      const now = new Date();
      const isToday = dateKey === fmtDateKey(now);
      if (isToday) {
        const nowMin = now.getHours() * 60 + now.getMinutes();
        if (t <= nowMin) continue;
      }
      if (isRangeFree(profId, dateKey, t, t + durationMin)) {
        slots.push(t);
      }
    }
    return slots;
  }

  const slotsForStep2 = useMemo(() => {
    if (!bookingService || step !== 2) return { list: [], byProf: {} };
    const duration = bookingService.duration;
    if (selectedProf && selectedProf !== "none") {
      return { list: availableSlots(selectedProf, selectedDate, duration), byProf: null };
    }
    // "sem preferência": une horários livres em qualquer uma das duas
    const byProf = {};
    professionals.forEach((p) => {
      byProf[p.id] = availableSlots(p.id, selectedDate, duration);
    });
    const union = new Set();
    Object.values(byProf).forEach((arr) => arr.forEach((t) => union.add(t)));
    return { list: Array.from(union).sort((a, b) => a - b), byProf };
  }, [bookingService, step, selectedProf, selectedDate, bookings, professionals]);

  /* -------------------- ações -------------------- */

  function openBooking(service) {
    setBookingService(service);
    setStep(1);
    setSelectedDate(fmtDateKey(new Date()));
    setSelectedProf(null);
    setSelectedTime(null);
    setClientName("");
    setClientPhone("");
  }

  function closeBooking() {
    setBookingService(null);
    setStep(1);
  }

  function goAdvanceFromStep1() {
    if (!selectedProf) return;
    setStep(2);
  }

  function chooseTime(t) {
    setSelectedTime(t);
    setStep(3);
  }

  async function confirmBooking() {
    if (!clientName.trim() || !clientPhone.trim()) return;
    const duration = bookingService.duration;
    const endTime = selectedTime + duration;

    let finalProf = selectedProf;
    if (selectedProf === "none") {
      // escolhe automaticamente a primeira profissional livre nesse horário
      finalProf =
        professionals.find((p) =>
          isRangeFree(p.id, selectedDate, selectedTime, endTime)
        )?.id || professionals[0].id;
    }

    // checagem local de conflito (a checagem que realmente decide fica no backend,
    // isso aqui só evita mostrar o formulário pra um horário obviamente ocupado)
    if (!isRangeFree(finalProf, selectedDate, selectedTime, endTime)) {
      alert("Esse horário acabou de ser reservado por outra cliente. Escolha outro horário.");
      setStep(2);
      return;
    }

    const profName = professionals.find((p) => p.id === finalProf)?.name || "";

    const payload = {
      serviceId: bookingService.id,
      serviceName: bookingService.name,
      duration,
      price: bookingService.price,
      professionalId: finalProf,
      professionalName: profName,
      date: selectedDate,
      startTime: minutesToHHMM(selectedTime),
      endTime: minutesToHHMM(endTime),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        // 409 = outra cliente reservou esse mesmo horário entre a checagem local e o envio
        alert(data.error || "Não foi possível confirmar esse agendamento. Tente outro horário.");
        await loadBookings();
        setStep(2);
        return;
      }
      setBookings((prev) => [...prev, data]);
      setLastBooking(data);
      setStep(4);
    } catch (e) {
      alert("Não foi possível falar com o servidor. Verifique sua internet e tente de novo.");
    }
  }

  async function cancelBooking(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao cancelar");
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      alert("Não foi possível cancelar agora. Tente novamente.");
    }
  }

  // Só disponível no painel da profissional: aumenta ou diminui a duração
  // de um atendimento já marcado (ex: +15min), bloqueando o novo tempo na agenda.
  async function adjustBookingDuration(id, deltaMin) {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${id}/duration`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: deltaMin }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Não foi possível ajustar esse horário.");
        return;
      }
      setBookings((prev) => prev.map((b) => (b.id === id ? data : b)));
    } catch (e) {
      alert("Não foi possível falar com o servidor. Tente novamente.");
    }
  }

  function whatsappLink(b) {
  const dateObj = new Date(b.date + "T00:00:00");
  const dateLabel =`${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
  const msg =` Olá! Acabei de agendar um horário pelo app do ${SALON_NAME}:%0A%0AServiço: ${b.serviceName}%0AProfissional: ${b.professionalName}%0AData: ${dateLabel}%0AHorário: ${b.startTime}%0AValor: ${formatPrice(b.price)}%0A%0ANome: ${b.clientName}`;
  const prof = professionals.find((p) => p.id === b.professionalId);
  const targetNumber = prof?.whatsapp || SALON_WHATSAPP;
  return `https://wa.me/${targetNumber}?text=${msg}`;
  }

  /* -------------------- render -------------------- */

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&display=swap');

        .app-root {
          --ink: #3A3630;
          --ink-soft: #8A7F70;
          --paper: #F3ECE0;
          --paper-card: #FFFCF7;
          --wine: #B8874B;
          --wine-dark: #8F6636;
          --gold: #C9A15A;
          --plum: #6B5B4D;
          --rose-mist: #EFE6D8;
          --border: #E3D9C8;
          font-family: 'Work Sans', sans-serif;
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        .app-root * { box-sizing: border-box; }
        .app-root h1, .app-root h2, .app-root h3, .app-root .display {
          font-family: 'Fraunces', serif;
        }
        .shell {
          max-width: 480px;
          margin: 0 auto;
          min-height: 100vh;
          background: var(--paper);
          position: relative;
          box-shadow: 0 0 40px rgba(140, 31, 59, 0.06);
        }
        .header {
          background: linear-gradient(150deg,var(--wine) 0%, var(--wine-dark) 55%, var(--plum) 100%);
          padding: 28px 20px 34px;
          position: relative;
          overflow: hidden;
        }
        .header::after {
          content: "";
          position: absolute;
          right: -40px;
          top: -40px;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(199,162,82,0.35), transparent 70%);
        }
        .brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }
        .brand-dot {
          width: 42px; height: 42px; border-radius: 50%;
          background: radial-gradient(circle at 32% 28%, #ffffff 0%, var(--gold) 38%, #8a6c2a 100%);
          box-shadow: inset 0 -4px 6px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.3);
          flex-shrink: 0;
        }
        .brand-name {
          color: #fff;
          font-size: 26px;
          font-weight: 600;
          letter-spacing: 0.2px;
          line-height: 1.1;
        }
        .brand-sub {
          color: rgba(255,255,255,0.72);
          font-size: 12.5px;
          margin-top: 2px;
          letter-spacing: 0.3px;
        }
        .search-wrap {
          margin-top: 20px;
          position: relative;
          z-index: 1;
        }
        .search-input {
          width: 100%;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.28);
          border-radius: 14px;
          padding: 12px 14px 12px 40px;
          color: #fff;
          font-size: 14.5px;
          font-family: 'Work Sans', sans-serif;
          outline: none;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.65); }
        .search-icon {
          position: absolute;
          left: 13px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.75);
        }
        .offline-banner {
          margin: 12px 16px 0;
          background: #FBE9E9;
          color: #8C1F3B;
          border: 1px solid #F0C6C6;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 12.5px;
          text-align: center;
        }
        .cat-scroll {
          display: flex;
          gap: 8px;
          padding: 16px 16px 4px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .cat-scroll::-webkit-scrollbar { display: none; }
        .cat-pill {
          flex-shrink: 0;
          padding: 8px 15px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid var(--border);
          background: var(--paper-card);
          color: var(--ink-soft);
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .cat-pill.active {
          background: var(--wine);
          border-color: var(--wine);
          color: #fff;
        }
        .cat-group-title {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: var(--ink-soft);
          font-weight: 600;
          margin: 22px 20px 10px;
        }
        .service-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--paper-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 13px 14px;
          margin: 0 16px 10px;
        }
        .lacquer-dot {
          width: 30px; height: 30px; border-radius: 50%;
          flex-shrink: 0;
          box-shadow: inset -3px -4px 6px rgba(0,0,0,0.22), inset 2px 3px 4px rgba(255,255,255,0.35);
        }
        .dotWine { background: radial-gradient(circle at 35% 30%, #c14b6a, var(--wine) 55%, var(--wine-dark) 100%); }
        .dotGold { background: radial-gradient(circle at 35% 30%, #f0d999, var(--gold) 55%, #8a6c2a 100%); }
        .dotPlum { background: radial-gradient(circle at 35% 30%, #a678a0, var(--plum) 55%, #3c2138 100%); }
        .service-info { flex: 1; min-width: 0; }
        .service-name {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.25;
        }
        .service-meta {
          font-size: 12.5px;
          color: var(--ink-soft);
          margin-top: 3px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .service-price {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 15px;
          color: var(--wine);
          margin-right: 6px;
          white-space: nowrap;
        }
        .btn-agendar {
          background: var(--ink);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 9px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          font-family: 'Work Sans', sans-serif;
        }
        .btn-agendar:active { transform: scale(0.97); }
        .empty-note {
          text-align: center;
          color: var(--ink-soft);
          font-size: 13.5px;
          padding: 30px 20px;
        }
        .footer-space { height: 30px; }

        /* modal */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(36, 22, 38, 0.55);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 50;
        }
        .modal-sheet {
          background: var(--paper);
          width: 100%;
          max-width: 480px;
          border-radius: 22px 22px 0 0;
          max-height: 92vh;
          overflow-y: auto;
          padding-bottom: 24px;
          animation: slideUp 0.22s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px 10px;
          position: sticky;
          top: 0;
          background: var(--paper);
          z-index: 2;
        }
        .icon-btn {
          width: 34px; height: 34px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--paper-card);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: var(--ink);
        }
        .modal-title-row {
          padding: 4px 20px 14px;
        }
        .modal-service-name {
          font-size: 19px;
          font-weight: 600;
        }
        .modal-service-meta {
          font-size: 13px;
          color: var(--ink-soft);
          margin-top: 4px;
        }
        .section-label {
          font-size: 12.5px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
          color: var(--ink-soft);
          margin: 18px 20px 10px;
        }
        .date-scroll {
          display: flex;
          gap: 8px;
          padding: 0 20px 4px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .date-scroll::-webkit-scrollbar { display: none; }
        .date-chip {
          flex-shrink: 0;
          width: 62px;
          text-align: center;
          border-radius: 14px;
          border: 1.5px solid var(--border);
          background: var(--paper-card);
          padding: 10px 4px;
          cursor: pointer;
        }
        .date-chip.active {
          border-color: var(--wine);
          background: var(--wine);
        }
        .date-chip .num {
          font-family: 'Fraunces', serif;
          font-size: 19px;
          font-weight: 600;
          color: var(--ink);
        }
        .date-chip.active .num { color: #fff; }
        .date-chip .dow {
          font-size: 10.5px;
          color: var(--ink-soft);
          margin-top: 2px;
          text-transform: uppercase;
        }
        .date-chip.active .dow { color: rgba(255,255,255,0.8); }
        .prof-row {
          display: flex;
          gap: 12px;
          padding: 0 20px 4px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .prof-row::-webkit-scrollbar { display: none; }
        .prof-card {
          flex-shrink: 0;
          width: 78px;
          text-align: center;
          cursor: pointer;
        }
        .prof-avatar {
          width: 62px; height: 62px;
          border-radius: 50%;
          margin: 0 auto 6px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 18px;
          color: #fff;
          background: linear-gradient(135deg, var(--wine), var(--plum));
          border: 3px solid transparent;
        }
        .prof-card.active .prof-avatar {
          border-color: var(--gold);
        }
        .prof-avatar.none-pref {
          background: var(--rose-mist);
          color: var(--ink-soft);
        }
        .prof-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink);
        }
        .btn-primary {
          width: calc(100% - 40px);
          margin: 22px 20px 0;
          background: var(--wine);
          color: #fff;
          border: none;
          border-radius: 14px;
          padding: 15px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Work Sans', sans-serif;
        }
        .btn-primary:disabled {
          background: var(--border);
          color: var(--ink-soft);
          cursor: not-allowed;
        }
        .slot-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 0 20px;
        }
        .slot-btn {
          padding: 12px 4px;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--paper-card);
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          cursor: pointer;
          font-family: 'Work Sans', sans-serif;
        }
        .slot-btn.selected {
          background: var(--wine);
          border-color: var(--wine);
          color: #fff;
        }
        .form-field {
          padding: 0 20px;
          margin-top: 14px;
        }
        .form-field label {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--ink-soft);
          display: block;
          margin-bottom: 6px;
        }
        .form-field input {
          width: 100%;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14.5px;
          font-family: 'Work Sans', sans-serif;
          background: var(--paper-card);
          outline: none;
          color: var(--ink);
        }
        .form-field input:focus { border-color: var(--wine); }
        .summary-card {
          margin: 6px 20px 0;
          background: var(--rose-mist);
          border-radius: 14px;
          padding: 14px 16px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          padding: 4px 0;
          color: var(--ink);
        }
        .summary-row span:first-child { color: var(--ink-soft); }
        .confirm-wrap {
          text-align: center;
          padding: 30px 26px 10px;
        }
        .confirm-check {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: var(--wine);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 18px;
        }
        .confirm-title {
          font-size: 21px;
          font-weight: 600;
        }
        .confirm-sub {
          font-size: 13.5px;
          color: var(--ink-soft);
          margin-top: 6px;
          line-height: 1.5;
        }
        .wa-btn {
          display: block;
          text-align: center;
          text-decoration: none;
          background: #25D366;
          color: #fff;
          font-weight: 600;
          font-size: 14.5px;
          border-radius: 14px;
          padding: 14px;
          margin: 22px 20px 0;
        }
        .link-btn {
          display: block;
          text-align: center;
          margin: 14px auto 0;
          color: var(--ink-soft);
          font-size: 13px;
          text-decoration: underline;
          cursor: pointer;
          background: none;
          border: none;
        }
        .wa-hint {
          text-align: center;
          color: var(--ink-soft);
          font-size: 11.5px;
          margin: 8px 30px 0;
          line-height: 1.4;
        }
        .duration-adjust {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
        }
        .adj-btn {
          width: 22px; height: 22px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.08);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          padding: 0;
        }
        .adj-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .adj-label {
          color: rgba(255,255,255,0.65);
          font-size: 11.5px;
          min-width: 46px;
          text-align: center;
        }
        .admin-fab {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(calc(-50% + 200px));
          background: var(--ink);
          color: #fff;
          border-radius: 999px;
          width: 42px; height: 42px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(36,22,38,0.3);
          cursor: pointer;
          border: none;
        }
        @media (max-width: 500px) {
          .admin-fab { transform: none; right: 14px; left: auto; }
        }
        .admin-header {
          display: flex; align-items: center; gap: 10px;
          padding: 20px 20px 16px;
          background: var(--ink);
        }
        .admin-header .brand-name { font-size: 20px; }
        .admin-body { padding: 16px 20px 40px; }
        .passcode-box {
          max-width: 300px;
          margin: 60px auto;
          text-align: center;
        }
        .passcode-box input {
          width: 100%;
          text-align: center;
          letter-spacing: 3px;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          font-size: 16px;
          margin-top: 16px;
          outline: none;
        }
        .passcode-box input:focus { border-color: var(--wine); }
        .day-block {
          margin-bottom: 22px;
        }
        .day-block-title {
          font-family: 'Fraunces', serif;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--paper);
        }
        .booking-row {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .booking-info .bname { color: #fff; font-weight: 600; font-size: 14px; }
        .booking-info .bmeta { color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 3px; }
        .booking-time {
          font-family: 'Fraunces', serif;
          color: var(--gold);
          font-weight: 600;
          font-size: 15px;
          margin-right: 10px;
          white-space: nowrap;
        }
        .del-btn {
          background: none; border: none; color: rgba(255,255,255,0.5);
          cursor: pointer; padding: 6px;
        }
        .del-btn:hover { color: #e08099; }
      `}</style>

      <div className="shell">
        {route === "home" && (
          <>
            <div className="header">
              <div className="brand-row">
               <img src={LogoImg} alt={SALON_NAME} className="brand-dot" style={{ objectFit: "cover", objectPosition: "50% 25%" }} />
                
                <div>
                  <div className="brand-name">{SALON_NAME}</div>
                  <div className="brand-sub">Carol &amp; Suelen · agende seu horário</div>
                </div>
              </div>
              <div className="search-wrap">
                <Search size={17} className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Buscar serviço..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {storageError && (
              <div className="offline-banner">
                Não foi possível falar com o servidor agora. Verifique se o backend está rodando.
              </div>
            )}

            <div className="cat-scroll">
              <div
                className={`cat-pill ${category === "all" ? "active" : ""}`}
                onClick={() => setCategory("all")}
              >
                Todos
              </div>
              {CATEGORIES.map((c) => (
                <div
                  key={c.id}
                  className={`cat-pill ${category === c.id ? "active" : ""}`}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </div>
              ))}
            </div>

            {filteredServices.length === 0 && (
              <div className="empty-note">Nenhum serviço encontrado.</div>
            )}

            {CATEGORIES.filter((c) => servicesByCategory[c.id]?.length).map((c) => (
              <div key={c.id}>
                <div className="cat-group-title">{c.label}</div>
                {servicesByCategory[c.id].map((s) => (
                  <div className="service-card" key={s.id}>
                    <div className={`lacquer-dot ${dotToneForCategory(s.cat)}`} />
                    <div className="service-info">
                      <div className="service-name">{s.name}</div>
                      <div className="service-meta">
                        <Clock size={12} /> {formatDuration(s.duration)}
                      </div>
                    </div>
                    <div className="service-price">{formatPrice(s.price)}</div>
                    <button className="btn-agendar" onClick={() => openBooking(s)}>
                      Agendar
                    </button>
                  </div>
                ))}
              </div>
            ))}

            <div className="footer-space" />

            <button className="admin-fab" onClick={() => setRoute("admin")} title="Painel da profissional">
              <Lock size={18} />
            </button>
          </>
        )}

        {route === "admin" && (
          <AdminPanel
            bookings={bookings}
            loading={loadingBookings}
            onBack={() => setRoute("home")}
            onCancel={cancelBooking}
            onRefresh={loadBookings}
            onAdjustDuration={adjustBookingDuration}
                professionals={professionals}
          />
        )}
      </div>

      {bookingService && (
        <div className="modal-overlay" onClick={closeBooking}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {step > 1 && step < 4 ? (
                <button className="icon-btn" onClick={() => setStep(step - 1)}>
                  <ArrowLeft size={17} />
                </button>
              ) : (
                <div style={{ width: 34 }} />
              )}
              <button className="icon-btn" onClick={closeBooking}>
                <X size={17} />
              </button>
            </div>

            <div className="modal-title-row">
              <div className="modal-service-name">{bookingService.name}</div>
              <div className="modal-service-meta">
                {formatDuration(bookingService.duration)} · {formatPrice(bookingService.price)}
              </div>
            </div>

            {step === 1 && (
              <>
                <div className="section-label">Selecione a data</div>
<div style={{ background: "var(--paper)", borderRadius: 16, padding: "12px 14px", border: "1px solid rgba(0,0,0,0.08)" }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    <button
      className="icon-btn"
      disabled={isCurrentMonth}
      onClick={() => setCalendarMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })}
      style={{ opacity: isCurrentMonth ? 0.3 : 1 }}
    >
      <ArrowLeft size={16} />
    </button>
    <div style={{ fontWeight: 600, fontFamily: "'Fraunces', serif" }}>
      {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
    </div>
    <button
      className="icon-btn"
      onClick={() => setCalendarMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })}
    >
      <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
    </button>
  </div>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
    {["D", "S", "T", "Q", "Q", "S", "S"].map((l, i) => (
      <div key={i} style={{ textAlign: "center", fontSize: 11, color: "var(--muted)" }}>
        {l}
      </div>
    ))}
  </div>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
    {monthGrid.map((d, i) => {
      if (!d) return <div key={i} />;
      const key = fmtDateKey(d);
      const isPast = d < todayStart;
      return (
        <button
          key={key}
          disabled={isPast}
          onClick={() => setSelectedDate(key)}
          style={{
            aspectRatio: "1",
            borderRadius: 10,
            border: "none",
            fontSize: 13.5,
            fontWeight: selectedDate === key ? 700 : 500,
            background: selectedDate === key ? "var(--wine)" : "transparent",
            color: isPast ? "rgba(0,0,0,0.25)" : selectedDate === key ? "#fff" : "var(--ink)",
            cursor: isPast ? "default" : "pointer",
          }}
        >
          {d.getDate()}
        </button>
      );
    })}
  </div>
</div>

                <div className="section-label">Profissional</div>
                <div className="prof-row">
                  <div
                    className={`prof-card ${selectedProf === "none" ? "active" : ""}`}
                    onClick={() => setSelectedProf("none")}
                  >
                    <div className="prof-avatar none-pref">
                      <User size={22} />
                    </div>
                    <div className="prof-label">Sem preferência</div>
                  </div>
                  {professionals.map((p) => (
                    <div
                      key={p.id}
                      className={`prof-card ${selectedProf === p.id ? "active" : ""}`}
                      onClick={() => setSelectedProf(p.id)}
                    >
                      <div className="prof-avatar">{p.initials}</div>
                      <div className="prof-label">{p.name}</div>
                    </div>
                  ))}
                </div>

                <button className="btn-primary" disabled={!selectedProf} onClick={goAdvanceFromStep1}>
                  Avançar
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="section-label">
                  Horários disponíveis · {new Date(selectedDate + "T00:00:00").getDate()}/
                  {new Date(selectedDate + "T00:00:00").getMonth() + 1}
                </div>
                {slotsForStep2.list.length === 0 ? (
                  <div className="empty-note">
                    Sem horários livres nesse dia para a duração desse serviço. Volte e escolha outra data.
                  </div>
                ) : (
                  <div className="slot-grid">
                    {slotsForStep2.list.map((t) => (
                      <button
                        key={t}
                        className={`slot-btn ${selectedTime === t ? "selected" : ""}`}
                        onClick={() => chooseTime(t)}
                      >
                        {minutesToHHMM(t)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <div className="summary-card">
                  <div className="summary-row">
                    <span>Data</span>
                    <span>
                      {new Date(selectedDate + "T00:00:00").getDate()}/
                      {new Date(selectedDate + "T00:00:00").getMonth() + 1}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Horário</span>
                    <span>
                      {minutesToHHMM(selectedTime)} – {minutesToHHMM(selectedTime + bookingService.duration)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Profissional</span>
                    <span>
                      {selectedProf === "none"
                        ? "Sem preferência"
                        : professionals.find((p) => p.id === selectedProf)?.name}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Valor</span>
                    <span>{formatPrice(bookingService.price)}</span>
                  </div>
                </div>

                <div className="form-field">
                  <label>Seu nome</label>
                  <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="form-field">
                  <label>WhatsApp</label>
                  <input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(51) 9 9999-9999"
                  />
                </div>

                <button
                  className="btn-primary"
                  disabled={!clientName.trim() || !clientPhone.trim()}
                  onClick={confirmBooking}
                >
                  Confirmar agendamento
                </button>
              </>
            )}

            {step === 4 && lastBooking && (
              <>
                <div className="confirm-wrap">
                  <div className="confirm-check">
                    <Check size={30} color="#fff" />
                  </div>
                  <div className="confirm-title">Agendamento confirmado!</div>
                  <div className="confirm-sub">
                    {lastBooking.serviceName} com {lastBooking.professionalName} em{" "}
                    {new Date(lastBooking.date + "T00:00:00").getDate()}/
                    {new Date(lastBooking.date + "T00:00:00").getMonth() + 1} às {lastBooking.startTime}.
                    <br />
                    Você receberá um lembrete 24h antes do horário.
                  </div>
                </div>
                <a className="wa-btn" href={whatsappLink(lastBooking)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={17} style={{ verticalAlign: "-3px", marginRight: 6 }} />
                  Avisar o salão no WhatsApp
                </a>
                <div className="wa-hint">Isso abre uma mensagem para o número do salão, avisando que você agendou.</div>
                <button className="link-btn" onClick={closeBooking}>
                  Fechar sem avisar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PAINEL ADMIN                                                       */
/* ------------------------------------------------------------------ */

function AdminPanel({ bookings, loading, onBack, onCancel, onRefresh, onAdjustDuration, professionals }) {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [selectedProf, setSelectedProf]= useState("all");

  function tryLogin() {
    if (pass === ADMIN_PASSCODE) {
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
        <div className="admin-header">
          <button className="icon-btn" onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}>
            <ArrowLeft size={17} />
          </button>
          <div className="brand-name" style={{ color: "#fff" }}>Painel da profissional</div>
        </div>
        <div className="passcode-box">
          <ShieldCheck size={30} color="var(--wine)" />
          <div style={{ marginTop: 10, fontWeight: 600 }}>Área restrita</div>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Senha"
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
          />
          {error && <div style={{ color: "var(--wine)", fontSize: 12.5, marginTop: 8 }}>Senha incorreta.</div>}
          <button className="btn-primary" style={{ width: "100%", margin: "16px 0 0" }} onClick={tryLogin}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

 const filteredBookings = 
   selectedProf === "all"? bookings : bookings.filter((b) => b.professionalId === selectedProf);

  const sorted = [...filteredBookings].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  const byDate = {};
  sorted.forEach((b) => {
    if (!byDate[b.date]) byDate[b.date] = [];
    byDate[b.date].push(b);
  });

  const dateKeys = Object.keys(byDate).sort();

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const profShare = totalRevenue * 0.7;

  return (
    <div style={{ minHeight: "100vh", background: "var(--ink)" }}>
      <div className="admin-header">
        <button
          className="icon-btn"
          onClick={onBack}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}
        >
          <ArrowLeft size={17} />
        </button>
        <div className="brand-name" style={{ color: "#fff" }}>Agenda completa</div>
      </div>
      <div style={{ padding: "16px 20px 0", display: "flex", gap: 8, overflowX: "auto" }}>
        <button
          onClick={() => setSelectedProf("all")}
          className="cat-pill"
          style={
            selectedProf === "all"
              ? { background: "var(--wine)", borderColor: "var(--wine)", color: "#fff" }
              : { background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)", color: "#fff" }
          }
        >
          Todas
        </button>
        {professionals.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProf(p.id)}
            className="cat-pill"
            style={
              selectedProf === p.id
                ? { background: "var(--wine)", borderColor: "var(--wine)", color: "#fff" }
                : { background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)", color: "#fff" }
            }
          >
            {p.name}
          </button>
        ))}
      </div>
      {selectedProf !== "all" && (
        <div style={{ margin: "16px 20px 0", background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12.5 }}>Faturamento acumulado (70%)</div>
          <div style={{ color: "var(--gold)", fontSize: 22, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>
            {formatPrice(profShare)}
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11.5, marginTop: 2 }}>
            Total bruto: {formatPrice(totalRevenue)}
          </div>
        </div>
      )}
      <div className="admin-body">
        {loading && <div style={{ color: "rgba(255,255,255,0.6)" }}>Carregando...</div>}
        {!loading && dateKeys.length === 0 && (
          <div style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 40 }}>
            Nenhum agendamento ainda.
          </div>
        )}
        {dateKeys.map((dk) => {
          const d = new Date(dk + "T00:00:00");
          return (
            <div className="day-block" key={dk}>
              <div className="day-block-title">
                {WEEKDAYS[d.getDay()]}, {d.getDate()}/{MONTHS[d.getMonth()]}
              </div>
              {byDate[dk].map((b) => (
                <div className="booking-row" key={b.id}>
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <div className="booking-time">{b.startTime}</div>
                    <div className="booking-info">
                      <div className="bname">
                        {b.serviceName} — {b.clientName}
                      </div>
                      <div className="bmeta">
                        {b.professionalName} · até {b.endTime} · {b.clientPhone}
                      </div>
                      <div className="duration-adjust">
                        <button
                          className="adj-btn"
                          disabled={b.duration <= 15}
                          onClick={() => onAdjustDuration(b.id, -15)}
                          title="Diminuir 15 min"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="adj-label">{formatDuration(b.duration)}</span>
                        <button
                          className="adj-btn"
                          onClick={() => onAdjustDuration(b.id, 15)}
                          title="Adicionar 15 min"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button className="del-btn" onClick={() => onCancel(b.id)} title="Cancelar">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
        <button
          className="link-btn"
          style={{ color: "rgba(255,255,255,0.5)", marginTop: 20 }}
          onClick={onRefresh}
        >
          Atualizar agenda
        </button>
      </div>
    </div>
  );
}
