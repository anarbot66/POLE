// src/hooks/usePreloadImages.js
import { useEffect } from 'react';

function importAll(r) {
  return r.keys().map(r);
}

export function usePreloadImages() {
  useEffect(() => {
    const circuitImages = importAll(
      require.context(
        '../recources/images/circuits',
        false,
        /\.(png|jpe?g|svg|webp)$/
      )
    );
    const pilotImages = importAll(
      require.context(
        '../recources/images/pilots',
        false,
        /\.(png|jpe?g|svg|webp)$/
      )
    );
    const gameAssets = importAll(
      require.context(
        '../user/activity/games/graphic/FormulaRunnerAssets',
        false,
        /\.(png|jpe?g|svg|webp)$/
      )
    );
    const gameControls = importAll(
      require.context(
        '../user/activity/games/graphic/FormulaRunnerAssets/buttons',
        false,
        /\.(png|jpe?g|svg|webp)$/
      )
    );

    const allImages = [...circuitImages, ...pilotImages, ...gameAssets, gameControls];

    allImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);
}
