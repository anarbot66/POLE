// Modal.js
import React from "react";
import { CSSTransition } from "react-transition-group";
import "./Modal.css";

const Modal = ({ show, onClose, message, buttonText = "Понятно" }) => (
  <CSSTransition in={show} timeout={250} classNames="fade" unmountOnExit>
    <div className="modal-bak" onClick={onClose}>
      <div className="commentGlass" onClick={e => e.stopPropagation()}>
        <div className="modal-message">{message}</div>
        <button className="modal-button" onClick={onClose}>
          {buttonText}
        </button>
      </div>
    </div>
  </CSSTransition>
);

export default Modal;
