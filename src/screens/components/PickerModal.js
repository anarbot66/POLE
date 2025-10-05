// src/components/PickerModal.jsx
import React from "react";
import ReactDOM from "react-dom";
import { CSSTransition } from "react-transition-group";
import "./SeasonPickerModal.css"; // переиспользуем стили

const PickerModal = ({ 
  isOpen, 
  onClose, 
  options = [], 
  onSelect, 
  title = "Выберите" 
}) => {
  return ReactDOM.createPortal(
    <>
      {/* Фон */}
      <div
        onClick={onClose}
        className="modal-backdrop backdrop-show"
      />

      {/* Окно с анимацией */}
      <CSSTransition
        in={isOpen}
        timeout={300}
        classNames="modal-slide"
        unmountOnExit
        appear
      >
        <div className="modal-window">
          <div className="modal-title">
            <span style={{ width: "100%" }}>{title}</span>
            <svg
              onClick={onClose}
              width="26"
              height="26"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ cursor: "pointer" }}
            >
              <path
                d="M4.64645 4.64645C4.84171 4.45118 5.15829 4.45118 5.35355 4.64645L8 7.29289L10.6464 4.64645C10.8417 4.45118 11.1583 4.45118 11.3536 4.64645C11.5488 4.84171 11.5488 5.15829 11.3536 5.35355L8.70711 8L11.3536 10.6464C11.5488 10.8417 11.5488 11.1583 11.3536 11.3536C11.1583 11.5488 10.8417 11.5488 10.6464 11.3536L8 8.70711L5.35355 11.3536C5.15829 11.5488 4.84171 11.5488 4.64645 11.3536C4.45118 11.1583 4.45118 10.84171 4.64645 10.6464L7.29289 8L4.64645 5.35355C4.45118 5.15829 4.45118 4.84171 4.64645 4.64645Z"
                fill="white"
              />
            </svg>
          </div>

          <div className="modal-list">
            {options.length === 0 && (
              <div className="modal-empty">Нет вариантов</div>
            )}

            {options.map((opt, idx) => {
              const label = typeof opt === "string" ? opt : opt.name || String(opt);
              const value = typeof opt === "string" ? opt : opt.value || opt;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    onSelect && onSelect(value);
                    onClose && onClose();
                  }}
                  className="driver-picker-item"
                  type="button"
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <span style={{ color: 'white', fontWeight: 500 }}>
                    {label}
                  </span>
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

export default PickerModal;
