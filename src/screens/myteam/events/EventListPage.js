// src/pages/EventListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import cardsRaw from "../cards/cards.json";
import BackButton from "../../components/BackButton";

export default function EventListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // нормализация карт
  const cardsArray = useMemo(() => {
    if (!cardsRaw) return [];
    const maybeDefault = cardsRaw.default ? cardsRaw.default : cardsRaw;
    if (maybeDefault && Array.isArray(maybeDefault.cards)) return maybeDefault.cards;
    if (Array.isArray(maybeDefault)) return maybeDefault;
    if (typeof maybeDefault === "object") {
      try { return Object.values(maybeDefault); } catch { return []; }
    }
    return [];
  }, []);

  // map id -> card
  const cardsMap = useMemo(() => {
    const m = {};
    (cardsArray || []).forEach(c => {
      if (!c) return;
      const id = c.id || c.cardId;
      if (id) m[id] = c;
    });
    return m;
  }, [cardsArray]);

  useEffect(() => {
    let mounted = true;
    async function fetchEvents() {
      try {
        const res = await fetch("/events/events.json", { cache: "no-cache" });
        if (!res.ok) throw new Error("Не удалось загрузить список событий");
        const data = await res.json();
        if (mounted) setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Ошибка загрузки событий:", err);
        if (mounted) setEvents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchEvents();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{ padding: 20 }}> </div>;

  // переход на событие
  const getEventPath = (ev) => (ev.type === "special" ? "/fantasy" : `/events/${ev.id}`);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <BackButton label="Назад" />
          <span style={{ color: 'white', fontSize: '18px'}}>События</span>
        </div>
      </div>

      <div style={styles.grid}>
        {events.map(ev => (
          <EventCard
            key={ev.id}
            ev={ev}
            onClick={() => navigate(getEventPath(ev))}
          />
        ))}
      </div>
    </div>
  );
}

// встроенный компонент карточки без useEffect/useState
function EventCard({ ev, onClick }) {
  const timeLeft = useMemo(() => {
    const now = new Date();
    const endDate = new Date(ev.endDate);
    let diff = endDate - now;
    if (diff <= 0) return { days: 0, hours: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return { days, hours };
  }, [ev.endDate]);

  return (
    <div
      style={{
        backgroundImage: `url(/events/${ev.id}/cover.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        cursor: 'pointer',
        margin: '5px 15px',
        borderRadius: '10px',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff'
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
    >
      {/* Название */}
      <div style={{
        position: 'absolute',
        bottom: 27,
        left: 0,
        width: '100%',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
        padding: '0 10px',
        boxSizing: 'border-box'
      }}>
        {ev.title}
      </div>

      {/* Таймер */}
      <div style={{
        backgroundColor: '#252525',
        textAlign: 'center',
        padding: '3px 0',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        fontWeight: 'bold',
        fontSize: 13
      }}>
        {timeLeft.days} дн {timeLeft.hours} ч
      </div>
    </div>
  );
}

const styles = {
  container: { marginTop: '75px' },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "19px",
    position: 'fixed',
    width: '100%',
    background: 'rgb(17, 17, 19)',
    left: '0',
    top: '0',
    padding: '20px',
    zIndex: 100
  },
  headerInner: { display: 'flex', width: "100%", gap: "10px", alignItems: "center" },
  grid: { display: "grid" }
};
