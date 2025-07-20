// src/user/services/useTelegramBackButton.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useTelegramBackButton = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    // 1. Показываем кнопку «назад» в UI Telegram
    tg.BackButton.show();

    // 2. Обработчик системного «назад»
    const handleBack = () => {
      // если есть куда идти — уходим назад по истории React Router
      // иначе можно закрыть WebApp: tg.close();
      navigate(-1);
    };
    tg.onEvent("backButtonPressed", handleBack);

    // 3. Чистим всё при размонтировании
    return () => {
      tg.BackButton.hide();
      tg.offEvent("backButtonPressed", handleBack);
    };
  }, [navigate]);
};
