import React, { useState, useEffect } from 'react';

const ConstructorDetails = ({ constructor, goBack }) => {
  const [constructorResults, setConstructorResults] = useState(null);
  const [error, setError] = useState(null);

  const fetchConstructorResults = async (constructorName) => {
    try {
      const formattedConstructorName = constructorName.toLowerCase().replace(/\s+/g, '');

      const response = await fetch(`https://api.jolpi.ca/ergast/f1/2024/constructors/${formattedConstructorName}/results.json?limit=100`);
      if (!response.ok) {
        throw new Error('Не удалось получить данные о результатах конструктора');
      }

      const data = await response.json();
      const results = data?.MRData?.RaceTable?.Races;

      if (results && Array.isArray(results)) {
        setConstructorResults(results);
      } else {
        throw new Error("Не удалось получить результаты конструктора");
      }
    } catch (error) {
      console.error("Ошибка при получении данных о результатах конструктора:", error);
      setError("Ошибка при получении данных о результатах конструктора");
    }
  };

  useEffect(() => {
    if (constructor) {
      fetchConstructorResults(constructor.Constructor.name); // Передаем имя конструктора
    }
  }, [constructor]);

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  if (!constructorResults) {
    return <div> </div>;
  }

  const teamColor = "#00A19C"; // Например, для команды

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={goBack} style={{ marginBottom: '20px', padding: '10px', background: '#000', color: '#fff' }}>
        Назад
      </button>
      <h2>{constructor.Constructor.name}</h2>
      <div>
        <h3>Результаты:</h3>
        <ul>
          {constructorResults.map((race, index) => (
            <li key={index}>
              {race.raceName} - {race.date} - {race.Results[0]?.position}
            </li>
          ))}
        </ul>
      </div>

      {/* Статистика для двух пилотов */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {constructor.DriverStandings && constructor.DriverStandings.length >= 2 ? (
          constructor.DriverStandings.slice(0, 2).map((driver, index) => {
            return (
              <div key={index} style={{
                backgroundColor: teamColor,
                color: "white",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "10px",
                flex: 1
              }}>
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {driver.Driver.givenName} {driver.Driver.familyName}
                </div>
                <div style={{ fontSize: "14px" }}>
                  Позиция: {driver.position}
                </div>
                <div style={{ fontSize: "14px" }}>
                  Очки: {driver.points}
                </div>
                <div style={{ fontSize: "14px" }}>
                  Победы: {driver.wins}
                </div>
              </div>
            );
          })
        ) : (
          <div>Данные о пилотах не доступны</div>
        )}
      </div>
    </div>
  );
};

export default ConstructorDetails;
