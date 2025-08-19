// useConstructorsData.js
import { useState, useEffect } from "react";

export function useConstructorsData() {
  const [constructors, setConstructors] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);

  // возвращает массив конструктора (Standings) и устанавливает state
  const fetchConstructors = async () => {
    try {
      const response = await fetch('https://api.jolpi.ca/ergast/f1/2025/constructorstandings.json');
      if (!response.ok) throw new Error("Не удалось получить данные о конструкторах");
      const data = await response.json();
      const constructorData = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings;
      if (constructorData && Array.isArray(constructorData)) {
        setConstructors(constructorData);
        return constructorData;
      } else {
        throw new Error("Данные о конструкторах отсутствуют или имеют неверный формат");
      }
    } catch (err) {
      console.error("Ошибка при получении данных о конструкторах:", err);
      setError("Ошибка при получении данных о конструкторах");
      return [];
    }
  };

  // загружает пилотов и вычисляет currentConstructorId для каждого
  const fetchDrivers = async (availableConstructorStandings = []) => {
    try {
      const response = await fetch('https://api.jolpi.ca/ergast/f1/2025/driverstandings.json');
      if (!response.ok) throw new Error("Не удалось получить данные о пилотах");
      const data = await response.json();
      const driverData = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings;
      if (driverData && Array.isArray(driverData)) {
        // список доступных constructorId из standings (например: ['mclaren','red_bull','rb',...])
        const availableConstructorIds = (availableConstructorStandings || []).map(c => c.Constructor?.constructorId).filter(Boolean);

        const mappedDrivers = driverData.map(ds => {
          // структура ds: { position, points, Driver:{...}, Constructors: [{constructorId, ...}, ...], ... }
          const constructorsList = ds.Constructors || [];

          // 1) Найдём конструкторы пилота, которые присутствуют в таблице конструкторов (Standings)
          const matches = constructorsList.filter(c => availableConstructorIds.includes(c.constructorId));

          let currentConstructorId = null;
          if (matches.length > 0) {
            // Берём последний матч — предполагаем, что он наиболее «свежий»
            currentConstructorId = matches[matches.length - 1].constructorId;
          } else if (constructorsList.length > 0) {
            // Если совпадений нет — fallback на первый в списке (минимум)
            currentConstructorId = constructorsList[0].constructorId || null;
          }

          return {
            ...ds,
            currentConstructorId,
          };
        });

        setDrivers(mappedDrivers);
      } else {
        throw new Error("Данные о пилотах отсутствуют или имеют неверный формат");
      }
    } catch (err) {
      console.error("Ошибка при получении данных о пилотах:", err);
      setError("Ошибка при получении данных о пилотах");
    }
  };

  // Оркестратор: сначала загрузим конструкторов, затем пилотов (чтобы знать availableConstructorIds)
  useEffect(() => {
    const load = async () => {
      const cons = await fetchConstructors();
      await fetchDrivers(cons);
    };
    load();
  }, []);

  return { constructors, drivers, error };
}
