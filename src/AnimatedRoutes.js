import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PilotsList from "./screens/PilotsList";
import PilotDetails from "./screens/PilotDetails";
import ConstructorsList from "./screens/ConstructorsList";
import ConstructorDetails from "./screens/ConstructorDetails";
import RacesList from "./screens/RacesList";
import RaceDetails from "./screens/RaceDetails";
import Feed from "./screens/Feed";

function AnimatedRoutes({ onConstructorSelect, selectedConstructor }) {
  const location = useLocation(); // Получаем текущий путь

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Feed /></PageWrapper>} />
        <Route path="/pilots" element={<PageWrapper><PilotsList /></PageWrapper>} />
        <Route path="/pilots/:id" element={<PageWrapper><PilotDetails /></PageWrapper>} />
        <Route path="/constructors" element={<PageWrapper><ConstructorsList onConstructorSelect={onConstructorSelect} /></PageWrapper>} />
        <Route path="/constructors/:id" element={<PageWrapper><ConstructorDetails constructor={selectedConstructor} /></PageWrapper>} />
        <Route path="/races" element={<PageWrapper><RacesList /></PageWrapper>} />
        <Route path="/races/:id" element={<PageWrapper><RaceDetails /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

// Компонент для плавного появления/исчезновения страниц
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} // Начальная анимация (сдвиг вправо)
      animate={{ opacity: 1, x: 0 }} // Проявление
      exit={{ opacity: 0, x: -20 }} // Исчезновение (сдвиг влево)
      transition={{ duration: 0.4 }} // Скорость анимации
      style={{
        position: "absolute",
        width: "100%",
        height: "calc(100vh - 100px)",
        display: "flex",
        justifyContent: "center", // Центрируем содержимое
        minHeight: "100vh", // Чтобы страница занимала весь экран
        paddingBottom: "20px", // Добавляем отступы
        boxSizing: "border-box" // Учитываем padding в ширине
      }}
    >
      <div style={{ width: "100%", maxWidth: "500px" }}> {/* Ограничиваем ширину */}
        {children}
      </div>
    </motion.div>
  );
}

export default AnimatedRoutes;
