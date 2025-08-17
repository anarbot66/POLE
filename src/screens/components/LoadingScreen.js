// LoadingScreen.js
import React from "react";
import logo from "../recources/images/racehub-logo.png";

const LoadingScreen = ({ progress, fadeOut }) => {
  return (
    <div className={`loading-screen ${fadeOut ? "fade-out" : "fade-in"}`}>
      <img src={logo} alt="Логотип" className="logo" />
    </div>
  );
};

export default LoadingScreen;
