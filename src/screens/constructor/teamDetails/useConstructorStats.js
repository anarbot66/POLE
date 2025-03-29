// useConstructorStats.js
import { useState, useEffect } from "react";
import { CONSTRUCTOR_API_NAMES } from "../../recources/json/constants";

export function useConstructorStats(constructor, season) {
  const [stats, setStats] = useState({
    wins: 0,
    podiums: 0,
    poles: 0,
    position: "-",
    points: "-"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!constructor) return;
    async function fetchStats() {
      try {
        const formattedConstructorName =
          CONSTRUCTOR_API_NAMES[constructor.Constructor.name] ||
          constructor.Constructor.name.toLowerCase().replace(/\s+/g, "");
        // Запрос результатов гонок
        const resultsUrl = `https://api.jolpi.ca/ergast/f1/${season}/constructors/${formattedConstructorName}/results.json?limit=100`;
        const resResults = await fetch(resultsUrl);
        const dataResults = await resResults.json();
        const racesData = dataResults.MRData?.RaceTable?.Races || [];
        let winCount = 0;
        let podiumCount = 0;
        let poleCount = 0;
        racesData.forEach((race) => {
          const top3Finishers = race.Results?.filter(
            (driver) => parseInt(driver.position) <= 3
          ) || [];
          const poleFinishers = race.Results?.filter(
            (driver) => driver.grid === "1"
          ) || [];
          if (top3Finishers.some((driver) => parseInt(driver.position) === 1))
            winCount++;
          if (top3Finishers.length > 0) podiumCount++;
          if (poleFinishers.length > 0) poleCount++;
        });
        // Запрос для получения данных о позиции и очках конструктора
        const standingsUrl = `https://api.jolpi.ca/ergast/f1/${season}/constructorstandings.json`;
        const resStandings = await fetch(standingsUrl);
        const dataStandings = await resStandings.json();
        const constructorData =
          dataStandings?.MRData?.StandingsTable?.StandingsLists[0]?.ConstructorStandings || [];
        const constructorInfo = constructorData.find(
          (item) => item.Constructor?.name === constructor.Constructor.name
        );
        const constructorPosition = constructorInfo ? constructorInfo.position : "-";
        const constructorPoints = constructorInfo ? constructorInfo.points : "-";
        setStats({
          wins: winCount,
          podiums: podiumCount,
          poles: poleCount,
          position: constructorPosition,
          points: constructorPoints
        });
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    }
    fetchStats();
  }, [constructor, season]);

  return { stats, loading, error };
}
