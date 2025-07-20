// SeasonPickerModal.jsx
import React from "react";
import ReactDOM from "react-dom";

const SeasonPickerModal = ({ seasons, isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Блюр-фон + полупрозрачная подложка */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(0,0,0,0.4)",
          zIndex: 1000,
        }}
      />

      {/* Модальное окно */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "340px",       // фиксированная ширина
          height: "500px",      // фиксированная высота
          padding: "30px",
          borderRadius: "30px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 1001,
        }}
      >
        {/* Заголовок */}
        <div
          style={{
            textAlign: "center",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "0.8px",
          }}
        >
          Сезоны пилота
        </div>

        {/* Контейнер для списка с прокруткой */}
        <div
          style={{
            flex: 1,             // занимать всё доступное пространство
            overflowY: "auto",   // прокрутка по вертикали
          }}
        >
          {seasons.map((year) => (
            <button
              key={year}
              onClick={() => { onSelect(year); onClose(); }}
              style={{
                width: "100%",
                marginBottom: "8px",
                padding: "11px 15px",
                borderRadius: "30px",
                border: "1px solid #505050",
                background: "transparent",
                color: "#fff",
                fontSize: "13px",
                fontFamily: "Inter",
                fontWeight: 500,
                letterSpacing: "0.65px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
};

export default SeasonPickerModal;
