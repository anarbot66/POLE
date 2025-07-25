// src/utils/theme.js
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const THEME_KEY = 'theme';

export async function initTheme(user) {
  if (user) {
    try {
      const ref = doc(db, 'settings', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const dbTheme = snap.data().theme;
        if (dbTheme === 'light' || dbTheme === 'dark') {
          localStorage.setItem(THEME_KEY, dbTheme);
          applyTheme(dbTheme);
          return;
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки темы:', e);
    }
  }

  let theme = localStorage.getItem(THEME_KEY);
  if (theme !== 'light' && theme !== 'dark') {
    theme = 'dark';
    localStorage.setItem(THEME_KEY, theme);
  }
  applyTheme(theme);
}


export function toggleTheme(user) {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  if (user) {
    const ref = doc(db, 'settings', user.uid);
    setDoc(ref, { theme: next }, { merge: true });
  }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
