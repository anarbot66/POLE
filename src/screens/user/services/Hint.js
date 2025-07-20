import React, { useEffect, useRef, useState, useCallback  } from "react";
import "./Hint.css";

const COLLAPSE_MS = 300;

const Hint = ({ isOpen, message, onClose, duration = 10000, label = "Подсказка" }) => {
  const [visible, setVisible] = useState(false);     // в DOM
  const [expanded, setExpanded] = useState(false);   // анимация показа
  const autoCloseTimer = useRef(null);
  const hideTimer = useRef(null);


  const handleClose = useCallback(() => {
    setExpanded(false);
    clearTimeout(autoCloseTimer.current);

    hideTimer.current = setTimeout(() => {
      setVisible(false);
      onClose();
    }, COLLAPSE_MS);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setTimeout(() => setExpanded(true), 10);

      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = setTimeout(() => handleClose(), duration);
    }
  }, [isOpen, duration, handleClose]); // теперь безопасно


  const handleClick = (e) => {
    e.stopPropagation();
    handleClose();
  };

  useEffect(() => {
    return () => {
      clearTimeout(autoCloseTimer.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`hint-container ${expanded ? "expanded" : "collapsed"}`}
      onClick={handleClick}
    >
      <div className="hint-content">
        {expanded ? message : message}
      </div>
    </div>
  );
};

export default Hint;
