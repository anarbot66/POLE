import React, { useState, useMemo } from 'react';
import leftIcon from '../graphic/FormulaRunnerAssets/buttons/pixel-left.png';
import rightIcon from '../graphic/FormulaRunnerAssets/buttons/pixel-right.png';
import upIcon from '../graphic/FormulaRunnerAssets/buttons/pixel-up.png';
import downIcon from '../graphic/FormulaRunnerAssets/buttons/pixel-down.png';

export default function MobileControls({ onPress, onRelease }) {
  // здесь храним, какая кнопка сейчас «нажата»
  const [pressed, setPressed] = useState(null);

  const styles = useMemo(() => ({
    container: {
      left: 0,
      right: 0,
      display: 'flex',
      gap: '10px',
      padding: '0 20px',
      pointerEvents: 'none',
      zIndex: 10,
      justifyContent: 'center',
      marginTop: '10px'
    },
    column: {
      display: 'flex',
      gap: 10,
      pointerEvents: 'auto',
    },
    buttonBase: {
      width: 60,
      height: 60,
      backgroundColor: 'transparent',
      border: 'none',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'contain',
      touchAction: 'none',
      outline: 'none',
      transition: 'filter 0.1s ease',
    },
    left:   { backgroundImage: `url(${leftIcon})` },
    right:  { backgroundImage: `url(${rightIcon})` },
    up:     { backgroundImage: `url(${upIcon})` },
    down:   { backgroundImage: `url(${downIcon})` },
  }), []);

  const makeStyle = dir => ({
    ...styles.buttonBase,
    ...styles[dir],
    // если эта кнопка «pressed» — затемняем
    filter: pressed === dir ? 'brightness(0.7)' : 'none',
  });

  const handleTouchStart = dir => {
    setPressed(dir);
    onPress(dir);
  };
  const handleTouchEnd = dir => {
    setPressed(null);
    onRelease(dir);
  };

  return (
    <div style={styles.container}>
      <div style={styles.column}>
        <button
          style={makeStyle('left')}
          onTouchStart={() => handleTouchStart('left')}
          onTouchEnd={()   => handleTouchEnd('left')}
        />
        <button
          style={makeStyle('right')}
          onTouchStart={() => handleTouchStart('right')}
          onTouchEnd={()   => handleTouchEnd('right')}
        />
      </div>
      <div style={styles.column}>
        <button
          style={makeStyle('up')}
          onTouchStart={() => handleTouchStart('up')}
          onTouchEnd={()   => handleTouchEnd('up')}
        />
        <button
          style={makeStyle('down')}
          onTouchStart={() => handleTouchStart('down')}
          onTouchEnd={()   => handleTouchEnd('down')}
        />
      </div>
    </div>
  );
}
