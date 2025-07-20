// usePilots.js
import { useState, useEffect } from "react";
import { driverTranslations, driverToConstructor } from "./constants";

export const usePilots = () => {
  const [pilots, setPilots] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPilots = async () => {
      try {
        const res = await fetch(
          "https://api.jolpi.ca/ergast/f1/2025/driverStandings.json"
        );
        if (!res.ok) throw new Error("Network response was not ok");
        const json = await res.json();

        const standings =
          json.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];

        const pilotsFromApi = standings.map((item) => {
          const constructorName =
            item.Constructors[0]?.name || "Unknown";
          const fullName = `${item.Driver.givenName} ${item.Driver.familyName}`;
          const translatedName =
            driverTranslations[item.Driver.familyName] || fullName;

          return {
            Driver: {
              givenName: item.Driver.givenName,
              familyName: item.Driver.familyName,
              translatedName,
              nationality: item.Driver.nationality
            },
            Constructors: [{ name: constructorName }],
            position: Number(item.position),
            points: Number(item.points),
            extraStats: {
              wins: item.wins
            }
          };
        });

        // API уже возвращает по порядку, но на всякий случай
        pilotsFromApi.sort((a, b) => a.position - b.position);
        setPilots(pilotsFromApi);
      } catch (err) {
        console.error(err);
        setError("Ошибка при получении данных о пилотах");
      }
    };

    fetchPilots();
  }, []);

  return { pilots, error };
};
