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
          padding: "10px",
          borderRadius: "8px",
          backgroundColor: "#212124",
          color: "white",
          cursor: "pointer",
          userSelect: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{selectedOption ? selectedOption.label : "Выберите опцию"}</span>
        {open ? (
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
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        ) : (
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
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </div>
      <CSSTransition in={open} timeout={300} classNames="fade" unmountOnExit>
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "#212124",
            borderRadius: "8px",
            overflow: "hidden",
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
          .fade-enter {
            opacity: 0;
          }
          .fade-enter-active {
            opacity: 1;
            transition: opacity 300ms;
          }
          .fade-exit {
            opacity: 1;
          }
          .fade-exit-active {
            opacity: 0;
            transition: opacity 300ms;
          }
        `}
      </style>
    </div>
  );
};

export default CustomSelect;
