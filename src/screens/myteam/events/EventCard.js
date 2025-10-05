import { useState, useEffect } from "react";

export default function EventCard({ ev, onClick }) {
  const endDate = new Date(ev.endDate);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endDate));

  useEffect(() => {
    // только один раз при монтировании
    setTimeLeft(getTimeLeft(endDate));
  }, [endDate]);

  function getTimeLeft(endDate) {
    const now = new Date();
    let diff = endDate - now;
    if (diff <= 0) return { days: 0, hours: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;

    const hours = Math.floor(diff / (1000 * 60 * 60));

    return { days, hours };
  }

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
        color: '#fff',
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
        fontSize: 13,
        color: 'white'
      }}>
        {timeLeft.days} дн {timeLeft.hours} ч
      </div>
    </div>
  );
}
