// useConstructorsData.js
import { useState, useEffect } from "react";

export function useConstructorsData() {
  const [constructors, setConstructors] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);

  const fetchConstructors = async () => {
    try {
      const response = await fetch('https://api.jolpi.ca/ergast/f1/2025/constructorstandings.json');
      if (!response.ok) throw new Error("Не удалось получить данные о конструкторах");
      const data = await response.json();
      const constructorData = data?.MRData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings;
      if (constructorData && Array.isArray(constructorData)) {
        setConstructors(constructorData);
      } else {
        throw new Error("Данные о конструкторах отсутствуют или имеют неверный формат");
      }
    } catch (err) {
      console.error("Ошибка при получении данных о конструкторах:", err);
      setError("Ошибка при получении данных о конструкторах");
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch('https://api.jolpi.ca/ergast/f1/2025/driverstandings.json');
      if (!response.ok) throw new Error("Не удалось получить данные о пилотах");
      const data = await response.json();
      const driverData = data?.MRData?.StandingsTable?.StandingsLists[0]?.DriverStandings;
      if (driverData && Array.isArray(driverData)) {
        setDrivers(driverData);
      } else {
        throw new Error("Данные о пилотах отсутствуют или имеют неверный формат");
      }
    } catch (err) {
      console.error("Ошибка при получении данных о пилотах:", err);
      setError("Ошибка при получении данных о пилотах");
    }
  };

  useEffect(() => {
    fetchConstructors();
    fetchDrivers();
  }, []);

  return { constructors, drivers, error };
}
