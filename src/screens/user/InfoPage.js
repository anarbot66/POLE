import React from "react";
import { useParams, useNavigate } from "react-router-dom";


const InfoPage = () => {
    const navigate = useNavigate();
  return (
    <div className="fade-in" style={{ color: "#fff", padding: "15px" }}>
        <div style={{width: "100%"}}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
            marginBottom: "20px"
          }}
        >
          ← Назад
        </button>
        </div>
      <div className="mb-4">
        <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            className="bi bi-info-circle"
            viewBox="0 0 16 16"
          >
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 .88-.252 1.002-.598l.088-.416c.12-.495.348-.588.642-.588h.086l.082-.38-.45-.083c-.293-.07-.352-.176-.288-.468l.738-3.468c.194-.897-.105-1.319-.808-1.319-.545 0-.88.252-1.002.598l-.088.416z" />
          </svg>
          О приложении
        </h1>
      </div>

      <div className="mb-4">
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 16 16"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C12.1381 15.0539 13.5182 14.0332 14.4958 12.6716C15.4735 11.3101 15.9996 9.6762 16 8C16 3.58 12.42 0 8 0Z" />
          </svg>
          Использование API Jopica
        </h2>
        <p>
          Для получения данных мы используем API Jopica, которое предоставляет актуальную информацию о событиях и статистике.
        </p>
      </div>

      <div>
        <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 16 16"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M5.06209 12H8.5367C10.3414 12 11.4254 11.0918 11.4254 9.60352C11.4254 8.50195 10.6637 7.6875 9.52107 7.57031V7.4707C10.3531 7.33008 11.0035 6.53906 11.0035 5.6543C11.0035 4.35352 10.0484 3.54492 8.46053 3.54492H5.06209V12ZM6.37459 7.125V4.6582H8.15584C9.12849 4.6582 9.69685 5.11523 9.69685 5.89453C9.69685 6.69727 9.09334 7.125 7.93318 7.125H6.37459ZM6.37459 10.8867V8.16211H8.19685C9.43318 8.16211 10.0836 8.625 10.0836 9.50977C10.0836 10.4062 9.45662 10.8867 8.27303 10.8867H6.37459Z" />
            <path d="M0 4C0 1.79086 1.79086 0 4 0H12C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16H4C1.79086 16 0 14.2091 0 12V4ZM4 1C2.34315 1 1 2.34315 1 4V12C1 13.6569 2.34315 15 4 15H12C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1H4Z" />
          </svg>
          Использование Bootstrap Icons
        </h2>
        <p>
          В приложении использованы Bootstrap Icons для отображения удобных иконок в интерфейсе. Cсылка на официальный ресурс&nbsp;
          <a
            href="https://icons.getbootstrap.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#fff", textDecoration: "underline" }}
          >
            Bootstrap Icons
          </a>.
        </p>
      </div>
    </div>
  );
};

export default InfoPage;
