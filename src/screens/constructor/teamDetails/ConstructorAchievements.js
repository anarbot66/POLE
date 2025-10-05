// DriverAchievements.jsx
import React, { useMemo } from "react";
import achievements from "../../recources/json/f1_drivers_achievements_2025.json"; // <- твой JSON

const PLACE_COLORS = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
  4: "blue",
  5: "blue",
  6: "blue",
  7: "blue"
};

const PLACE_TEXT = {
  1: "Чемпионы WCC",
  2: "Вице-чемпионы WCC",
  3: "Бронзовые призёры WCC"
};

function parseKey(key) {
  // Разбирает "Championship (2005, 2006)" -> { title, years }
  const m = key.match(/^(.*)\s*\(([^)]+)\)\s*$/);
  if (m) return { title: m[1].trim(), years: m[2].trim() };
  return { title: key.trim(), years: "" };
}

export default function ConstructorAchievements({
  constructorName,
  className = ""
}) {
  const driverObj = achievements[constructorName];

  // Группируем данные: title -> { 1: [years], 2: [years], 3: [years] }
  const grouped = useMemo(() => {
    if (!driverObj) return {};
    const map = {};
    for (const [rawKey, placeRaw] of Object.entries(driverObj)) {
      const place = Number(placeRaw) || 0;
      if (![1,2,3,4,5,6,7].includes(place)) continue; // игнорируем прочие места
      const { title, years } = parseKey(rawKey);
      if (!map[title]) map[title] = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
      map[title][place].push(years || "");
    }
    return map;
  }, [driverObj]);

  if (!driverObj) {
    return (
      <div className={`driver-achievements ${className}`} style={styles.container}>
        <div style={styles.empty}>Данные достижений не найдены.</div>
      </div>
    );
  }

  // helper: форматируем массив годов -> "2005, 2006" или "" -> пропускаем
  const joinYears = arr => arr.filter(Boolean).join(", ");

  return (
    <div className={`driver-achievements ${className}`} style={styles.container}>

      <div style={styles.list}>
        {Object.entries(grouped).map(([title, places]) => {
          // порядок вывода мест: 1,2,3 (чтобы сначала золото)
          const placeEntries = [1,2,3,4,5,6,7].map(p => ({ p, years: joinYears(places[p]) })).filter(e => e.years);
          if (placeEntries.length === 0) return null;

          return (
            <div key={title} style={styles.champBlock}>
              <div style={styles.champTitle}>{title}</div>

              {placeEntries.map(({ p, years }) => {
  const color = PLACE_COLORS[p] || "#999";
  
  // проверяем, есть ли 1,2,3 места вообще
  const hasTop3 = [1,2,3].some(top => places[top].length > 0);

  // текст статуса
  const status = PLACE_TEXT[p] || (hasTop3 ? `Место ${p}` : `Лучший результат: Место ${p}`);

  return (
    <div key={p} style={styles.placeRow}>
      <div
        className="achievement-icon"
        style={{
          ...styles.iconWrap,
          width: 25,
          height: 25,
          color: color
        }}
        aria-hidden="true"
      >
        <svg width="25" height="25" viewBox="0 0 25 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.90625 0.78125C3.90625 0.349778 4.25603 0 4.6875 0H20.3125C20.744 0 21.0938 0.349778 21.0938 0.78125C21.0938 1.62113 21.0752 2.42049 21.0398 3.18109C23.2833 3.53057 25 5.47105 25 7.8125C25 10.4013 22.9013 12.5 20.3125 12.5C19.9549 12.5 19.606 12.4598 19.2704 12.3836C18.0363 15.2981 16.3358 16.723 14.8438 17.0898V20.4838L17.0709 21.0405C17.3739 21.1163 17.6588 21.2519 17.9087 21.4393L20.7812 23.5938C21.0503 23.7955 21.16 24.1468 21.0537 24.4658C20.9473 24.7848 20.6488 25 20.3125 25H4.6875C4.35123 25 4.05268 24.7848 3.94634 24.4658C3.84 24.1468 3.94973 23.7955 4.21875 23.5938L7.09132 21.4393C7.34123 21.2519 7.62608 21.1163 7.92913 21.0405L10.1562 20.4838V17.0898C8.66417 16.723 6.96372 15.2981 5.7296 12.3836C5.39402 12.4598 5.04514 12.5 4.6875 12.5C2.09867 12.5 0 10.4013 0 7.8125C0 5.47105 1.71674 3.53057 3.96018 3.18109C3.9248 2.42049 3.90625 1.62113 3.90625 0.78125ZM4.06093 4.75033C2.63531 5.04048 1.5625 6.30121 1.5625 7.8125C1.5625 9.53839 2.96161 10.9375 4.6875 10.9375C4.85701 10.9375 5.02308 10.9241 5.18478 10.8983C4.66543 9.25839 4.26661 7.23357 4.06093 4.75033ZM19.8152 10.8983C19.9769 10.9241 20.143 10.9375 20.3125 10.9375C22.0384 10.9375 23.4375 9.53839 23.4375 7.8125C23.4375 6.30121 22.3647 5.04048 20.9391 4.75033C20.7334 7.23357 20.3346 9.25839 19.8152 10.8983Z"/>
        </svg>
      </div>

      <div style={styles.placeText}>
        <div style={styles.placeStatus}>{status}</div>
        <div style={styles.placeYears}>{years}</div>
      </div>
    </div>
  );
})}

            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Inline styles */
const styles = {
  container: {
    borderRadius: '15px', background: '#141416', display: 'flex', gap: '10px', flexDirection: 'column', overflowY: 'auto', padding: '10px'
  },
  empty: {
    color: "#666",
    fontSize: 14
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 0
  },
  champBlock: {
    padding: "8px",
    borderRadius: 8,
    background: "rgba(0,0,0,0.02)"
  },
  champTitle: {
    marginBottom: 8,
    fontSize: 14,
    color: 'white'
  },
  placeRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
    color: 'white'
  },
  iconWrap: {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
    // color is set inline per place
  },
  placeText: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0
  },
  placeStatus: {
    fontSize: 13,
  },
  placeYears: {
    fontSize: 13,
    color: "#555",
    marginTop: 2
  }
};
