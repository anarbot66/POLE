import React, { useState, useRef, useEffect } from "react";
import { CSSTransition } from "react-transition-group";

const CustomSelect = ({ options, value, onChange, style }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div style={{ position: "relative", ...style }} ref={containerRef}>
      <div
        onClick={() => setOpen((prev) => !prev)}
        style={{
          padding: "10px 10px 0px 10px",
          borderRadius: "8px",
          color: "white",
          cursor: "pointer",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span>{selectedOption ? selectedOption.label : "Выберите опцию"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginLeft: "8px" }}
        >
          {open ? (
            <path d="M18 15l-6-6-6 6" />
          ) : (
            <path d="M6 9l6 6 6-6" />
          )}
        </svg>
      </div>
      <CSSTransition in={open} timeout={300} classNames="menuFade" unmountOnExit>
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "#212124",
            borderRadius: "8px",
            overflowY: "auto", // Добавляем вертикальную прокрутку
            maxHeight: "200px", // Ограничиваем максимальную высоту списка
            zIndex: 10,
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              style={{
                padding: "10px",
                color: "white",
                cursor: "pointer",
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      </CSSTransition>
      <style>
        {`
          .menuFade-enter {
            opacity: 0;
            transform: scale(0.95);
          }
          .menuFade-enter-active {
            opacity: 1;
            transform: scale(1);
            transition: opacity 300ms ease, transform 300ms ease;
          }
          .menuFade-exit {
            opacity: 1;
            transform: scale(1);
          }
          .menuFade-exit-active {
            opacity: 0;
            transform: scale(0.95);
            transition: opacity 300ms ease, transform 300ms ease;
          }
        `}
      </style>
    </div>
  );
};

export default CustomSelect;
