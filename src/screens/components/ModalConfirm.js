// ModalConfirm.jsx
import React, { useState, useEffect } from "react";
import { CSSTransition } from "react-transition-group";
import "./ModalConfirm.css";

const ModalConfirm = ({
  show, 
  onClose,
  onConfirm, // (remember:boolean) => void
  title = "Подтверждение",
  message = "Вы уверены?",
  confirmText = "Да",
  cancelText = "Нет",
}) => {
  const [remember, setRemember] = useState(false);

  // Сбрасываем checkbox при открытии/закрытии
  useEffect(() => {
    if (!show) setRemember(false);
  }, [show]);

  return (
    <CSSTransition in={show} timeout={250} classNames="fade" unmountOnExit>
      <div className="modal-bak" onClick={onClose} role="dialog" aria-modal="true">
        <div className="commentGlass" onClick={(e) => e.stopPropagation()}>
          <div style={{display: 'flex', gap: '20px', flexDirection: 'column'}}>
          {title && <h3 style={{textAlign: 'center', fontWeight: 'bold'}}>{title}</h3>}
          <p className="modal-message">{message}</p>
          </div>

          <div style={{display: 'flex', gap: '10px'}}>
          <button
              className="modal-button modal-button-cancel"
              onClick={() => {
                onClose?.();
                setRemember(false);
              }}
            >
              {cancelText}
            </button>
          <button
              className="modal-button modal-button-confirm"
              onClick={() => {
                onConfirm?.(remember);
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </CSSTransition>
  );
};

export default ModalConfirm;
