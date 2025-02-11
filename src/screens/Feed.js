import { useEffect, useState } from "react";

const Feed = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const userData = window.Telegram.WebApp.initDataUnsafe.user;
      if (userData) {
        setUser(userData);
      }
    }
  }, []);

  return (
    <div>
      {user ? (
        <h1>Привет, {user.first_name}!</h1>
      ) : (
        <h1>Не удалось получить данные</h1>
      )}
    </div>
  );
};

export default Feed;
