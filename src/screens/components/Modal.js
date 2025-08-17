// Modal.js
import React from "react";
import { CSSTransition } from "react-transition-group";
import "./Modal.css";

/**
 * Универсальный модальный компонент в стиле "commentGlass"
 * Props:
 *  - show: boolean — открыть/закрыть модалку
 *  - onClose: () => void — коллбэк при закрытии
 *  - message: string — текст уведомления
 *  - buttonText?: string — текст кнопки (по умолчанию "Понятно")
 */
const Modal = ({ show, onClose, message, buttonText = "Понятно" }) => (
  <CSSTransition in={show} timeout={300} classNames="fade" unmountOnExit>
    <div className="modal-bak" onClick={onClose}>
      <div className="commentGlass" onClick={e => e.stopPropagation()}>
        <p className="modal-message">{message}</p>
        <button className="modal-button" onClick={onClose}>
          {buttonText}
        </button>
      </div>
    </div>
  </CSSTransition>
);

export default Modal;
