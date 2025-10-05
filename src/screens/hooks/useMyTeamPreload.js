// src/hooks/useMyTeamPreload.js
import { useEffect } from 'react';

function importAll(r) {
  return r.keys().map(r);
}

export function useMyTeamPreload() {
  useEffect(() => {
    const cards = importAll(
      require.context(
        '../recources/images/cards',
        false,
        /\.(png|jpe?g|svg|webp)$/
      )
    );

    const packs = importAll(
      require.context(
        '../recources/images/packs',
        false,
        /\.(png|jpe?g|svg|webp)$/
      )
    );

    const menu = importAll(
      require.context(
        '../recources/images/menu',
        false,
        /\.(png|jpe?g|svg|webp)$/
      )
    );

    const allImages = [...cards, ...packs, ...menu];

    // предзагрузка
    allImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);
}
