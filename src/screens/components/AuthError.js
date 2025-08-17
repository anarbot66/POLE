import React from "react";
import { useNavigate } from "react-router-dom";

const AuthError = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка авторизации</h1>
      <p className="text-gray-800 text-lg">{message}</p>
      <p className="text-gray-500 mt-2 text-sm">
        Попробуйте перезапустить Mini App в Telegram
      </p>
    </div>
  );
};

export default AuthError;
