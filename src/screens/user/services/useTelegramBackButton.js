import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useTelegramBackButton = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.BackButton.show();
    tg.BackButton.onClick(() => {
      navigate(-1);
    });

    return () => {
      tg.BackButton.hide();
      tg.BackButton.offClick();
    };
  }, []);
};
