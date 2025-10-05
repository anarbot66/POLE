// src/components/DriverPickerModal.jsx
import React from "react";
import ReactDOM from "react-dom";
import { CSSTransition } from "react-transition-group";
import "./SeasonPickerModal.css"; // можно переиспользовать стили SeasonPickerModal

// Путь подкорректируй, если у тебя константы лежат в другом месте
import { DRIVER_TRANSLATIONS } from "../recources/json/constants";
import { nationalityToFlag } from '../pilots/driverList/constants'; // как в RaceDetails

const DriverPickerModal = ({ isOpen, onClose, drivers = [], onSelect, title }) => {

  // удаляет диакритические знаки (accents) для попытки поиска
  function removeDiacritics(str = '') {
    return String(str).normalize?.('NFD')?.replace(/[\u0300-\u036f]/g, '') || str;
  }

  // попытки перевода: exact -> normalized -> alt ordering -> family -> fallback original
  function translateDriverName(givenName, familyName) {
    const parts = [];
    if (givenName) parts.push(String(givenName).trim());
    if (familyName) parts.push(String(familyName).trim());
    const full = parts.join(' ').trim();

    if (!full) return '';

    if (DRIVER_TRANSLATIONS && DRIVER_TRANSLATIONS[full]) return DRIVER_TRANSLATIONS[full];

    const fullNorm = removeDiacritics(full);
    if (DRIVER_TRANSLATIONS && DRIVER_TRANSLATIONS[fullNorm]) return DRIVER_TRANSLATIONS[fullNorm];

    const alt = familyName ? `${familyName} ${givenName || ''}`.trim() : full;
    if (DRIVER_TRANSLATIONS && DRIVER_TRANSLATIONS[alt]) return DRIVER_TRANSLATIONS[alt];
    const altNorm = removeDiacritics(alt);
    if (DRIVER_TRANSLATIONS && DRIVER_TRANSLATIONS[altNorm]) return DRIVER_TRANSLATIONS[altNorm];

    if (familyName && DRIVER_TRANSLATIONS && DRIVER_TRANSLATIONS[familyName]) return DRIVER_TRANSLATIONS[familyName];
    const familyNorm = removeDiacritics(familyName || '');
    if (familyName && DRIVER_TRANSLATIONS && DRIVER_TRANSLATIONS[familyNorm]) return DRIVER_TRANSLATIONS[familyNorm];

    return full;
  }

  // получить код страны/флага для драйвера
  function getCountryCodeForDriver(d) {
    // Попробуем несколько полей, которые могут содержать национальность
    const nat = d.nationality || d.nation || d.country || d.countryName || d.nationalityName || '';
    const code = (nat && nationalityToFlag && nationalityToFlag[nat]) ? nationalityToFlag[nat] : null;
    if (code) return String(code).toLowerCase();
    // Если в карточке уже есть код (например "br", "gb"), вернём его
    if (d.countryCode) return String(d.countryCode).toLowerCase();
    if (d.natCode) return String(d.natCode).toLowerCase();
    // fallback
    return 'un';
  }

  return ReactDOM.createPortal(
    <>
      <div
        onClick={onClose}
        className="modal-backdrop backdrop-show"
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
            <span style={{ width: "100%" }}>{title || "Выберите пилота"}</span>
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
                d="M4.64645 4.64645C4.84171 4.45118 5.15829 4.45118 5.35355 4.64645L8 7.29289L10.6464 4.64645C10.8417 4.45118 11.1583 4.45118 11.3536 4.64645C11.5488 4.84171 11.5488 5.15829 11.3536 5.35355L8.70711 8L11.3536 10.6464C11.5488 10.8417 11.5488 11.1583 11.3536 11.3536C11.1583 11.5488 10.8417 11.5488 10.6464 11.3536L8 8.70711L5.35355 11.3536C5.15829 11.5488 4.84171 11.5488 4.64645 11.3536C4.45118 11.1583 4.45118 10.8417 4.64645 10.6464L7.29289 8L4.64645 5.35355C4.45118 5.15829 4.45118 4.84171 4.64645 4.64645Z"
                fill="white"
              />
            </svg>
          </div>

          <div className="modal-list">
            {(!drivers || drivers.length === 0) && (
              <div className="modal-empty">Пилоты не найдены</div>
            )}

            {(drivers || []).map((d) => {
              // аккуратно формируем оригинальное полное имя
              const fullNameOriginal = `${d.givenName || ''} ${d.familyName || ''}`.trim();
              const displayName = translateDriverName(d.givenName, d.familyName);
              const code = getCountryCodeForDriver(d);
              const flagUrl = `https://flagcdn.com/w40/${code}.png`;

              return (
                <button
                  key={d.driverId || fullNameOriginal}
                  onClick={() => {
                    onSelect && onSelect(d.driverId);
                    onClose && onClose();
                  }}
                  className="driver-picker-item"
                  type="button"
                  title={fullNameOriginal} // показываем оригинал в tooltip
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  {/* Кружок с флагом */}
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#222' // фон на случай, если флаг не загрузится
                  }}>
                    <img
                      src={flagUrl}
                      alt={code}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/cards/card_placeholder.png'; }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: 'white', fontWeight: 500 }}>
                      {displayName}
                    </span>
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

export default DriverPickerModal;
