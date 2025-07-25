// screens/user/Services.js (или где тебе удобно)
import React from 'react';
import { toggleTheme } from '../../hooks/theme';

export default function Settings({ currentUser }) {
  return (
    <div>
      <h2>Сервисы и настройки</h2>
      <button onClick={() => toggleTheme(currentUser)}>Переключить тему</button>
    </div>
  );
}
