// src/components/SeasonPickerModal.jsx
import React from "react";
import ReactDOM from "react-dom";
import { CSSTransition } from "react-transition-group";
import "./SeasonPickerModal.css";
import { TEAM_COLORS } from "../recources/json/constants";

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  let h = String(hex).replace("#", "").trim();
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const SeasonPickerModal = ({ seasons = {}, isOpen, onClose, onSelect, type }) => {
  // seasons ожидается как объект { "2024": "Red Bull", "2023": "McLaren", ... }
  const entries = Object.entries(seasons || {}).map(([y, t]) => [String(y), t]);

  // Сортируем по убыванию года (последние сезоны сверху)
  entries.sort((a, b) => Number(b[0]) - Number(a[0]));

  return ReactDOM.createPortal(
    <>
      <div
        onClick={onClose}
        className={`modal-backdrop ${isOpen ? "backdrop-show" : ""}`}
      />

      <CSSTransition
        in={isOpen}
        timeout={300}
        classNames="modal-slide"
        unmountOnExit
        appear
      >
        <div className="modal-window">
          <div className="modal-title">
            <span style={{ width: "100%" }}>Выберите сезон</span>
            <svg
              onClick={onClose}
              width="26"
              height="26"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.64645 4.64645C4.84171 4.45118 5.15829 4.45118 5.35355 4.64645L8 7.29289L10.6464 4.64645C10.8417 4.45118 11.1583 4.45118 11.3536 4.64645C11.5488 4.84171 11.5488 5.15829 11.3536 5.35355L8.70711 8L11.3536 10.6464C11.5488 10.8417 11.5488 11.1583 11.3536 11.3536C11.1583 11.5488 10.8417 11.5488 10.6464 11.3536L8 8.70711L5.35355 11.3536C5.15829 11.5488 4.84171 11.5488 4.64645 11.3536C4.45118 11.1583 4.45118 10.8417 4.64645 10.6464L7.29289 8L4.64645 5.35355C4.45118 5.15829 4.45118 4.84171 4.64645 4.64645Z"
                fill="white"
              />
            </svg>
          </div>

          <div className="modal-list">
            {entries.length === 0 && (
              <div className="modal-empty">Сезоны не найдены</div>
            )}

{entries.map(([year, team]) => {
  // team может быть строкой или null
  const teamStr = team || "";
  // Разбиваем по "/", убираем лишние пробелы
  const teamParts = teamStr.split("/").map(t => t.trim()).filter(Boolean);

  return (
    <button
      key={year}
      onClick={() => {
        onSelect && onSelect(year, team);
        onClose && onClose();
      }}
      className="modal-item"
      type="button"
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 10, width: '100%'}}>
        <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 8}}>
          <span className="season-year">{year}</span>

          {type === "driver" && teamParts.length > 0 && (
  <div className="team-badges" aria-hidden>
    {teamParts.map((t, i) => {
      const color = TEAM_COLORS[t] || "#999"; // fallback
      return (
        <React.Fragment key={t}>
          <span
            className="team-badge"
            title={t}
            style={{
              borderColor: color,
              color: color,
            }}
          >
            {t}
          </span>
          {i < teamParts.length - 1 && (
            <span className="team-separator"> & </span>
          )}
        </React.Fragment>
      );
    })}
  </div>
)}

        </div>

        {/* можно показать иконку стрелки/чек справа, если нужно */}
      </div>
    </button>
  );
})}

          </div>
        </div>
      </CSSTransition>
    </>,
    document.body
  );
};

export default SeasonPickerModal;
