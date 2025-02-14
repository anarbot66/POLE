import React from "react";
import PilotsList from "./PilotsList";
import ConstructorsList from "./ConstructorsList";

const Standings = ({ onSelectPilot, onSelectConstructor }) => {
  const [activeTab, setActiveTab] = React.useState('pilots'); // Хранение активной вкладки

  // Функция для смены вкладки
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div>
      {/* Кнопки для переключения вкладок */}
      <div>
        <button
          onClick={() => handleTabChange('pilots')}
          style={activeTab === 'pilots' ? { backgroundColor: 'blue', color: 'white' } : {}}
        >
          Пилоты
        </button>
        <button
          onClick={() => handleTabChange('constructors')}
          style={activeTab === 'constructors' ? { backgroundColor: 'blue', color: 'white' } : {}}
        >
          Конструкторы
        </button>
      </div>

      {/* Рендерим соответствующий список в зависимости от вкладки */}
      {activeTab === 'pilots' && <PilotsList onSelectPilot={onSelectPilot} />}
      {activeTab === 'constructors' && <ConstructorsList onSelectConstructor={onSelectConstructor} />}
    </div>
  );
};

export default Standings;
