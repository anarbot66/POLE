// GameRulesModal.js
import React from "react";
import { CSSTransition } from "react-transition-group";
import "../../../../components/Modal.css";

// Словарь: ключ — тип игры, значение — массив правил
const gameRules = {
  wordle: [
    "Угадайте фамилию чемпиона Ф1 за 5 попыток.",
    "Каждая попытка должна быть ровно той же длины, что и ответ.",
    "После угадывания буквы подсвечиваются:",
    "Зелёный — буква на правильном месте.",
    "Жёлтый — буква есть в слове, но в другом месте.",
    "Серый — буквы нет в слове."
  ],
  race: [
    "Уворачивайтесь от препятствий",
    "Собирайте бонусы AP/GS",
    "Игра постоянно ускоряется",
    "Каждые 100 очков это +10AP и +1GS",
  ]
};

const GameRulesModal = ({
  show,
  onClose,
  gameType,
  buttonText = "Понятно"
}) => {
  const rules = gameRules[gameType] || [];
  
  return (
    <CSSTransition in={show} timeout={300} classNames="fade" unmountOnExit>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="commentGlass" onClick={e => e.stopPropagation()}>
          <h3 className="modal-title">Правила игры</h3>
          <div 
            className="modal-rules-list" 
            style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "12px 0" }}
          >
            {rules.map((text, idx) => (
              <p key={idx} className="modal-message">{text}</p>
            ))}
          </div>
          <button className="modal-button" onClick={onClose}>
            {buttonText}
          </button>
        </div>
      </div>
    </CSSTransition>
  );
};

export default GameRulesModal;
