import React, { useState, useEffect } from 'react';

function Countdown({ targetTimestamp }) {
    const [timeLeft, setTimeLeft] = useState(() => {
      const diff = targetTimestamp - Date.now();
      return Math.max(0, diff);
    });
  
    useEffect(() => {
      const id = setInterval(() => {
        const diff = targetTimestamp - Date.now();
        setTimeLeft(Math.max(0, diff));
      }, 1000);
      return () => clearInterval(id);
    }, [targetTimestamp]);
  
    const hours = Math.floor(timeLeft / 1000 / 60 / 60);
    const mins = Math.floor((timeLeft / 1000 / 60) % 60);
    const secs = Math.floor((timeLeft / 1000) % 60);
  
    return (
      <span>
        {String(hours).padStart(2, '0')}ч&nbsp;
        {String(mins).padStart(2, '0')}м&nbsp;
        {String(secs).padStart(2, '0')}с
      </span>
    );
  }

  export default Countdown;
  