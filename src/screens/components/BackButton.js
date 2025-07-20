// src/components/BackButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton = ({
  label = "Назад",
  className = "",
  style = {},
  iconSize = 20,
  ...props
}) => {
  const navigate = useNavigate();
  const handleGoBack = () => navigate(-1);

  return (
    <button
      onClick={handleGoBack}
      className={`topNavigateGlass ${className}`}
      style={{
        borderRadius: "20px",
        color: "white",
        fontSize: "10px",
        padding: "5px 12px 5px 10px",
        display: "flex",
        alignItems: "center",
        gap: "2px",
        width: '80px',
        ...style,
      }}
      {...props}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M15 10C15 10.3452 14.7202 10.625 14.375 10.625H7.13388L9.81694 13.3081C10.061 13.5521 10.061 13.9479 9.81694 14.1919C9.57286 14.436 9.17714 14.436 8.93306 14.1919L5.18306 10.4419C4.93898 10.1979 4.93898 9.80214 5.18306 9.55806L8.93306 5.80806C9.17714 5.56398 9.57286 5.56398 9.81694 5.80806C10.061 6.05214 10.061 6.44787 9.81694 6.69194L7.13388 9.375H14.375C14.7202 9.375 15 9.65482 15 10Z"
          fill="white"
        />
      </svg>
      {label}
    </button>
  );
};

export default BackButton;
